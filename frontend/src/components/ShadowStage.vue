<template>
  <div ref="containerRef" class="stage-container">
    <div v-if="contextLost" class="gl-error-overlay">
      <div class="gl-error-content">
        <p>🎬 渲染恢复中...</p>
        <button @click="restoreContext">点击恢复</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, shallowRef } from 'vue';
import * as THREE from 'three';

const props = defineProps({
  puppetModel: Object,
  stageConfig: Object,
  currentTime: { type: Number, default: 0 },
  isPlaying: { type: Boolean, default: false }
});

const emit = defineEmits(['context-restored', 'context-lost']);

const containerRef = ref(null);
const contextLost = ref(false);

let scene, camera, renderer, animationId;
let puppetParts = {};
let stageLights = {};
let propMesh = null;
let puppetGroup = null;

const _lightColorCache = {};
const _tempVec3 = new THREE.Vector3();
const _tempEuler = new THREE.Euler();
const _tempColor = new THREE.Color();

let lastTime = 0;
let frameCount = 0;
let fpsTime = 0;
let currentFps = 60;
let currentTension = { head: 0, body: 0, leftArm: 0, rightArm: 0, staff: 0, leftLeg: 0, rightLeg: 0 };

const TENSION_PARTS = ['head', 'body', 'leftArm', 'rightArm', 'staff', 'leftLeg', 'rightLeg'];
const TENSION_WEIGHTS = { rotation: 0.7, position: 0.3 };
const TENSION_MAX_ROT = 2.5;
const TENSION_MAX_POS = 0.8;

const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

const computeTension = (pose) => {
  const result = {};
  if (!pose || !defaultPose) {
    TENSION_PARTS.forEach(p => result[p] = 0);
    return result;
  }

  for (let i = 0; i < TENSION_PARTS.length; i++) {
    const part = TENSION_PARTS[i];
    const cur = pose[part];
    const def = defaultPose[part];
    if (!cur || !def) {
      result[part] = 0;
      continue;
    }

    let rotDist = 0;
    const cr = cur.rotation || [0, 0, 0];
    const dr = def.rotation || [0, 0, 0];
    for (let a = 0; a < 3; a++) rotDist += Math.abs(cr[a] - dr[a]);
    const rotScore = clamp(rotDist / TENSION_MAX_ROT, 0, 1);

    let posDist = 0;
    const cp = cur.position || [0, 0, 0];
    const dp = def.position || [0, 0, 0];
    for (let a = 0; a < 3; a++) posDist += (cp[a] - dp[a]) ** 2;
    posDist = Math.sqrt(posDist);
    const posScore = clamp(posDist / TENSION_MAX_POS, 0, 1);

    result[part] = clamp(
      rotScore * TENSION_WEIGHTS.rotation + posScore * TENSION_WEIGHTS.position,
      0,
      1
    );
  }
  return result;
};

let actionData = [];
let propData = [];
let musicData = {};
let defaultPose = null;
let duration = 8;

let poseCache = null;
let poseCacheTime = -1;

const setActionData = (actions) => { actionData = actions || []; };
const setPropData = (props) => { propData = props || []; };
const setMusicData = (music) => { musicData = music || {}; };
const setDefaultPose = (pose) => { defaultPose = pose; };
const setDuration = (d) => { duration = d; };

const getOrCreateColor = (hex) => {
  if (!_lightColorCache[hex]) {
    _lightColorCache[hex] = new THREE.Color(hex);
  }
  return _lightColorCache[hex];
};

const initScene = () => {
  const container = containerRef.value;
  const width = container.clientWidth;
  const height = container.clientHeight;

  scene = new THREE.Scene();
  scene.background = new THREE.Color(props.stageConfig?.backgroundColor || '#1a0a00');

  camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
  camera.position.set(0, 1, 12);
  camera.lookAt(0, 1, 0);

  const pixelRatio = Math.min(window.devicePixelRatio, 1.5);
  
  renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance',
    preserveDrawingBuffer: false,
    failIfMajorPerformanceCaveat: false
  });
  renderer.setPixelRatio(pixelRatio);
  renderer.setSize(width, height, false);
  renderer.shadowMap.enabled = false;
  renderer.info.autoReset = false;

  container.appendChild(renderer.domElement);

  setupContextLossHandling();
  createStageFrame();
  createBackScreen();
  createLights();
  createPuppet();
  createProp();
  createCurtains();
};

const setupContextLossHandling = () => {
  const canvas = renderer.domElement;
  
  canvas.addEventListener('webglcontextlost', (event) => {
    event.preventDefault();
    cancelAnimationFrame(animationId);
    contextLost.value = true;
    emit('context-lost');
    console.warn('WebGL Context Lost - 正在尝试恢复...');
  });

  canvas.addEventListener('webglcontextrestored', () => {
    console.log('WebGL Context Restored - 重新初始化渲染器');
    restoreContext();
  });
};

const restoreContext = () => {
  try {
    const canvas = renderer.domElement;
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    
    if (gl && gl.getContextAttributes()) {
      renderer.dispose();
      disposeScene();
      initScene();
      if (defaultPose) applyPoseDirect(defaultPose);
      contextLost.value = false;
      emit('context-restored');
      startAnimation();
    }
  } catch (e) {
    console.error('恢复WebGL上下文失败:', e);
  }
};

const disposeScene = () => {
  scene.traverse((obj) => {
    if (obj.geometry) obj.geometry.dispose();
    if (obj.material) {
      if (Array.isArray(obj.material)) {
        obj.material.forEach(m => m.dispose());
      } else {
        obj.material.dispose();
      }
    }
  });
};

const createStageFrame = () => {
  const frameColor = props.stageConfig?.frameColor || '#8B4513';
  const frameMaterial = new THREE.MeshBasicMaterial({ color: frameColor });

  const topBar = new THREE.Mesh(new THREE.BoxGeometry(18, 0.4, 0.5), frameMaterial);
  topBar.position.set(0, 5.5, 0.1);
  scene.add(topBar);

  const bottomBar = new THREE.Mesh(new THREE.BoxGeometry(18, 0.4, 0.5), frameMaterial);
  bottomBar.position.set(0, -4.5, 0.1);
  scene.add(bottomBar);

  const leftBar = new THREE.Mesh(new THREE.BoxGeometry(0.4, 10.4, 0.5), frameMaterial);
  leftBar.position.set(-8.8, 0.5, 0.1);
  scene.add(leftBar);

  const rightBar = new THREE.Mesh(new THREE.BoxGeometry(0.4, 10.4, 0.5), frameMaterial);
  rightBar.position.set(8.8, 0.5, 0.1);
  scene.add(rightBar);
};

const createBackScreen = () => {
  const screenGeometry = new THREE.PlaneGeometry(17.6, 9.6);
  const screenMaterial = new THREE.MeshBasicMaterial({
    color: '#fff8e1',
    transparent: true,
    opacity: 0.85
  });
  const screen = new THREE.Mesh(screenGeometry, screenMaterial);
  screen.position.set(0, 0.5, -0.1);
  scene.add(screen);
};

const createCurtains = () => {
  const curtainColor = props.stageConfig?.curtainColor || '#DC143C';
  const curtainMaterial = new THREE.MeshBasicMaterial({
    color: curtainColor,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.9
  });

  const leftCurtain = new THREE.Mesh(new THREE.PlaneGeometry(3, 9.5), curtainMaterial);
  leftCurtain.position.set(-6.3, 0.5, 0.05);
  scene.add(leftCurtain);

  const rightCurtain = new THREE.Mesh(new THREE.PlaneGeometry(3, 9.5), curtainMaterial);
  rightCurtain.position.set(6.3, 0.5, 0.05);
  scene.add(rightCurtain);
};

const createLights = () => {
  const ambient = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambient);

  const backLight = new THREE.PointLight(0xffffff, 0.8, 30);
  backLight.position.set(0, 2, -3);
  scene.add(backLight);
  stageLights.back = backLight;

  const leftLight = new THREE.PointLight(0xff4500, 0, 18);
  leftLight.position.set(-6, 3, 3);
  scene.add(leftLight);
  stageLights.left = leftLight;

  const rightLight = new THREE.PointLight(0xffd700, 0, 18);
  rightLight.position.set(6, 3, 3);
  scene.add(rightLight);
  stageLights.right = rightLight;

  const centerLight = new THREE.PointLight(0xff0000, 0, 22);
  centerLight.position.set(0, 4, 2);
  scene.add(centerLight);
  stageLights.center = centerLight;
};

const createPuppet = () => {
  if (!props.puppetModel?.parts) return;

  puppetGroup = new THREE.Group();
  puppetGroup.position.set(0, 0, 0);

  Object.entries(props.puppetModel.parts).forEach(([name, part]) => {
    const geometry = new THREE.BoxGeometry(...part.size);
    const material = new THREE.MeshBasicMaterial({
      color: part.color,
      side: THREE.DoubleSide
    });
    
    const edges = new THREE.EdgesGeometry(geometry);
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
    const wireframe = new THREE.LineSegments(edges, lineMaterial);

    const mesh = new THREE.Mesh(geometry, material);
    mesh.add(wireframe);
    
    mesh.position.set(...part.position);
    mesh.userData = { partName: name };

    puppetParts[name] = mesh;
    puppetGroup.add(mesh);
  });

  addFaceDetails();
  scene.add(puppetGroup);
};

const addFaceDetails = () => {
  const head = puppetParts.head;
  if (!head) return;

  const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
  const leftEye = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.08, 0.02), eyeMaterial);
  leftEye.position.set(-0.15, 0.1, 0.06);
  head.add(leftEye);

  const rightEye = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.08, 0.02), eyeMaterial);
  rightEye.position.set(0.15, 0.1, 0.06);
  head.add(rightEye);

  const mouthMaterial = new THREE.MeshBasicMaterial({ color: 0x8B0000 });
  const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.05, 0.02), mouthMaterial);
  mouth.position.set(0, -0.2, 0.06);
  head.add(mouth);
};

const createProp = () => {
  const propGeometry = new THREE.PlaneGeometry(4, 2);
  const propMaterial = new THREE.MeshBasicMaterial({
    color: '#FFE4E1',
    transparent: true,
    opacity: 0
  });
  propMesh = new THREE.Mesh(propGeometry, propMaterial);
  propMesh.position.set(0, 3, -0.05);
  scene.add(propMesh);
};

const computePoseAtTime = (time) => {
  if (poseCache && poseCacheTime === time) {
    return poseCache;
  }

  if (!actionData.length || !defaultPose) {
    poseCache = null;
    poseCacheTime = time;
    return null;
  }

  const actions = actionData;
  let prevAction = null;
  let nextAction = null;

  for (let i = 0; i < actions.length; i++) {
    const action = actions[i];
    if (time >= action.time && time < action.time + action.duration) {
      prevAction = action;
      nextAction = actions[i + 1];
      break;
    }
    if (time < action.time) {
      nextAction = action;
      prevAction = actions[i - 1];
      break;
    }
  }

  if (!prevAction) prevAction = actions[actions.length - 1];
  if (!nextAction) nextAction = { time: duration, pose: defaultPose };

  const segmentStart = prevAction.time;
  const segmentDuration = Math.max((nextAction.time || duration) - segmentStart, 0.001);
  const localTime = Math.max(0, Math.min(time - segmentStart, segmentDuration));
  const t = localTime / segmentDuration;

  const smoothT = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

  const result = {};
  const partNames = Object.keys(defaultPose);

  for (let i = 0; i < partNames.length; i++) {
    const part = partNames[i];
    const fromPose = prevAction.pose?.[part] || defaultPose[part];
    const toPose = nextAction.pose?.[part] || fromPose;
    const fromPos = fromPose.position || defaultPose[part].position;
    const toPos = toPose.position || defaultPose[part].position;
    const fromRot = fromPose.rotation || defaultPose[part].rotation;
    const toRot = toPose.rotation || defaultPose[part].rotation;

    result[part] = {
      position: [
        lerp(fromPos[0], toPos[0], smoothT),
        lerp(fromPos[1], toPos[1], smoothT),
        lerp(fromPos[2], toPos[2], smoothT)
      ],
      rotation: [
        lerp(fromRot[0], toRot[0], smoothT),
        lerp(fromRot[1], toRot[1], smoothT),
        lerp(fromRot[2], toRot[2], smoothT)
      ]
    };
  }

  poseCache = result;
  poseCacheTime = time;
  return result;
};

const applyPoseDirect = (pose) => {
  if (!pose || !puppetParts) return;
  
  Object.entries(pose).forEach(([partName, transform]) => {
    const part = puppetParts[partName];
    if (!part) return;
    if (transform.position) part.position.set(...transform.position);
    if (transform.rotation) part.rotation.set(...transform.rotation);
  });
};

const updatePuppetPose = (pose, blendFactor = 0.15) => {
  if (!pose || !puppetParts) return;

  const partNames = Object.keys(pose);
  for (let i = 0; i < partNames.length; i++) {
    const partName = partNames[i];
    const part = puppetParts[partName];
    const transform = pose[partName];
    if (!part || !transform) continue;

    if (transform.position) {
      const tp = transform.position;
      part.position.x = lerp(part.position.x, tp[0], blendFactor);
      part.position.y = lerp(part.position.y, tp[1], blendFactor);
      part.position.z = lerp(part.position.z, tp[2], blendFactor);
    }

    if (transform.rotation) {
      const tr = transform.rotation;
      part.rotation.x = lerp(part.rotation.x, tr[0], blendFactor);
      part.rotation.y = lerp(part.rotation.y, tr[1], blendFactor);
      part.rotation.z = lerp(part.rotation.z, tr[2], blendFactor);
    }
  }
};

const computeActiveMusic = (time) => {
  if (!musicData) return { gong: 0, drum: 0, cymbal: 0, gongColor: null, drumColor: null, cymbalColor: null };

  const tolerance = 0.15;
  let gongIntensity = 0;
  let drumIntensity = 0;
  let cymbalIntensity = 0;
  let gongColor = null;
  let drumColor = null;
  let cymbalColor = null;

  const gongEvents = musicData.gong || [];
  for (let i = 0; i < gongEvents.length; i++) {
    const e = gongEvents[i];
    if (time >= e.time - tolerance && time < e.time + e.duration + tolerance) {
      const progress = Math.max(0, Math.min(1, (time - e.time + tolerance) / (e.duration + tolerance * 2)));
      const attack = progress < 0.3 ? progress / 0.3 : 1 - (progress - 0.3) / 0.7;
      gongIntensity = Math.max(gongIntensity, (e.intensity || 0.5) * attack);
      gongColor = e.color;
    }
  }

  const drumEvents = musicData.drum || [];
  for (let i = 0; i < drumEvents.length; i++) {
    const e = drumEvents[i];
    if (time >= e.time - tolerance && time < e.time + e.duration + tolerance) {
      const progress = Math.max(0, Math.min(1, (time - e.time + tolerance) / (e.duration + tolerance * 2)));
      const attack = progress < 0.2 ? progress / 0.2 : 1 - (progress - 0.2) / 0.8;
      drumIntensity = Math.max(drumIntensity, (e.intensity || 0.5) * attack);
      drumColor = e.color;
    }
  }

  const cymbalEvents = musicData.cymbal || [];
  for (let i = 0; i < cymbalEvents.length; i++) {
    const e = cymbalEvents[i];
    if (time >= e.time - tolerance && time < e.time + e.duration + tolerance) {
      const progress = Math.max(0, Math.min(1, (time - e.time + tolerance) / (e.duration + tolerance * 2)));
      const attack = progress < 0.25 ? progress / 0.25 : 1 - (progress - 0.25) / 0.75;
      cymbalIntensity = Math.max(cymbalIntensity, (e.intensity || 0.5) * attack);
      cymbalColor = e.color;
    }
  }

  return { gong: gongIntensity, drum: drumIntensity, cymbal: cymbalIntensity, gongColor, drumColor, cymbalColor };
};

const updateLights = (musicState, dt) => {
  const decay = Math.pow(0.3, dt);

  if (musicState.gong > 0 && musicState.gongColor) {
    const color = getOrCreateColor(musicState.gongColor);
    stageLights.center.color.lerp(color, 0.5);
    stageLights.center.intensity = Math.min(
      Math.max(stageLights.center.intensity, musicState.gong * 2.5),
      3
    );
  } else {
    stageLights.center.intensity *= decay;
  }

  if (musicState.drum > 0 && musicState.drumColor) {
    const color = getOrCreateColor(musicState.drumColor);
    stageLights.left.color.lerp(color, 0.5);
    stageLights.left.intensity = Math.min(
      Math.max(stageLights.left.intensity, musicState.drum * 2),
      2.5
    );
  } else {
    stageLights.left.intensity *= decay;
  }

  if (musicState.cymbal > 0 && musicState.cymbalColor) {
    const color = getOrCreateColor(musicState.cymbalColor);
    stageLights.right.color.lerp(color, 0.5);
    stageLights.right.intensity = Math.min(
      Math.max(stageLights.right.intensity, musicState.cymbal * 2),
      2.5
    );
  } else {
    stageLights.right.intensity *= decay;
  }
};

const computeActiveProp = (time) => {
  for (let i = 0; i < propData.length; i++) {
    const prop = propData[i];
    if (time >= prop.time && time < prop.time + prop.duration) {
      return prop;
    }
  }
  return null;
};

const updateProp = (prop, dt) => {
  if (!propMesh) return;
  const fadeSpeed = 5 * dt;
  
  if (prop?.visible) {
    const color = getOrCreateColor(prop.color || '#ffffff');
    propMesh.material.color.lerp(color, 0.1);
    propMesh.material.opacity = Math.min(propMesh.material.opacity + fadeSpeed, 0.7);
  } else {
    propMesh.material.opacity = Math.max(propMesh.material.opacity - fadeSpeed * 0.6, 0);
  }
};

const animate = (timestamp) => {
  animationId = requestAnimationFrame(animate);

  const dt = Math.min((timestamp - lastTime) / 1000, 0.1);
  lastTime = timestamp;

  frameCount++;
  fpsTime += dt;
  if (fpsTime >= 1) {
    currentFps = frameCount;
    frameCount = 0;
    fpsTime = 0;
  }

  const time = props.currentTime;
  
  const pose = computePoseAtTime(time);
  updatePuppetPose(pose, 0.2);

  currentTension = computeTension(pose);

  const musicState = computeActiveMusic(time);
  updateLights(musicState, dt);

  const prop = computeActiveProp(time);
  updateProp(prop, dt);

  if (puppetGroup) {
    puppetGroup.position.y = Math.sin(timestamp * 0.001) * 0.02;
  }

  if (contextLost.value) return;
  
  try {
    renderer.render(scene, camera);
  } catch (e) {
    console.warn('渲染异常:', e);
  }
};

const handleResize = () => {
  if (!containerRef.value || !renderer || !camera) return;
  const width = containerRef.value.clientWidth;
  const height = containerRef.value.clientHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height, false);
};

const startAnimation = () => {
  if (animationId) cancelAnimationFrame(animationId);
  lastTime = performance.now();
  animationId = requestAnimationFrame(animate);
};

onMounted(() => {
  initScene();
  startAnimation();
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  if (animationId) cancelAnimationFrame(animationId);
  if (renderer) {
    disposeScene();
    renderer.dispose();
    if (containerRef.value && renderer.domElement) {
      try {
        containerRef.value.removeChild(renderer.domElement);
      } catch (e) {}
    }
  }
  poseCache = null;
});

defineExpose({
  setActionData,
  setPropData,
  setMusicData,
  setDefaultPose,
  setDuration,
  resetPuppet: (pose) => {
    poseCache = null;
    if (pose) applyPoseDirect(pose);
  },
  getFps: () => currentFps,
  getTension: () => currentTension,
  restoreContext
});
</script>

<style scoped>
.stage-container {
  width: 100%;
  height: 100%;
  background: #0a0a0f;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
}

.gl-error-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(10, 10, 15, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.gl-error-content {
  text-align: center;
  color: #e0e0e0;
}

.gl-error-content p {
  font-size: 18px;
  margin-bottom: 16px;
}

.gl-error-content button {
  padding: 10px 24px;
  background: linear-gradient(135deg, #e74c3c, #c0392b);
  border: none;
  border-radius: 6px;
  color: white;
  font-size: 14px;
  cursor: pointer;
  transition: transform 0.2s;
}

.gl-error-content button:hover {
  transform: scale(1.05);
}
</style>

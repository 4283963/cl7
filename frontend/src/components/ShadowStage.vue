<template>
  <div ref="containerRef" class="stage-container"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue';
import * as THREE from 'three';

const props = defineProps({
  puppetModel: Object,
  currentPose: Object,
  stageConfig: Object,
  activeMusic: Array,
  activeProp: Object
});

const containerRef = ref(null);
let scene, camera, renderer, animationId;
let puppetParts = {};
let stageLights = {};
let propMesh = null;
let puppetGroup = null;

const lerp = (a, b, t) => a + (b - a) * t;
const lerpArray = (a, b, t) => a.map((v, i) => lerp(v, b[i], t));

const initScene = () => {
  const container = containerRef.value;
  const width = container.clientWidth;
  const height = container.clientHeight;

  scene = new THREE.Scene();
  scene.background = new THREE.Color(props.stageConfig?.backgroundColor || '#1a0a00');

  camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
  camera.position.set(0, 1, 12);
  camera.lookAt(0, 1, 0);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.shadowMap.enabled = true;
  container.appendChild(renderer.domElement);

  createStageFrame();
  createBackScreen();
  createLights();
  createPuppet();
  createProp();
  createCurtains();
};

const createStageFrame = () => {
  const frameColor = props.stageConfig?.frameColor || '#8B4513';
  const frameMaterial = new THREE.MeshPhongMaterial({ 
    color: frameColor,
    shininess: 30
  });

  const topBar = new THREE.Mesh(
    new THREE.BoxGeometry(18, 0.4, 0.5),
    frameMaterial
  );
  topBar.position.set(0, 5.5, 0.1);
  scene.add(topBar);

  const bottomBar = new THREE.Mesh(
    new THREE.BoxGeometry(18, 0.4, 0.5),
    frameMaterial
  );
  bottomBar.position.set(0, -4.5, 0.1);
  scene.add(bottomBar);

  const leftBar = new THREE.Mesh(
    new THREE.BoxGeometry(0.4, 10.4, 0.5),
    frameMaterial
  );
  leftBar.position.set(-8.8, 0.5, 0.1);
  scene.add(leftBar);

  const rightBar = new THREE.Mesh(
    new THREE.BoxGeometry(0.4, 10.4, 0.5),
    frameMaterial
  );
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
  screen.name = 'backScreen';
  scene.add(screen);
};

const createCurtains = () => {
  const curtainColor = props.stageConfig?.curtainColor || '#DC143C';
  const curtainMaterial = new THREE.MeshPhongMaterial({
    color: curtainColor,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.9
  });

  const leftCurtain = new THREE.Mesh(
    new THREE.PlaneGeometry(3, 9.5),
    curtainMaterial
  );
  leftCurtain.position.set(-6.3, 0.5, 0.05);
  scene.add(leftCurtain);

  const rightCurtain = new THREE.Mesh(
    new THREE.PlaneGeometry(3, 9.5),
    curtainMaterial
  );
  rightCurtain.position.set(6.3, 0.5, 0.05);
  scene.add(rightCurtain);

  for (let i = 0; i < 5; i++) {
    const fold = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 9.5, 0.05),
      new THREE.MeshPhongMaterial({ color: '#8B0000', transparent: true, opacity: 0.7 })
    );
    fold.position.set(-6.3 + i * 0.6, 0.5, 0.08);
    scene.add(fold);
  }
  for (let i = 0; i < 5; i++) {
    const fold = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 9.5, 0.05),
      new THREE.MeshPhongMaterial({ color: '#8B0000', transparent: true, opacity: 0.7 })
    );
    fold.position.set(5.1 + i * 0.6, 0.5, 0.08);
    scene.add(fold);
  }
};

const createLights = () => {
  const ambient = new THREE.AmbientLight(0xffffff, 0.4);
  scene.add(ambient);

  const mainLight = new THREE.SpotLight(0xfff8e1, 0.8, 30, Math.PI / 3, 0.3);
  mainLight.position.set(0, 8, 8);
  mainLight.target.position.set(0, 1, 0);
  mainLight.castShadow = true;
  scene.add(mainLight);
  scene.add(mainLight.target);

  const leftLight = new THREE.PointLight(0xff4500, 0, 20);
  leftLight.position.set(-6, 3, 3);
  scene.add(leftLight);
  stageLights.left = leftLight;

  const rightLight = new THREE.PointLight(0xffd700, 0, 20);
  rightLight.position.set(6, 3, 3);
  scene.add(rightLight);
  stageLights.right = rightLight;

  const centerLight = new THREE.PointLight(0xff0000, 0, 25);
  centerLight.position.set(0, 4, 2);
  scene.add(centerLight);
  stageLights.center = centerLight;

  const backLight = new THREE.PointLight(0xffffff, 0.6, 30);
  backLight.position.set(0, 2, -3);
  scene.add(backLight);
  stageLights.back = backLight;
};

const createPuppet = () => {
  if (!props.puppetModel?.parts) return;

  puppetGroup = new THREE.Group();
  puppetGroup.position.set(0, 0, 0);

  Object.entries(props.puppetModel.parts).forEach(([name, part]) => {
    const geometry = new THREE.BoxGeometry(...part.size);
    const material = new THREE.MeshPhongMaterial({
      color: part.color,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.95,
      shininess: 50
    });
    
    const edges = new THREE.EdgesGeometry(geometry);
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2 });
    const wireframe = new THREE.LineSegments(edges, lineMaterial);

    const mesh = new THREE.Mesh(geometry, material);
    mesh.add(wireframe);
    
    mesh.position.set(...part.position);
    mesh.userData = { partName: name, basePosition: [...part.position] };

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

const updatePuppetPose = (pose, blendFactor = 1) => {
  if (!pose || !puppetParts) return;

  Object.entries(pose).forEach(([partName, transform]) => {
    const part = puppetParts[partName];
    if (!part) return;

    if (transform.position) {
      const targetPos = transform.position;
      part.position.x = lerp(part.position.x, targetPos[0], blendFactor);
      part.position.y = lerp(part.position.y, targetPos[1], blendFactor);
      part.position.z = lerp(part.position.z, targetPos[2], blendFactor);
    }

    if (transform.rotation) {
      const targetRot = transform.rotation;
      part.rotation.x = lerp(part.rotation.x, targetRot[0], blendFactor);
      part.rotation.y = lerp(part.rotation.y, targetRot[1], blendFactor);
      part.rotation.z = lerp(part.rotation.z, targetRot[2], blendFactor);
    }
  });
};

const updateLights = (musicEvents) => {
  if (!musicEvents || musicEvents.length === 0) {
    stageLights.left.intensity *= 0.92;
    stageLights.right.intensity *= 0.92;
    stageLights.center.intensity *= 0.92;
    return;
  }

  musicEvents.forEach(event => {
    const intensity = (event.intensity || 0.5) * 2;
    const color = new THREE.Color(event.color || '#ffffff');

    if (event._track === 'gong') {
      stageLights.center.color = color;
      stageLights.center.intensity = Math.min(stageLights.center.intensity + intensity, 3);
    } else if (event._track === 'drum') {
      stageLights.left.color = color;
      stageLights.left.intensity = Math.min(stageLights.left.intensity + intensity * 0.8, 2.5);
    } else if (event._track === 'cymbal') {
      stageLights.right.color = color;
      stageLights.right.intensity = Math.min(stageLights.right.intensity + intensity * 0.8, 2.5);
    }
  });

  stageLights.center.intensity *= 0.95;
  stageLights.left.intensity *= 0.95;
  stageLights.right.intensity *= 0.95;
};

const updateProp = (prop) => {
  if (!propMesh) return;
  if (prop?.visible) {
    propMesh.material.color.set(prop.color || '#ffffff');
    propMesh.material.opacity = Math.min(propMesh.material.opacity + 0.05, 0.7);
  } else {
    propMesh.material.opacity = Math.max(propMesh.material.opacity - 0.03, 0);
  }
};

const animate = () => {
  animationId = requestAnimationFrame(animate);

  if (props.currentPose) {
    updatePuppetPose(props.currentPose, 0.15);
  }

  updateLights(props.activeMusic || []);
  updateProp(props.activeProp);

  if (puppetGroup) {
    puppetGroup.position.y = Math.sin(Date.now() * 0.001) * 0.02;
  }

  renderer.render(scene, camera);
};

const handleResize = () => {
  if (!containerRef.value) return;
  const width = containerRef.value.clientWidth;
  const height = containerRef.value.clientHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
};

onMounted(() => {
  initScene();
  animate();
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  if (animationId) cancelAnimationFrame(animationId);
  if (renderer && containerRef.value) {
    containerRef.value.removeChild(renderer.domElement);
    renderer.dispose();
  }
});

defineExpose({
  resetPuppet: (defaultPose) => {
    if (defaultPose) {
      Object.entries(defaultPose).forEach(([partName, transform]) => {
        const part = puppetParts[partName];
        if (!part) return;
        if (transform.position) part.position.set(...transform.position);
        if (transform.rotation) part.rotation.set(...transform.rotation);
      });
    }
  }
});
</script>

<style scoped>
.stage-container {
  width: 100%;
  height: 100%;
  background: #0a0a0f;
  border-radius: 8px;
  overflow: hidden;
}
</style>

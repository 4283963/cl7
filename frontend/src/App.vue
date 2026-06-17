<template>
  <div class="app">
    <header class="app-header">
      <div class="header-content">
        <h1 class="app-title">🎭 非遗皮影戏数字化保护系统</h1>
        <div class="header-info">
          <span class="current-puppet" v-if="performanceData?.puppet">
            当前角色：{{ performanceData.puppet.name }}
          </span>
          <span class="status-badge" :class="{ 'status-loading': loading }">
            {{ loading ? '加载中...' : '就绪' }}
          </span>
        </div>
      </div>
    </header>

    <main class="app-main">
      <section class="stage-section">
        <ShadowStage
          v-if="performanceData"
          ref="stageRef"
          :puppet-model="performanceData.puppet"
          :current-pose="currentPose"
          :stage-config="performanceData.stage"
          :active-music="activeMusicEvents"
          :active-prop="activeProp"
        />
        <div v-else class="loading-stage">
          <div class="spinner"></div>
          <p>正在加载皮影戏舞台...</p>
        </div>
      </section>

      <section class="timeline-section">
        <Timeline
          :current-time="currentTime"
          :duration="duration"
          :is-playing="isPlaying"
          :progress="progress"
          :prop-tracks="performanceData?.props || []"
          :action-tracks="performanceData?.actions || []"
          :music-tracks="performanceData?.music || {}"
          @toggle="toggle"
          @reset="handleReset"
          @seek="seek"
        />
      </section>
    </main>

    <footer class="app-footer">
      <div class="footer-content">
        <div class="footer-info">
          <span>国家级非物质文化遗产 · 皮影戏数字化保护平台</span>
        </div>
        <div class="footer-hint">
          <span>💡 点击时间轴任意位置跳转 | 按空格键播放/暂停</span>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import ShadowStage from './components/ShadowStage.vue';
import Timeline from './components/Timeline.vue';
import { usePlayer } from './composables/usePlayer';
import { getPerformance } from './api';

const stageRef = ref(null);
const loading = ref(true);
const performanceData = ref(null);

const {
  currentTime,
  isPlaying,
  duration,
  progress,
  toggle,
  reset,
  seek,
  setDuration
} = usePlayer(8);

const lerp = (a, b, t) => a + (b - a) * t;
const lerpArray = (a, b, t) => a.map((v, i) => lerp(v, b[i], t));

const currentPose = computed(() => {
  if (!performanceData.value?.actions || !performanceData.value?.puppet?.defaultPose) {
    return null;
  }

  const actions = performanceData.value.actions;
  const defaultPose = performanceData.value.puppet.defaultPose;
  const time = currentTime.value;

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
      prevAction = actions[i - 1] || { time: 0, duration: 0, pose: defaultPose };
      break;
    }
  }

  if (!prevAction) {
    prevAction = actions[actions.length - 1] || { pose: defaultPose };
  }
  if (!nextAction) {
    nextAction = { time: duration.value, pose: defaultPose };
  }

  const segmentStart = prevAction.time;
  const segmentDuration = Math.max((nextAction.time || duration.value) - segmentStart, 0.001);
  const localTime = Math.max(0, Math.min(time - segmentStart, segmentDuration));
  const t = localTime / segmentDuration;

  const smoothT = t < 0.5
    ? 2 * t * t
    : 1 - Math.pow(-2 * t + 2, 2) / 2;

  const result = {};
  const allParts = Object.keys(defaultPose);

  allParts.forEach(part => {
    const fromPose = prevAction.pose?.[part] || defaultPose[part];
    const toPose = nextAction.pose?.[part] || fromPose;

    result[part] = {
      position: lerpArray(fromPose.position || defaultPose[part].position, toPose.position || defaultPose[part].position, smoothT),
      rotation: lerpArray(fromPose.rotation || defaultPose[part].rotation, toPose.rotation || defaultPose[part].rotation, smoothT)
    };
  });

  return result;
});

const activeMusicEvents = computed(() => {
  if (!performanceData.value?.music) return [];

  const active = [];
  const time = currentTime.value;
  const tolerance = 0.15;

  Object.entries(performanceData.value.music).forEach(([track, events]) => {
    events.forEach(event => {
      if (time >= event.time - tolerance && time < event.time + event.duration + tolerance) {
        active.push({ ...event, _track: track });
      }
    });
  });

  return active;
});

const activeProp = computed(() => {
  if (!performanceData.value?.props) return null;

  const time = currentTime.value;
  for (const prop of performanceData.value.props) {
    if (time >= prop.time && time < prop.time + prop.duration) {
      return prop;
    }
  }
  return null;
});

const handleReset = () => {
  reset();
  if (stageRef.value && performanceData.value?.puppet?.defaultPose) {
    stageRef.value.resetPuppet(performanceData.value.puppet.defaultPose);
  }
};

const handleKeydown = (e) => {
  if (e.code === 'Space') {
    e.preventDefault();
    toggle();
  }
};

onMounted(async () => {
  try {
    const data = await getPerformance('sunwukong');
    performanceData.value = data;
    if (data.stage?.duration) {
      setDuration(data.stage.duration);
    }
    loading.value = false;
  } catch (err) {
    console.error('加载演出数据失败:', err);
    loading.value = false;
  }

  window.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown);
});
</script>

<style scoped>
.app {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
}

.app-header {
  padding: 16px 32px;
  background: rgba(0, 0, 0, 0.4);
  border-bottom: 1px solid rgba(255, 204, 0, 0.2);
  backdrop-filter: blur(10px);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1800px;
  margin: 0 auto;
  width: 100%;
}

.app-title {
  font-size: 22px;
  font-weight: 600;
  background: linear-gradient(135deg, #ffd700, #ff8c00);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.header-info {
  display: flex;
  align-items: center;
  gap: 20px;
}

.current-puppet {
  font-size: 14px;
  color: #c0c0e0;
}

.status-badge {
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  background: rgba(46, 204, 113, 0.2);
  color: #2ecc71;
  border: 1px solid rgba(46, 204, 113, 0.3);
}

.status-loading {
  background: rgba(241, 196, 15, 0.2);
  color: #f1c40f;
  border-color: rgba(241, 196, 15, 0.3);
}

.app-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 20px 32px;
  gap: 20px;
  overflow: hidden;
}

.stage-section {
  flex: 1;
  min-height: 0;
  display: flex;
}

.loading-stage {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  background: #0a0a0f;
  border-radius: 8px;
  color: #8080a0;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid rgba(255, 204, 0, 0.2);
  border-top-color: #ffcc00;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.timeline-section {
  height: 340px;
  flex-shrink: 0;
}

.app-footer {
  padding: 12px 32px;
  background: rgba(0, 0, 0, 0.3);
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.footer-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1800px;
  margin: 0 auto;
  font-size: 12px;
}

.footer-info {
  color: #606080;
}

.footer-hint {
  color: #505070;
}
</style>

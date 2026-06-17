<template>
  <div class="app">
    <header class="app-header">
      <div class="header-content">
        <h1 class="app-title">🎭 非遗皮影戏数字化保护系统</h1>
        <div class="header-info">
          <span class="current-puppet" v-if="performanceData?.puppet">
            当前角色：{{ performanceData.puppet.name }}
          </span>
          <button class="mode-btn" @click="toggleIntenseMode">
            {{ isIntense ? '🎭 普通模式' : '⚔️ 武打模式' }}
          </button>
          <button class="fps-btn" @click="toggleFps">
            {{ showFps ? '隐藏FPS' : '显示FPS' }}
          </button>
          <span class="fps-display" v-if="showFps">
            FPS: {{ fpsDisplay }}
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
          v-if="performanceData && stageReady"
          ref="stageRef"
          :puppet-model="performanceData.puppet"
          :stage-config="performanceData.stage"
          :current-time="currentTime"
          :is-playing="isPlaying"
          @context-lost="onContextLost"
          @context-restored="onContextRestored"
        />
        <div v-else class="loading-stage">
          <div class="spinner"></div>
          <p>正在加载皮影戏舞台...</p>
        </div>
      </section>

      <section class="timeline-section">
        <div class="timeline-row">
          <div class="timeline-main">
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
          </div>
          <div class="tension-side">
            <TensionGauge :tension="tensionData" />
          </div>
        </div>
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
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue';
import ShadowStage from './components/ShadowStage.vue';
import Timeline from './components/Timeline.vue';
import TensionGauge from './components/TensionGauge.vue';
import { usePlayer } from './composables/usePlayer';
import { getPerformance } from './api';

const stageRef = ref(null);
const loading = ref(true);
const performanceData = ref(null);
const stageReady = ref(false);
const showFps = ref(false);
const fpsDisplay = ref(60);
const isIntense = ref(false);
const tensionData = ref({
  head: 0, body: 0, leftArm: 0, rightArm: 0, staff: 0, leftLeg: 0, rightLeg: 0
});

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

let fpsInterval = null;

const loadPerformance = async (intense = false) => {
  loading.value = true;
  stageReady.value = false;
  
  try {
    const url = intense 
      ? '/api/performance/sunwukong?intense=true'
      : '/api/performance/sunwukong';
    
    const response = await fetch(url);
    const data = await response.json();
    
    performanceData.value = data;
    if (data.stage?.duration) {
      setDuration(data.stage.duration);
    }
    
    await nextTick();
    stageReady.value = true;
    
    await nextTick();
    setupStageData();
    
    loading.value = false;
  } catch (err) {
    console.error('加载演出数据失败:', err);
    loading.value = false;
  }
};

const toggleIntenseMode = () => {
  isIntense.value = !isIntense.value;
  reset();
  loadPerformance(isIntense.value);
};

const toggleFps = () => {
  showFps.value = !showFps.value;
  if (showFps.value && stageRef.value) {
    startFpsMonitor();
  } else {
    stopFpsMonitor();
  }
};

const onContextLost = () => {
  console.warn('WebGL上下文丢失');
};

const onContextRestored = () => {
  console.log('WebGL上下文已恢复');
  if (performanceData.value) {
    setupStageData();
  }
};

const setupStageData = () => {
  if (!stageRef.value || !performanceData.value) return;
  
  const data = performanceData.value;
  stageRef.value.setActionData(data.actions);
  stageRef.value.setPropData(data.props);
  stageRef.value.setMusicData(data.music);
  stageRef.value.setDefaultPose(data.puppet.defaultPose);
  stageRef.value.setDuration(data.stage?.duration || 8);
};

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

let tensionInterval = null;

const startTensionMonitor = () => {
  if (tensionInterval) clearInterval(tensionInterval);
  tensionInterval = setInterval(() => {
    if (stageRef.value) {
      tensionData.value = stageRef.value.getTension();
    }
  }, 40);
};

const stopTensionMonitor = () => {
  if (tensionInterval) {
    clearInterval(tensionInterval);
    tensionInterval = null;
  }
};

const startFpsMonitor = () => {
  if (fpsInterval) clearInterval(fpsInterval);
  fpsInterval = setInterval(() => {
    if (stageRef.value) {
      const fps = stageRef.value.getFps();
      fpsDisplay.value = Math.round(fps);
    }
  }, 500);
};

const stopFpsMonitor = () => {
  if (fpsInterval) {
    clearInterval(fpsInterval);
    fpsInterval = null;
  }
};

onMounted(async () => {
  await loadPerformance(false);
  window.addEventListener('keydown', handleKeydown);
  startTensionMonitor();
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown);
  stopFpsMonitor();
  stopTensionMonitor();
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

.fps-display {
  font-family: 'Courier New', monospace;
  font-size: 13px;
  color: #2ecc71;
  background: rgba(46, 204, 113, 0.1);
  padding: 4px 10px;
  border-radius: 4px;
}

.mode-btn,
.fps-btn {
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
}

.mode-btn {
  background: linear-gradient(135deg, rgba(231, 76, 60, 0.2), rgba(192, 57, 43, 0.2));
  color: #e74c3c;
  border: 1px solid rgba(231, 76, 60, 0.3);
}

.mode-btn:hover {
  background: linear-gradient(135deg, rgba(231, 76, 60, 0.3), rgba(192, 57, 43, 0.3));
  transform: translateY(-1px);
}

.fps-btn {
  background: rgba(52, 152, 219, 0.15);
  color: #3498db;
  border: 1px solid rgba(52, 152, 219, 0.3);
}

.fps-btn:hover {
  background: rgba(52, 152, 219, 0.25);
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

.timeline-row {
  display: flex;
  gap: 16px;
  height: 100%;
}

.timeline-main {
  flex: 1;
  min-width: 0;
  height: 100%;
}

.tension-side {
  width: 260px;
  flex-shrink: 0;
  height: 100%;
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

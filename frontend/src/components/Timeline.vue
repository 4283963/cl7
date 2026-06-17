<template>
  <div class="timeline-container">
    <div class="timeline-header">
      <div class="controls">
        <button class="control-btn" @click="$emit('reset')" title="重置">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/>
          </svg>
        </button>
        <button class="control-btn play-btn" @click="$emit('toggle')" :title="isPlaying ? '暂停' : '播放'">
          <svg v-if="!isPlaying" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z"/>
          </svg>
          <svg v-else width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
          </svg>
        </button>
        <div class="time-display">
          <span class="current-time">{{ displayTime }}</span>
          <span class="separator">/</span>
          <span class="total-time">{{ displayTotalTime }}</span>
        </div>
      </div>
      
      <div class="ruler">
        <div 
          class="playhead"
          ref="playheadEl"
        ></div>
        <div class="time-marks">
          <span 
            v-for="mark in timeMarks" 
            :key="mark" 
            class="time-mark"
            :style="{ transform: `translateX(${mark / duration * 100}%)` }"
          >
            {{ formatTime(mark) }}
          </span>
        </div>
      </div>
    </div>

    <div class="tracks-container" ref="tracksRef" @click="handleSeek">
      <div 
        class="playhead-indicator"
        ref="playheadIndicatorEl"
      ></div>

      <div class="track prop-track">
        <div class="track-label">
          <span class="track-icon">🎭</span>
          <span>道具轨道</span>
        </div>
        <div class="track-content">
          <div
            v-for="(item, idx) in propTracks"
            :key="'prop-' + idx"
            class="track-item prop-item"
            :class="{ active: activePropIndex === idx }"
            :style="getItemStyle(item)"
          >
            <span class="item-name">{{ item.name }}</span>
          </div>
        </div>
      </div>

      <div class="track action-track">
        <div class="track-label">
          <span class="track-icon">🕺</span>
          <span>人物动作</span>
          <span class="track-count">{{ actionTracks.length }}个</span>
        </div>
        <div class="track-content" ref="actionTrackContent">
          <template v-if="actionTracks.length <= 100">
            <div
              v-for="(item, idx) in actionTracks"
              :key="'action-' + idx"
              class="track-item action-item"
              :class="{ active: activeActionIndex === idx }"
              :style="getItemStyle(item)"
            >
              <span class="item-name" v-if="actionTracks.length < 20">{{ item.name }}</span>
            </div>
          </template>
          <canvas v-else ref="actionCanvas" class="track-canvas"></canvas>
        </div>
      </div>

      <div class="track music-track">
        <div class="track-label">
          <span class="track-icon">🥁</span>
          <span>锣鼓乐器</span>
        </div>
        <div class="track-content multi-row">
          <div class="music-row">
            <span class="music-label">锣</span>
            <div class="music-events">
              <template v-if="musicTracks.gong && musicTracks.gong.length <= 100">
                <div
                  v-for="(item, idx) in musicTracks.gong"
                  :key="'gong-' + idx"
                  class="track-item music-item gong-item"
                  :class="{ active: isActiveMusicEvent('gong', idx) }"
                  :style="getMusicItemStyle(item)"
                >
                </div>
              </template>
              <canvas v-else ref="gongCanvas" class="music-canvas"></canvas>
            </div>
          </div>
          <div class="music-row">
            <span class="music-label">鼓</span>
            <div class="music-events">
              <template v-if="musicTracks.drum && musicTracks.drum.length <= 100">
                <div
                  v-for="(item, idx) in musicTracks.drum"
                  :key="'drum-' + idx"
                  class="track-item music-item drum-item"
                  :class="{ active: isActiveMusicEvent('drum', idx) }"
                  :style="getMusicItemStyle(item)"
                >
                </div>
              </template>
              <canvas v-else ref="drumCanvas" class="music-canvas"></canvas>
            </div>
          </div>
          <div class="music-row">
            <span class="music-label">钹</span>
            <div class="music-events">
              <template v-if="musicTracks.cymbal && musicTracks.cymbal.length <= 100">
                <div
                  v-for="(item, idx) in musicTracks.cymbal"
                  :key="'cymbal-' + idx"
                  class="track-item music-item cymbal-item"
                  :class="{ active: isActiveMusicEvent('cymbal', idx) }"
                  :style="getMusicItemStyle(item)"
                >
                </div>
              </template>
              <canvas v-else ref="cymbalCanvas" class="music-canvas"></canvas>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick, shallowRef } from 'vue';

const props = defineProps({
  currentTime: { type: Number, default: 0 },
  duration: { type: Number, default: 8 },
  isPlaying: { type: Boolean, default: false },
  progress: { type: Number, default: 0 },
  propTracks: { type: Array, default: () => [] },
  actionTracks: { type: Array, default: () => [] },
  musicTracks: { type: Object, default: () => ({}) }
});

const emit = defineEmits(['toggle', 'reset', 'seek']);

const tracksRef = ref(null);
const playheadEl = ref(null);
const playheadIndicatorEl = ref(null);
const actionCanvas = ref(null);
const gongCanvas = ref(null);
const drumCanvas = ref(null);
const cymbalCanvas = ref(null);

const displayTime = computed(() => formatTime(props.currentTime));
const displayTotalTime = computed(() => formatTime(props.duration));

const timeMarks = computed(() => {
  const marks = [];
  const step = props.duration > 20 ? 5 : props.duration > 10 ? 2 : 1;
  for (let i = 0; i <= props.duration; i += step) {
    marks.push(Math.round(i * 10) / 10);
  }
  return marks;
});

const activePropIndex = computed(() => {
  for (let i = 0; i < props.propTracks.length; i++) {
    const item = props.propTracks[i];
    if (props.currentTime >= item.time && props.currentTime < item.time + item.duration) {
      return i;
    }
  }
  return -1;
});

const activeActionIndex = computed(() => {
  const actions = props.actionTracks;
  if (!actions.length) return -1;
  
  for (let i = 0; i < actions.length; i++) {
    const item = actions[i];
    if (props.currentTime >= item.time && props.currentTime < item.time + item.duration) {
      return i;
    }
  }
  return -1;
});

const activeMusicIndices = shallowRef({ gong: -1, drum: -1, cymbal: -1 });

const updateActiveMusicIndices = () => {
  const time = props.currentTime;
  const tolerance = 0.1;
  
  ['gong', 'drum', 'cymbal'].forEach(track => {
    const events = props.musicTracks[track];
    if (!events || !events.length) {
      activeMusicIndices.value[track] = -1;
      return;
    }
    
    let found = -1;
    for (let i = 0; i < events.length; i++) {
      const e = events[i];
      if (time >= e.time - tolerance && time < e.time + e.duration + tolerance) {
        found = i;
        break;
      }
    }
    activeMusicIndices.value[track] = found;
  });
};

watch(() => props.currentTime, updateActiveMusicIndices);

const isActiveMusicEvent = (track, idx) => {
  return activeMusicIndices.value[track] === idx;
};

const formatTime = (seconds) => {
  if (!seconds && seconds !== 0) return '0:00.0';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 10);
  return `${mins}:${secs.toString().padStart(2, '0')}.${ms}`;
};

const getItemStyle = (item) => {
  const left = (item.time / props.duration) * 100;
  const width = Math.max((item.duration / props.duration) * 100, 0.5);
  return {
    transform: `translateX(${left}%)`,
    width: `${width}%`
  };
};

const getMusicItemStyle = (item) => {
  const left = (item.time / props.duration) * 100;
  return {
    transform: `translateX(${left}%)`
  };
};

const handleSeek = (e) => {
  if (!tracksRef.value) return;
  const rect = tracksRef.value.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const ratio = x / rect.width;
  emit('seek', ratio * props.duration);
};

let rafId = null;

const updatePlayheads = () => {
  const progress = props.progress;
  if (playheadEl.value) {
    playheadEl.value.style.transform = `translateX(${progress}%)`;
  }
  if (playheadIndicatorEl.value) {
    playheadIndicatorEl.value.style.transform = `translateX(${progress}%)`;
  }
  rafId = requestAnimationFrame(updatePlayheads);
};

const drawMusicCanvas = (canvas, events, color, activeIndex) => {
  if (!canvas || !events || !events.length) return;
  
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);
  
  ctx.clearRect(0, 0, rect.width, rect.height);
  
  const h = rect.height;
  const w = rect.width;
  const dotRadius = Math.max(3, Math.min(8, w / props.duration / 2));
  
  for (let i = 0; i < events.length; i++) {
    const e = events[i];
    const x = (e.time / props.duration) * w;
    
    const isActive = i === activeIndex;
    const intensity = e.intensity || 0.5;
    const r = isActive ? dotRadius * 1.5 : dotRadius * (0.6 + intensity * 0.4);
    
    ctx.beginPath();
    ctx.arc(x, h / 2, r, 0, Math.PI * 2);
    
    if (isActive) {
      ctx.shadowColor = color;
      ctx.shadowBlur = 15;
      ctx.fillStyle = color;
    } else {
      ctx.shadowBlur = 0;
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.7;
    }
    
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
  }
};

const drawActionCanvas = (canvas, actions) => {
  if (!canvas || !actions || !actions.length) return;
  
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);
  
  ctx.clearRect(0, 0, rect.width, rect.height);
  
  const h = rect.height;
  const w = rect.width;
  const barHeight = Math.max(4, h * 0.6);
  const y = (h - barHeight) / 2;
  
  for (let i = 0; i < actions.length; i++) {
    const a = actions[i];
    const x = (a.time / props.duration) * w;
    const width = Math.max(2, (a.duration / props.duration) * w - 1);
    
    const isActive = i === activeActionIndex.value;
    
    ctx.fillStyle = isActive 
      ? 'rgba(65, 105, 225, 0.9)' 
      : 'rgba(100, 149, 237, 0.5)';
    
    if (isActive) {
      ctx.shadowColor = '#4169e1';
      ctx.shadowBlur = 8;
    }
    
    ctx.beginPath();
    ctx.roundRect(x, y, width, barHeight, 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }
};

const redrawCanvases = () => {
  if (props.actionTracks.length > 100 && actionCanvas.value) {
    drawActionCanvas(actionCanvas.value, props.actionTracks);
  }
  
  const gongEvents = props.musicTracks.gong || [];
  if (gongEvents.length > 100 && gongCanvas.value) {
    drawMusicCanvas(gongCanvas.value, gongEvents, '#ff4500', activeMusicIndices.value.gong);
  }
  
  const drumEvents = props.musicTracks.drum || [];
  if (drumEvents.length > 100 && drumCanvas.value) {
    drawMusicCanvas(drumCanvas.value, drumEvents, '#8b4513', activeMusicIndices.value.drum);
  }
  
  const cymbalEvents = props.musicTracks.cymbal || [];
  if (cymbalEvents.length > 100 && cymbalCanvas.value) {
    drawMusicCanvas(cymbalCanvas.value, cymbalEvents, '#ffd700', activeMusicIndices.value.cymbal);
  }
};

let canvasRafId = null;
const canvasUpdateLoop = () => {
  redrawCanvases();
  canvasRafId = requestAnimationFrame(canvasUpdateLoop);
};

onMounted(() => {
  updatePlayheads();
  updateActiveMusicIndices();
  
  nextTick(() => {
    canvasUpdateLoop();
  });
});

onUnmounted(() => {
  if (rafId) cancelAnimationFrame(rafId);
  if (canvasRafId) cancelAnimationFrame(canvasRafId);
});
</script>

<style scoped>
.timeline-container {
  background: linear-gradient(180deg, #2a2a3e 0%, #1a1a2e 100%);
  border-radius: 8px;
  overflow: hidden;
  user-select: none;
}

.timeline-header {
  padding: 12px 16px;
  border-bottom: 1px solid #3a3a5e;
  background: rgba(0, 0, 0, 0.2);
}

.controls {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}

.control-btn {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 50%;
  background: #3a3a5e;
  color: #e0e0e0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.control-btn:hover {
  background: #4a4a7e;
  transform: scale(1.05);
}

.play-btn {
  width: 44px;
  height: 44px;
  background: linear-gradient(135deg, #e74c3c, #c0392b);
}

.play-btn:hover {
  background: linear-gradient(135deg, #ff6b5b, #e74c3c);
}

.time-display {
  font-family: 'Courier New', monospace;
  font-size: 16px;
  color: #a0a0c0;
}

.current-time {
  color: #ffcc00;
  font-weight: bold;
}

.separator {
  margin: 0 4px;
  color: #505070;
}

.ruler {
  position: relative;
  height: 24px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 4px;
  overflow: hidden;
}

.playhead {
  position: absolute;
  top: 0;
  left: 0;
  width: 2px;
  height: 100%;
  background: #ffcc00;
  z-index: 10;
  box-shadow: 0 0 8px rgba(255, 204, 0, 0.6);
  will-change: transform;
}

.time-marks {
  position: relative;
  height: 100%;
}

.time-mark {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  font-size: 11px;
  color: #8080a0;
  font-family: 'Courier New', monospace;
}

.tracks-container {
  position: relative;
  max-height: 260px;
  overflow-y: auto;
  cursor: pointer;
}

.playhead-indicator {
  position: absolute;
  top: 0;
  left: 0;
  width: 2px;
  height: 100%;
  background: linear-gradient(180deg, #ffcc00, #ff9900);
  z-index: 20;
  pointer-events: none;
  will-change: transform;
}

.playhead-indicator::before {
  content: '';
  position: absolute;
  top: -4px;
  left: -5px;
  width: 12px;
  height: 12px;
  background: #ffcc00;
  transform: rotate(45deg);
  border-radius: 2px;
}

.track {
  display: flex;
  border-bottom: 1px solid #2a2a4a;
  min-height: 56px;
}

.track-label {
  width: 140px;
  min-width: 140px;
  padding: 12px 16px;
  background: rgba(0, 0, 0, 0.2);
  border-right: 1px solid #3a3a5e;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #c0c0e0;
  position: sticky;
  left: 0;
  z-index: 5;
}

.track-icon {
  font-size: 18px;
}

.track-count {
  font-size: 11px;
  color: #8080a0;
  background: rgba(0, 0, 0, 0.3);
  padding: 2px 6px;
  border-radius: 10px;
}

.track-content {
  position: relative;
  flex: 1;
  padding: 8px 0;
  min-height: 56px;
}

.track-content.multi-row {
  padding: 4px 0;
}

.music-row {
  display: flex;
  align-items: center;
  min-height: 32px;
  padding: 2px 0;
}

.music-label {
  width: 24px;
  font-size: 11px;
  color: #8080a0;
  text-align: center;
  flex-shrink: 0;
}

.music-events {
  position: relative;
  flex: 1;
  height: 28px;
}

.track-canvas,
.music-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.track-item {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  height: 36px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  padding: 0 10px;
  font-size: 12px;
  cursor: pointer;
  transition: box-shadow 0.15s, background 0.15s;
  overflow: hidden;
  white-space: nowrap;
}

.music-events .track-item {
  position: relative;
  transform: none;
  height: 16px;
  width: 16px;
  top: 6px;
  padding: 0;
  border-radius: 50%;
  display: inline-flex;
}

.prop-item {
  background: linear-gradient(135deg, rgba(255, 182, 193, 0.4), rgba(255, 105, 180, 0.3));
  border: 1px solid rgba(255, 182, 193, 0.6);
  color: #ffb6c1;
}

.prop-item.active {
  background: linear-gradient(135deg, rgba(255, 105, 180, 0.7), rgba(255, 20, 147, 0.5));
  box-shadow: 0 0 12px rgba(255, 105, 180, 0.5);
}

.action-item {
  background: linear-gradient(135deg, rgba(100, 149, 237, 0.4), rgba(65, 105, 225, 0.3));
  border: 1px solid rgba(100, 149, 237, 0.6);
  color: #b0c4de;
}

.action-item.active {
  background: linear-gradient(135deg, rgba(65, 105, 225, 0.7), rgba(30, 144, 255, 0.5));
  box-shadow: 0 0 12px rgba(100, 149, 237, 0.5);
}

.music-item {
  border-radius: 50%;
  width: 14px;
  min-width: 14px;
  height: 14px;
}

.gong-item {
  background: radial-gradient(circle, #ff6347, #dc143c);
  border: 1px solid #ff4500;
}

.gong-item.active {
  box-shadow: 0 0 10px #ff4500, 0 0 16px rgba(255, 69, 0, 0.5);
  transform: scale(1.3);
}

.drum-item {
  background: radial-gradient(circle, #a0522d, #8b4513);
  border: 1px solid #8b4513;
}

.drum-item.active {
  box-shadow: 0 0 10px #8b4513, 0 0 16px rgba(139, 69, 19, 0.5);
  transform: scale(1.3);
}

.cymbal-item {
  background: radial-gradient(circle, #ffd700, #daa520);
  border: 1px solid #ffd700;
}

.cymbal-item.active {
  box-shadow: 0 0 10px #ffd700, 0 0 16px rgba(255, 215, 0, 0.5);
  transform: scale(1.3);
}

.item-name {
  font-weight: 500;
}

.tracks-container::-webkit-scrollbar {
  width: 8px;
}

.tracks-container::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.2);
}

.tracks-container::-webkit-scrollbar-thumb {
  background: #4a4a6e;
  border-radius: 4px;
}

.tracks-container::-webkit-scrollbar-thumb:hover {
  background: #5a5a8e;
}
</style>

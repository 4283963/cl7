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
          <span class="current-time">{{ formatTime(currentTime) }}</span>
          <span class="separator">/</span>
          <span class="total-time">{{ formatTime(duration) }}</span>
        </div>
      </div>
      
      <div class="ruler">
        <div 
          class="playhead"
          :style="{ left: progress + '%' }"
        ></div>
        <div class="time-marks">
          <span 
            v-for="mark in timeMarks" 
            :key="mark" 
            class="time-mark"
            :style="{ left: (mark / duration * 100) + '%' }"
          >
            {{ formatTime(mark) }}
          </span>
        </div>
      </div>
    </div>

    <div class="tracks-container" ref="tracksRef" @click="handleSeek">
      <div 
        class="playhead-indicator"
        :style="{ left: progress + '%' }"
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
            :style="getItemStyle(item)"
            :class="{ active: isItemActive(item) }"
          >
            <span class="item-name">{{ item.name }}</span>
          </div>
        </div>
      </div>

      <div class="track action-track">
        <div class="track-label">
          <span class="track-icon">🕺</span>
          <span>人物动作</span>
        </div>
        <div class="track-content">
          <div
            v-for="(item, idx) in actionTracks"
            :key="'action-' + idx"
            class="track-item action-item"
            :style="getItemStyle(item)"
            :class="{ active: isItemActive(item) }"
          >
            <span class="item-name">{{ item.name }}</span>
          </div>
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
            <div
              v-for="(item, idx) in musicTracks.gong || []"
              :key="'gong-' + idx"
              class="track-item music-item gong-item"
              :style="getItemStyle(item)"
              :class="{ active: isItemActive(item) }"
            >
              <span class="item-dot"></span>
            </div>
          </div>
          <div class="music-row">
            <span class="music-label">鼓</span>
            <div
              v-for="(item, idx) in musicTracks.drum || []"
              :key="'drum-' + idx"
              class="track-item music-item drum-item"
              :style="getItemStyle(item)"
              :class="{ active: isItemActive(item) }"
            >
              <span class="item-dot"></span>
            </div>
          </div>
          <div class="music-row">
            <span class="music-label">钹</span>
            <div
              v-for="(item, idx) in musicTracks.cymbal || []"
              :key="'cymbal-' + idx"
              class="track-item music-item cymbal-item"
              :style="getItemStyle(item)"
              :class="{ active: isItemActive(item) }"
            >
              <span class="item-dot"></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';

const props = defineProps({
  currentTime: Number,
  duration: Number,
  isPlaying: Boolean,
  progress: Number,
  propTracks: { type: Array, default: () => [] },
  actionTracks: { type: Array, default: () => [] },
  musicTracks: { type: Object, default: () => ({}) }
});

const emit = defineEmits(['toggle', 'reset', 'seek']);
const tracksRef = ref(null);

const formatTime = (seconds) => {
  if (!seconds && seconds !== 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 10);
  return `${mins}:${secs.toString().padStart(2, '0')}.${ms}`;
};

const timeMarks = computed(() => {
  const marks = [];
  const step = props.duration > 10 ? 2 : 1;
  for (let i = 0; i <= props.duration; i += step) {
    marks.push(i);
  }
  return marks;
});

const getItemStyle = (item) => {
  const left = (item.time / props.duration) * 100;
  const width = (item.duration / props.duration) * 100;
  return {
    left: left + '%',
    width: Math.max(width, 2) + '%'
  };
};

const isItemActive = (item) => {
  return props.currentTime >= item.time && props.currentTime < (item.time + item.duration);
};

const handleSeek = (e) => {
  if (!tracksRef.value) return;
  const rect = tracksRef.value.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const ratio = x / rect.width;
  emit('seek', ratio * props.duration);
};
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
  width: 2px;
  height: 100%;
  background: #ffcc00;
  z-index: 10;
  box-shadow: 0 0 8px rgba(255, 204, 0, 0.6);
  transition: left 0.05s linear;
}

.time-marks {
  position: relative;
  height: 100%;
}

.time-mark {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
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
  bottom: 0;
  width: 2px;
  background: linear-gradient(180deg, #ffcc00, #ff9900);
  z-index: 20;
  pointer-events: none;
  transition: left 0.05s linear;
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
  width: 120px;
  min-width: 120px;
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
  transition: all 0.2s;
  overflow: hidden;
  white-space: nowrap;
}

.music-row .track-item {
  position: relative;
  transform: none;
  height: 22px;
  top: 0;
  margin: 0;
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
  width: 16px !important;
  min-width: 16px;
  padding: 0;
  justify-content: center;
}

.gong-item {
  background: radial-gradient(circle, #ff6347, #dc143c);
  border: 1px solid #ff4500;
}

.gong-item.active {
  box-shadow: 0 0 12px #ff4500, 0 0 20px rgba(255, 69, 0, 0.5);
  transform: scale(1.3);
}

.drum-item {
  background: radial-gradient(circle, #a0522d, #8b4513);
  border: 1px solid #8b4513;
}

.drum-item.active {
  box-shadow: 0 0 12px #8b4513, 0 0 20px rgba(139, 69, 19, 0.5);
  transform: scale(1.3);
}

.cymbal-item {
  background: radial-gradient(circle, #ffd700, #daa520);
  border: 1px solid #ffd700;
}

.cymbal-item.active {
  box-shadow: 0 0 12px #ffd700, 0 0 20px rgba(255, 215, 0, 0.5);
  transform: scale(1.3);
}

.item-name {
  font-weight: 500;
}

.item-dot {
  display: none;
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

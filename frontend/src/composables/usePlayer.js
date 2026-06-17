import { ref, reactive, onUnmounted, computed } from 'vue';

export function usePlayer(totalDuration = 8) {
  const currentTime = ref(0);
  const isPlaying = ref(false);
  const duration = ref(totalDuration);
  const playbackRate = ref(1);
  
  let animationFrameId = null;
  let lastTimestamp = null;

  const progress = computed(() => {
    return duration.value > 0 ? (currentTime.value / duration.value) * 100 : 0;
  });

  const tick = (timestamp) => {
    if (!lastTimestamp) lastTimestamp = timestamp;
    const delta = (timestamp - lastTimestamp) / 1000;
    lastTimestamp = timestamp;

    if (isPlaying.value) {
      currentTime.value += delta * playbackRate.value;
      if (currentTime.value >= duration.value) {
        currentTime.value = 0;
      }
    }

    animationFrameId = requestAnimationFrame(tick);
  };

  const play = () => {
    isPlaying.value = true;
    lastTimestamp = null;
  };

  const pause = () => {
    isPlaying.value = false;
  };

  const toggle = () => {
    if (isPlaying.value) {
      pause();
    } else {
      play();
    }
  };

  const reset = () => {
    currentTime.value = 0;
    isPlaying.value = false;
    lastTimestamp = null;
  };

  const seek = (time) => {
    currentTime.value = Math.max(0, Math.min(time, duration.value));
  };

  const setPlaybackRate = (rate) => {
    playbackRate.value = rate;
  };

  const setDuration = (d) => {
    duration.value = d;
    if (currentTime.value > d) {
      currentTime.value = 0;
    }
  };

  animationFrameId = requestAnimationFrame(tick);

  onUnmounted(() => {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
    }
  });

  return {
    currentTime,
    isPlaying,
    duration,
    playbackRate,
    progress,
    play,
    pause,
    toggle,
    reset,
    seek,
    setPlaybackRate,
    setDuration
  };
}

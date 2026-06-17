<template>
  <div class="tension-gauge">
    <div class="gauge-header">
      <span class="gauge-title">🎗️ 提线紧绷度</span>
      <span class="gauge-sub">艺人施力度</span>
    </div>
    <div class="gauge-body">
      <div
        v-for="item in gauges"
        :key="item.key"
        class="gauge-column"
      >
        <div class="gauge-bar-wrap">
          <div class="gauge-bar-bg">
            <div
              class="gauge-bar-fill"
              :style="{
                height: (tension[item.key] || 0) * 100 + '%',
                background: getBarGradient(item.color, tension[item.key] || 0)
              }"
            >
              <div class="gauge-bar-glow" :style="{ background: item.color }"></div>
            </div>
          </div>
          <div class="gauge-scale">
            <span class="scale-mark">紧</span>
            <span class="scale-mark"></span>
            <span class="scale-mark"></span>
            <span class="scale-mark">松</span>
          </div>
        </div>
        <div class="gauge-label" :style="{ color: item.color }">
          {{ item.label }}
        </div>
        <div class="gauge-value" :style="{ color: item.color }">
          {{ Math.round((tension[item.key] || 0) * 100) }}%
        </div>
      </div>
    </div>
    <div class="gauge-legend">
      <div class="legend-item"><span class="legend-dot loose"></span>松弛</div>
      <div class="legend-item"><span class="legend-dot mid"></span>用劲</div>
      <div class="legend-item"><span class="legend-dot tight"></span>绷紧</div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  tension: {
    type: Object,
    default: () => ({
      head: 0, body: 0, leftArm: 0, rightArm: 0, staff: 0, leftLeg: 0, rightLeg: 0
    })
  }
});

const gauges = [
  { key: 'head', label: '头部', color: '#FFD700' },
  { key: 'body', label: '身躯', color: '#CD853F' },
  { key: 'leftArm', label: '左臂', color: '#4FC3F7' },
  { key: 'rightArm', label: '右臂', color: '#29B6F6' },
  { key: 'staff', label: '金箍棒', color: '#FFA726' },
  { key: 'leftLeg', label: '左腿', color: '#81C784' },
  { key: 'rightLeg', label: '右腿', color: '#66BB6A' }
];

const getBarGradient = (baseColor, value) => {
  if (value < 0.35) {
    return `linear-gradient(to top, ${baseColor}aa, ${baseColor})`;
  } else if (value < 0.7) {
    return `linear-gradient(to top, #FFC107, ${baseColor})`;
  } else {
    return `linear-gradient(to top, #F44336, #FF5722, ${baseColor})`;
  }
};
</script>

<style scoped>
.tension-gauge {
  width: 100%;
  height: 100%;
  background: linear-gradient(180deg, rgba(20, 20, 35, 0.95), rgba(10, 10, 20, 0.98));
  border: 1px solid rgba(255, 204, 0, 0.2);
  border-radius: 10px;
  padding: 12px 10px;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  overflow: hidden;
}

.gauge-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255, 204, 0, 0.15);
  margin-bottom: 10px;
  flex-shrink: 0;
}

.gauge-title {
  font-size: 13px;
  font-weight: 600;
  background: linear-gradient(135deg, #ffd700, #ff8c00);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.gauge-sub {
  font-size: 10px;
  color: #606080;
}

.gauge-body {
  flex: 1;
  display: flex;
  justify-content: space-around;
  align-items: stretch;
  gap: 4px;
  min-height: 0;
}

.gauge-column {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  min-width: 0;
}

.gauge-bar-wrap {
  flex: 1;
  display: flex;
  gap: 4px;
  width: 100%;
  min-height: 0;
}

.gauge-bar-bg {
  flex: 1;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
  overflow: hidden;
  position: relative;
  border: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column-reverse;
  min-height: 120px;
}

.gauge-bar-fill {
  width: 100%;
  min-height: 2px;
  transition: height 0.08s ease-out;
  position: relative;
  border-radius: 2px 2px 0 0;
}

.gauge-bar-glow {
  position: absolute;
  top: -3px;
  left: 50%;
  transform: translateX(-50%);
  width: 80%;
  height: 4px;
  border-radius: 2px;
  filter: blur(2px);
  opacity: 0.8;
}

.gauge-scale {
  width: 10px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  flex-shrink: 0;
}

.scale-mark {
  font-size: 8px;
  color: #505070;
  line-height: 1;
}

.gauge-label {
  font-size: 10px;
  font-weight: 600;
  margin-top: 6px;
  white-space: nowrap;
  letter-spacing: 0.5px;
}

.gauge-value {
  font-size: 10px;
  font-family: 'Courier New', monospace;
  margin-top: 2px;
  opacity: 0.8;
}

.gauge-legend {
  display: flex;
  justify-content: center;
  gap: 14px;
  padding-top: 8px;
  margin-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  flex-shrink: 0;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  color: #707090;
}

.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}

.legend-dot.loose { background: #4CAF50; box-shadow: 0 0 4px #4CAF50; }
.legend-dot.mid { background: #FFC107; box-shadow: 0 0 4px #FFC107; }
.legend-dot.tight { background: #F44336; box-shadow: 0 0 4px #F44336; }
</style>

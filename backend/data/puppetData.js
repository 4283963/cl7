const puppetModels = {
  sunwukong: {
    id: 'sunwukong',
    name: '孙悟空',
    description: '齐天大圣孙悟空，手持金箍棒',
    parts: {
      head: { color: '#FFD700', position: [0, 2.5, 0], size: [0.8, 1.0, 0.1] },
      body: { color: '#CD853F', position: [0, 1.0, 0], size: [1.0, 1.5, 0.1] },
      leftArm: { color: '#CD853F', position: [-0.8, 1.5, 0], size: [0.3, 1.2, 0.1] },
      rightArm: { color: '#CD853F', position: [0.8, 1.5, 0], size: [0.3, 1.2, 0.1] },
      leftHand: { color: '#FFDAB9', position: [-0.8, 0.5, 0], size: [0.3, 0.3, 0.1] },
      rightHand: { color: '#FFDAB9', position: [0.8, 0.5, 0], size: [0.3, 0.3, 0.1] },
      staff: { color: '#DAA520', position: [1.3, 0.8, 0], size: [0.15, 2.0, 0.08] },
      leftLeg: { color: '#8B4513', position: [-0.35, -0.5, 0], size: [0.35, 1.0, 0.1] },
      rightLeg: { color: '#8B4513', position: [0.35, -0.5, 0], size: [0.35, 1.0, 0.1] },
      leftFoot: { color: '#000000', position: [-0.35, -1.1, 0], size: [0.4, 0.2, 0.1] },
      rightFoot: { color: '#000000', position: [0.35, -1.1, 0], size: [0.4, 0.2, 0.1] }
    },
    defaultPose: {
      head: { rotation: [0, 0, 0], position: [0, 2.5, 0] },
      body: { rotation: [0, 0, 0], position: [0, 1.0, 0] },
      leftArm: { rotation: [0, 0, -0.2], position: [-0.8, 1.5, 0] },
      rightArm: { rotation: [0, 0, 0.2], position: [0.8, 1.5, 0] },
      leftHand: { rotation: [0, 0, 0], position: [-0.8, 0.5, 0] },
      rightHand: { rotation: [0, 0, 0], position: [0.8, 0.5, 0] },
      staff: { rotation: [0, 0, 0.3], position: [1.3, 0.8, 0] },
      leftLeg: { rotation: [0, 0, 0], position: [-0.35, -0.5, 0] },
      rightLeg: { rotation: [0, 0, 0], position: [0.35, -0.5, 0] },
      leftFoot: { rotation: [0, 0, 0], position: [-0.35, -1.1, 0] },
      rightFoot: { rotation: [0, 0, 0], position: [0.35, -1.1, 0] }
    }
  }
};

const actionTracks = {
  sunwukong: [
    { time: 0, duration: 1.5, name: '起势', pose: {
      head: { rotation: [0, 0, 0], position: [0, 2.5, 0] },
      leftArm: { rotation: [0, 0, -0.5], position: [-0.8, 1.5, 0] },
      rightArm: { rotation: [0, 0, 0.3], position: [0.8, 1.5, 0] },
      staff: { rotation: [0, 0, 0.5], position: [1.3, 1.2, 0] }
    }},
    { time: 1.5, duration: 1.0, name: '挥棒', pose: {
      head: { rotation: [0, 0, 0.1], position: [0, 2.5, 0] },
      rightArm: { rotation: [0, 0, -1.2], position: [0.6, 1.8, 0] },
      staff: { rotation: [0, 0, -0.8], position: [0.5, 2.0, 0] }
    }},
    { time: 2.5, duration: 1.0, name: '跳跃', pose: {
      head: { rotation: [0, 0, 0], position: [0, 3.2, 0] },
      body: { rotation: [0, 0, 0], position: [0, 1.7, 0] },
      leftArm: { rotation: [0, 0, -0.8], position: [-1.0, 2.0, 0] },
      rightArm: { rotation: [0, 0, 0.8], position: [1.0, 2.0, 0] },
      leftLeg: { rotation: [0, 0, 0.3], position: [-0.35, 0.2, 0] },
      rightLeg: { rotation: [0, 0, -0.3], position: [0.35, 0.2, 0] },
      staff: { rotation: [0, 0, 1.0], position: [1.5, 1.5, 0] }
    }},
    { time: 3.5, duration: 1.5, name: '落地', pose: {
      head: { rotation: [0, 0, 0], position: [0, 2.6, 0] },
      body: { rotation: [0, 0, 0], position: [0, 1.1, 0] },
      leftArm: { rotation: [0, 0, -0.3], position: [-0.8, 1.4, 0] },
      rightArm: { rotation: [0, 0, 0.5], position: [0.9, 1.6, 0] },
      leftLeg: { rotation: [0, 0, -0.1], position: [-0.35, -0.5, 0] },
      rightLeg: { rotation: [0, 0, 0.1], position: [0.35, -0.5, 0] },
      staff: { rotation: [0, 0, 0.4], position: [1.4, 1.0, 0] }
    }},
    { time: 5.0, duration: 1.0, name: '眺望', pose: {
      head: { rotation: [0, 0.3, 0], position: [0, 2.5, 0] },
      leftArm: { rotation: [0, 0, -0.1], position: [-0.8, 1.5, 0] },
      rightArm: { rotation: [0, 0, 0.6], position: [0.9, 1.8, 0] },
      staff: { rotation: [0, 0, 0.2], position: [1.2, 1.0, 0] }
    }},
    { time: 6.0, duration: 2.0, name: '收势', pose: {
      head: { rotation: [0, 0, 0], position: [0, 2.5, 0] },
      body: { rotation: [0, 0, 0], position: [0, 1.0, 0] },
      leftArm: { rotation: [0, 0, -0.2], position: [-0.8, 1.5, 0] },
      rightArm: { rotation: [0, 0, 0.2], position: [0.8, 1.5, 0] },
      staff: { rotation: [0, 0, 0.3], position: [1.3, 0.8, 0] }
    }}
  ]
};

const propTracks = [
  { time: 0, duration: 2, name: '祥云', visible: true, color: '#FFE4E1' },
  { time: 2, duration: 2, name: '山景', visible: true, color: '#708090' },
  { time: 4, duration: 4, name: '宫殿', visible: true, color: '#FFD700' }
];

const musicTracks = {
  gong: [
    { time: 0, duration: 0.3, name: '开场锣', intensity: 0.8, color: '#FF4500' },
    { time: 1.5, duration: 0.2, name: '轻锣', intensity: 0.5, color: '#FF6347' },
    { time: 2.5, duration: 0.4, name: '重锣', intensity: 1.0, color: '#FF0000' },
    { time: 3.5, duration: 0.3, name: '锣声', intensity: 0.7, color: '#FF4500' },
    { time: 5.0, duration: 0.25, name: '轻锣', intensity: 0.6, color: '#FF6347' },
    { time: 6.0, duration: 0.5, name: '结束锣', intensity: 0.9, color: '#DC143C' }
  ],
  drum: [
    { time: 0, duration: 0.5, name: '开场鼓', intensity: 0.7, color: '#8B4513' },
    { time: 0.5, duration: 0.3, name: '鼓点', intensity: 0.6, color: '#A0522D' },
    { time: 1.0, duration: 0.3, name: '鼓点', intensity: 0.6, color: '#A0522D' },
    { time: 2.5, duration: 0.6, name: '急鼓', intensity: 0.9, color: '#8B0000' },
    { time: 3.5, duration: 0.4, name: '鼓点', intensity: 0.7, color: '#8B4513' },
    { time: 4.5, duration: 0.3, name: '鼓点', intensity: 0.5, color: '#A0522D' },
    { time: 6.0, duration: 0.8, name: '结束鼓', intensity: 1.0, color: '#8B0000' }
  ],
  cymbal: [
    { time: 0, duration: 0.2, name: '钹', intensity: 0.6, color: '#FFD700' },
    { time: 2.5, duration: 0.3, name: '钹', intensity: 0.8, color: '#FFD700' },
    { time: 3.5, duration: 0.2, name: '钹', intensity: 0.5, color: '#FFD700' },
    { time: 6.0, duration: 0.4, name: '钹', intensity: 0.9, color: '#FFD700' }
  ]
};

const stageConfig = {
  width: 16,
  height: 10,
  backgroundColor: '#1a0a00',
  frameColor: '#8B4513',
  curtainColor: '#DC143C',
  duration: 8
};

module.exports = {
  puppetModels,
  actionTracks,
  propTracks,
  musicTracks,
  stageConfig
};

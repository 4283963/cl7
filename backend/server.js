const express = require('express');
const cors = require('cors');
const path = require('path');
const { puppetModels, actionTracks, propTracks, musicTracks, stageConfig } = require('./data/puppetData');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.get('/api/puppets', (req, res) => {
  const result = Object.values(puppetModels).map(p => ({
    id: p.id,
    name: p.name,
    description: p.description
  }));
  res.json(result);
});

app.get('/api/puppets/:id', (req, res) => {
  const puppet = puppetModels[req.params.id];
  if (!puppet) {
    return res.status(404).json({ error: 'Puppet not found' });
  }
  res.json(puppet);
});

app.get('/api/puppets/:id/model', (req, res) => {
  const puppet = puppetModels[req.params.id];
  if (!puppet) {
    return res.status(404).json({ error: 'Puppet not found' });
  }
  res.json({
    parts: puppet.parts,
    defaultPose: puppet.defaultPose
  });
});

app.get('/api/puppets/:id/actions', (req, res) => {
  const actions = actionTracks[req.params.id];
  if (!actions) {
    return res.status(404).json({ error: 'Actions not found' });
  }
  res.json(actions);
});

app.get('/api/props', (req, res) => {
  res.json(propTracks);
});

app.get('/api/music', (req, res) => {
  res.json(musicTracks);
});

app.get('/api/stage', (req, res) => {
  res.json(stageConfig);
});

app.get('/api/performance/:puppetId', (req, res) => {
  const puppet = puppetModels[req.params.puppetId];
  if (!puppet) {
    return res.status(404).json({ error: 'Puppet not found' });
  }

  const isIntense = req.query.intense === 'true' || req.query.intense === '1';
  
  let actions = actionTracks[req.params.puppetId] || [];
  let music = musicTracks;
  const stage = { ...stageConfig };

  if (isIntense) {
    const { generateIntenseActionTrack, generateIntenseMusicTrack } = require('./data/puppetData');
    const intenseDuration = 12;
    actions = generateIntenseActionTrack(puppet.defaultPose, intenseDuration);
    music = generateIntenseMusicTrack(intenseDuration, 20);
    stage.duration = intenseDuration;
  }

  res.json({
    puppet: {
      id: puppet.id,
      name: puppet.name + (isIntense ? ' (武打戏)' : ''),
      parts: puppet.parts,
      defaultPose: puppet.defaultPose
    },
    actions,
    props: propTracks,
    music,
    stage
  });
});

app.listen(PORT, () => {
  console.log(`皮影戏后端服务已启动: http://localhost:${PORT}`);
  console.log(`API 端点:`);
  console.log(`  GET /api/puppets - 获取皮影人物列表`);
  console.log(`  GET /api/puppets/:id - 获取皮影人物详情`);
  console.log(`  GET /api/puppets/:id/model - 获取皮影模型数据`);
  console.log(`  GET /api/puppets/:id/actions - 获取动作轨道数据`);
  console.log(`  GET /api/props - 获取道具轨道数据`);
  console.log(`  GET /api/music - 获取音乐轨道数据`);
  console.log(`  GET /api/stage - 获取舞台配置`);
  console.log(`  GET /api/performance/:puppetId - 获取完整演出数据`);
});

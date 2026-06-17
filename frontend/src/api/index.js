import axios from 'axios';

const api = axios.create({
  baseURL: '/api'
});

export const getPuppets = () => api.get('/puppets').then(r => r.data);
export const getPuppet = (id) => api.get(`/puppets/${id}`).then(r => r.data);
export const getPuppetModel = (id) => api.get(`/puppets/${id}/model`).then(r => r.data);
export const getPuppetActions = (id) => api.get(`/puppets/${id}/actions`).then(r => r.data);
export const getProps = () => api.get('/props').then(r => r.data);
export const getMusic = () => api.get('/music').then(r => r.data);
export const getStage = () => api.get('/stage').then(r => r.data);
export const getPerformance = (puppetId) => api.get(`/performance/${puppetId}`).then(r => r.data);

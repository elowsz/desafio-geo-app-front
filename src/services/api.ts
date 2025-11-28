import axios from 'axios';

const api = axios.create({
  baseURL: 'http://26.168.161.45:3000/api',
  timeout: 10000,
});

export default api;

import axios from 'axios';

const api = axios.create({
  // Substitua pelo SEU IP local do backend (ex: 192.168.0.100)
  baseURL: 'http://SEU_IP:3000/api', 
  timeout: 10000,
});

export default api;

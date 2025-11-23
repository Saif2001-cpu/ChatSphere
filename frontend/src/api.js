import axios from 'axios';

// 1. Use the environment variable VITE_API_URL.
// 2. If it doesn't exist (like when running locally), fallback to localhost:8000.
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Automatically replace 'http' with 'ws' and 'https' with 'wss' for WebSockets
export const WS_URL = API_URL.replace(/^http/, 'ws');

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include the JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
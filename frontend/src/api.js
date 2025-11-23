import axios from 'axios';

// Use the environment variable if it exists (production), otherwise use localhost (development)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Automatically set the WebSocket URL based on the API URL
// Replaces 'http' with 'ws' and 'https' with 'wss'
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
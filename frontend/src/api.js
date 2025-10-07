import axios from 'axios';
import { io } from 'socket.io-client';
const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

const API = axios.create({ baseURL, timeout: 15000 });

// Socket.IO client initialization
const socket = io(baseURL, {
  autoConnect: false, // Only connect when needed
  reconnectionAttempts: 5,
  reconnectionDelay: 3000,
  auth: (cb) => {
    const userInfoString = localStorage.getItem('userInfo');
    if (userInfoString) {
      try {
        const userInfo = JSON.parse(userInfoString);
        cb({ token: userInfo.token });
      } catch (e) {
        cb({});
      }
    } else {
      cb({});
    }
  },
});

// Add a request interceptor to include the token in headers
API.interceptors.request.use(
  (config) => {
    const userInfoString = localStorage.getItem('userInfo');

    if (userInfoString) {
      try {
        const userInfo = JSON.parse(userInfoString);
        if (userInfo && userInfo.token) {
          config.headers['Authorization'] = `Bearer ${userInfo.token}`;
        }
      } catch (_) {
        // If parsing fails, clear bad data to avoid loops
        localStorage.removeItem('userInfo');
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('userInfo');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
export { socket };
export default API;

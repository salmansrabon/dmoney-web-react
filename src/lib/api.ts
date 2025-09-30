import axios from 'axios';

const API = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

// Request interceptor to add token to all requests
API.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      // Add secret key if available
      const secretKey = process.env.NEXT_PUBLIC_SECRET_KEY;
      if (secretKey) {
        config.headers['X-AUTH-SECRET-KEY'] = secretKey;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle 401/403 errors (token expiration)
API.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      // Token is expired or invalid
      if (typeof window !== 'undefined') {
        // Clear all authentication data from localStorage
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('email');
        localStorage.removeItem('userId');
        localStorage.removeItem('phoneNumber');
        localStorage.removeItem('photo');
        localStorage.removeItem('balance');
        
        // Clear token cookie
        document.cookie = 'token=; path=/; max-age=0';
        
        // Force immediate redirect without adding to history
        window.location.replace('/login');
      }
    }
    return Promise.reject(error);
  }
);

export default API;

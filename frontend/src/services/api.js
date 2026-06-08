import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
});

// Interceptor untuk menyertakan token ke setiap request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Interceptor untuk menangani token kadaluarsa
api.interceptors.response.use((response) => response, (error) => {
  if (error.response && error.response.status === 401) {
    // Bisa tambahkan logika refresh token atau logout paksa di sini
    console.error('Sesi tidak valid / kadaluarsa');
    // window.location.href = '/login'; 
  }
  return Promise.reject(error);
});

export default api;

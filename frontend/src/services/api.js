import axios from 'axios';
const rawBaseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/+$/, '');
const API_BASE_URL = rawBaseUrl.endsWith('/api') ? rawBaseUrl : `${rawBaseUrl}/api`;
const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
});
export default api;
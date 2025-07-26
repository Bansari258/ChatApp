
import axios from 'axios';
import { getToken, removeToken } from './auth';

const API_BASE_URL =  'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
    baseURL: API_BASE_URL,
});

// Add auth token to requests
api.interceptors.request.use(
    (config) => {
        const token = getToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Handle auth errors
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response?.status === 401) {
            removeToken();
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Auth APIs
export const authAPI = {
    register: (userData) => api.post('/auth/register', userData),
    login: (credentials) => api.post('/auth/login', credentials),
    getCurrentUser: () => api.get('/auth/me'),
};

// User APIs
export const userAPI = {
    searchUsers: (email) => api.get(`/users/search?email=${email}`),
    getContacts: () => api.get('/users/contacts'),
};

// Chat APIs
export const chatAPI = {
    startChat: (userEmail) => api.post('/chat/start', { userEmail }),
    getChatRooms: () => api.get('/chat/rooms'),
    getChatRoom: (roomId) => api.get(`/chat/${roomId}`),
    sendMessage: (roomId, message) => api.post(`/chat/${roomId}/message`, { text: message }),
    uploadFile: (roomId, formData) => api.post(`/chat/${roomId}/upload`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    }),
};

export default api;
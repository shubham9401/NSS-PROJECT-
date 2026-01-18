import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
    baseURL: API_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Request interceptor - add auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor - handle errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Auth API
export const authAPI = {
    register: (data) => api.post('/auth/register', data),
    login: (data) => api.post('/auth/login', data),
    logout: () => api.post('/auth/logout'),
    getMe: () => api.get('/auth/me')
};

// User API
export const userAPI = {
    getProfile: () => api.get('/users/profile'),
    updateProfile: (data) => api.put('/users/profile', data)
};

// Donation API
export const donationAPI = {
    initiate: (data) => api.post('/donations', data),
    getMyDonations: (params) => api.get('/donations', { params }),
    getDonationById: (id) => api.get(`/donations/${id}`),
    simulatePayment: (id, status) => api.post(`/donations/${id}/simulate-payment`, { status })
};

// Payment API (Razorpay)
export const paymentAPI = {
    createOrder: (data) => api.post('/payments/create-order', data),
    verifyPayment: (data) => api.post('/payments/verify', data),
    getStatus: (donationId) => api.get(`/payments/status/${donationId}`),
    syncStatus: (donationId) => api.post(`/payments/sync/${donationId}`)
};

// Admin API
export const adminAPI = {
    getDashboard: () => api.get('/admin/dashboard'),
    getRegistrations: (params) => api.get('/admin/registrations', { params }),
    getDonations: (params) => api.get('/admin/donations', { params }),
    getDonationStats: () => api.get('/admin/donations/aggregate'),
    exportRegistrations: (params) => api.get('/admin/registrations/export', {
        params,
        responseType: 'blob'
    }),
    exportDonations: (params) => api.get('/admin/donations/export', {
        params,
        responseType: 'blob'
    })
};

export default api;

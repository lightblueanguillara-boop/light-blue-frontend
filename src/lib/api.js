import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
export const API = `${BACKEND_URL}/api`;

export const api = axios.create({ baseURL: API });

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('lv_admin_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// Sessione admin scaduta o revocata (es. dopo un cambio password): torna al login.
api.interceptors.response.use(
    (r) => r,
    (error) => {
        const status = error?.response?.status;
        const url = error?.config?.url || '';
        const hadToken = !!localStorage.getItem('lv_admin_token');
        if (status === 401 && hadToken && url.startsWith('/admin') && url !== '/admin/login') {
            localStorage.removeItem('lv_admin_token');
            localStorage.removeItem('lv_admin_email');
            if (window.location.pathname.startsWith('/admin')) window.location.assign('/admin/login');
        }
        return Promise.reject(error);
    }
);

export default api;

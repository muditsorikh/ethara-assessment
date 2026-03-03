import axios from 'axios';

// API base URL - uses environment variable or falls back to localhost
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.detail || error.message || 'An error occurred';
    return Promise.reject(new Error(message));
  }
);

// Employee API calls
export const employeeApi = {
  getAll: async () => {
    const response = await api.get('/employees');
    return response.data;
  },

  getById: async (employeeId) => {
    const response = await api.get(`/employees/${employeeId}`);
    return response.data;
  },

  create: async (employeeData) => {
    const response = await api.post('/employees', employeeData);
    return response.data;
  },

  delete: async (employeeId) => {
    const response = await api.delete(`/employees/${employeeId}`);
    return response.data;
  },
};

// Attendance API calls
export const attendanceApi = {
  getAll: async (params = {}) => {
    const response = await api.get('/attendance', { params });
    return response.data;
  },

  getByEmployee: async (employeeId, params = {}) => {
    const response = await api.get(`/attendance/employee/${employeeId}`, { params });
    return response.data;
  },

  getSummary: async (employeeId) => {
    const response = await api.get(`/attendance/summary/${employeeId}`);
    return response.data;
  },

  mark: async (attendanceData) => {
    const response = await api.post('/attendance', attendanceData);
    return response.data;
  },

  delete: async (recordId) => {
    const response = await api.delete(`/attendance/${recordId}`);
    return response.data;
  },
};

// Dashboard API calls
export const dashboardApi = {
  getSummary: async () => {
    const response = await api.get('/dashboard');
    return response.data;
  },
};

export default api;

// API Client for Flask Backend with Axios interceptors

import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Create Axios instance
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper to get auth token from localStorage
const getToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  const session = localStorage.getItem('gearguard_session');
  if (session) {
    const sessionData = JSON.parse(session);
    return sessionData.token || null;
  }
  return null;
};

// Property 11: JWT Token Header Attachment - Request Interceptor
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getToken();
    if (token && config.headers) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response Interceptor for error handling
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Property 12: Update UI state immediately on successful response
    return response;
  },
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Authentication failed - redirect to login
      if (typeof window !== 'undefined') {
        localStorage.removeItem('gearguard_session');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  login: async (email: string, password: string) => {
    const response = await apiClient.post('/login', { email, password });
    return response.data;
  },

  signup: async (name: string, email: string, password: string, role: string) => {
    const response = await apiClient.post('/signup', { name, email, password, role });
    return response.data;
  },
};

// Dashboard APIs
export const dashboardAPI = {
  getStats: async () => {
    const response = await apiClient.get('/dashboard/stats');
    return response.data;
  },
};

// Maintenance Request APIs
// Maintenance APIs
export const maintenanceAPI = {
  getRequests: async () => {
    const response = await apiClient.get('/maintenance/requests');
    return response.data;
  },

  getRequest: async (id: number) => {
    const response = await apiClient.get(`/maintenance/requests/${id}`);
    return response.data;
  },

  createRequest: async (data: {
    subject: string;
    description?: string;
    request_type: 'corrective' | 'preventive';
    equipment_id?: number;
    priority?: 'low' | 'medium' | 'high' | 'critical';
    scheduled_date?: string;
  }) => {
    const response = await apiClient.post('/maintenance/requests', data);
    return response.data;
  },

  updateRequest: async (id: number, data: {
    stage_id?: number;
    technician_user_id?: number;
    priority?: string;
    kanban_state?: string;
  }) => {
    const response = await apiClient.put(`/maintenance/requests/${id}`, data);
    return response.data;
  },
};

// Equipment APIs
export const equipmentAPI = {
  getEquipment: async (categoryId?: number) => {
    const query = categoryId ? `?category_id=${categoryId}` : '';
    const response = await apiClient.get(`/equipment${query}`);
    return response.data;
  },

  getEquipmentDetail: async (id: number) => {
    const response = await apiClient.get(`/equipment/${id}`);
    return response.data;
  },

  createEquipment: async (data: {
    name: string;
    serial_number?: string;
    category_id?: number;
    maintenance_team_id?: number;
    technician_user_id?: number;
    company_id?: number;
    location?: string;
    health_percentage?: number;
  }) => {
    const response = await apiClient.post('/equipment', data);
    return response.data;
  },

  updateEquipment: async (id: number, data: {
    name?: string;
    serial_number?: string;
    category_id?: number;
    maintenance_team_id?: number;
    technician_user_id?: number;
    location?: string;
    health_percentage?: number;
  }) => {
    const response = await apiClient.put(`/equipment/${id}`, data);
    return response.data;
  },

  deleteEquipment: async (id: number) => {
    const response = await apiClient.delete(`/equipment/${id}`);
    return response.data;
  },
};

// Teams API
export const teamsAPI = {
  getTeams: async () => {
    const response = await apiClient.get('/teams');
    return response.data;
  },

  createTeam: async (data: {
    name: string;
    company_id?: number;
  }) => {
    const response = await apiClient.post('/teams', data);
    return response.data;
  },

  updateTeam: async (id: number, data: {
    name?: string;
    company_id?: number;
  }) => {
    const response = await apiClient.put(`/teams/${id}`, data);
    return response.data;
  },

  deleteTeam: async (id: number) => {
    const response = await apiClient.delete(`/teams/${id}`);
    return response.data;
  },
};

// Stages API
export const stagesAPI = {
  getStages: async () => {
    const response = await apiClient.get('/stages');
    return response.data;
  },
};

export default {
  auth: authAPI,
  dashboard: dashboardAPI,
  maintenance: maintenanceAPI,
  equipment: equipmentAPI,
  teams: teamsAPI,
  stages: stagesAPI,
};

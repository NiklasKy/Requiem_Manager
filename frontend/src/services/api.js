import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`Making ${config.method?.toUpperCase()} request to ${config.url}`);
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('Response error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const apiService = {
  // Server stats
  async getServerStats(guildId) {
    const response = await api.get(`/api/servers/${guildId}/stats`);
    return response.data;
  },

  // User stats
  async getUserStats(userId) {
    const response = await api.get(`/api/users/${userId}/stats`);
    return response.data;
  },

  // Recent changes
  async getRecentChanges(guildId, limit = 20) {
    const response = await api.get(`/api/servers/${guildId}/recent-changes`, {
      params: { limit }
    });
    return response.data;
  },

  // Role history
  async getRoleHistory(userId, guildId) {
    const response = await api.get(`/api/users/${userId}/role-history`, {
      params: { guild_id: guildId }
    });
    return response.data;
  },

  // Search users
  async searchUsers(query, guildId = null) {
    const params = { q: query };
    if (guildId) {
      params.guild_id = guildId;
    }
    const response = await api.get('/api/users/search', { params });
    return response.data;
  },

  // Get user current roles
  async getUserCurrentRoles(userId, guildId) {
    const response = await api.get(`/api/users/${userId}/current-roles`, {
      params: { guild_id: guildId }
    });
    return response.data;
  },

  // Get guild users
  async getGuildUsers(guildId, activeOnly = true) {
    const response = await api.get(`/api/servers/${guildId}/users`, {
      params: { active_only: activeOnly }
    });
    return response.data;
  },

  // Database stats (admin)
  async getDatabaseStats() {
    const response = await api.get('/api/admin/database-stats');
    return response.data;
  },

  // API info
  async getApiInfo() {
    const response = await api.get('/');
    return response.data;
  }
};

export default api;

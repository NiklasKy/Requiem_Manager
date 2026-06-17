import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token from localStorage to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor — auto-logout on 401 (expired / revoked token)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear stored credentials and redirect to login
      localStorage.removeItem('auth_token');
      // Avoid redirect loop if already on login page
      const EXCLUDED_PATHS = ['/login', '/auth/callback', '/unauthorized'];
      const isExcluded = EXCLUDED_PATHS.some(p => window.location.pathname.startsWith(p));
      if (!isExcluded) {
        window.location.href = '/login';
      }
    }
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
  async searchUsers(query, guildId = null, roleFilter = null) {
    const params = { q: query };
    if (guildId) {
      params.guild_id = guildId;
    }
    if (roleFilter) {
      params.role_filter = roleFilter;
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

  // Get bulk user roles (performance optimization)
  async getBulkUserRoles(userIds, guildId) {
    const userIdsString = userIds.join(',');
    const response = await api.get(`/api/servers/${guildId}/users/bulk-roles`, {
      params: { user_ids: userIdsString }
    });
    return response.data;
  },

  // Get guild users
  async getGuildUsers(guildId, activeOnly = true, roleFilter = null) {
    const params = { active_only: activeOnly };
    if (roleFilter) {
      params.role_filter = roleFilter;
    }
    const response = await api.get(`/api/servers/${guildId}/users`, { params });
    return response.data;
  },

  // Get role filters
  async getRoleFilters(guildId) {
    const response = await api.get(`/api/servers/${guildId}/role-filters`);
    return response.data;
  },

  // Weekly activity
  async getWeeklyActivity(guildId) {
    const response = await api.get(`/api/servers/${guildId}/weekly-activity`);
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
  },

  // ── Profile ──────────────────────────────────────────────────
  async getMyProfile() {
    const response = await api.get('/api/profile/me');
    return response.data;
  },

  async upsertGameProfile(data) {
    const response = await api.put('/api/profile/game', data);
    return response.data;
  },

  async deleteGameProfile(id) {
    const response = await api.delete(`/api/profile/game/${id}`);
    return response.data;
  },

  // ── Events ───────────────────────────────────────────────────
  async getEvents() {
    const response = await api.get('/api/events');
    return response.data;
  },

  // ── News ─────────────────────────────────────────────────────
  async getNews(limit = 20) {
    const response = await api.get('/api/news', { params: { limit } });
    return response.data;
  },

  // ── Leaderboard ──────────────────────────────────────────────
  async getLeaderboard(limit = 50) {
    const response = await api.get('/api/leaderboard', { params: { limit } });
    return response.data;
  },

  // ── Achievements (public) ────────────────────────────────────
  async getAchievements(gameName = null) {
    const params = gameName ? { game_name: gameName } : {};
    const response = await api.get('/api/achievements', { params });
    return response.data;
  },

  async getLandingStats() {
    const response = await api.get('/api/landing-stats');
    return response.data;
  },

  // ── Achievements admin CRUD ───────────────────────────────────
  async createAchievement(data) {
    const response = await api.post('/api/admin/achievements', data);
    return response.data;
  },

  async updateAchievement(id, data) {
    const response = await api.put(`/api/admin/achievements/${id}`, data);
    return response.data;
  },

  async deleteAchievement(id) {
    const response = await api.delete(`/api/admin/achievements/${id}`);
    return response.data;
  },
};

export default api;

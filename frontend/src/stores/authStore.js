// stores/authStore.js
import { create } from 'zustand';
import axios from 'axios';
import { API_BASE_URL } from '../config';

const useAuthStore = create((set) => ({
  user: null,
  token: null,
  loading: false,
  error: null,

  setUser: (user) => set({ user }),

  login: async (username, password) => {
    set({ loading: true, error: null });
    try {
      const form = new FormData();
      form.append('username', username);
      form.append('password', password);

      const res = await axios.post(`${API_BASE_URL}/auth/login`, form);
      const token = res.data.access_token;

      // Get user info
      const userRes = await axios.get(`${API_BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      set({ user: userRes.data, token });
      localStorage.setItem('token', token);
    } catch (err) {
      set({ error: err.response?.data?.detail || 'Login failed' });
    } finally {
      set({ loading: false });
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null });
  },

  loadUserFromStorage: async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await axios.get(`${API_BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      set({ user: res.data, token });
    } catch {
      localStorage.removeItem('token');
      set({ user: null, token: null });
    }
  },
}));

export default useAuthStore;

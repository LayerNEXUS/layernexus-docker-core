// services/auth.js
import axios from 'axios';
import { API_BASE_URL } from '../config';

export async function login(username, password) {
  try {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    const res = await axios.post(`${API_BASE_URL}/auth/login`, formData);
    const token = res.data.access_token;

    const me = await axios.get(`${API_BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    return {
      success: true,
      token,
      user: me.data,
    };
  } catch (err) {
    return {
      success: false,
      error: err.response?.data?.detail || 'Login failed',
    };
  }
}

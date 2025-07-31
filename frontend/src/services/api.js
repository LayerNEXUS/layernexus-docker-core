// services/api.js
import axios from 'axios';
import { API_BASE_URL } from "../config";
import { fetchWithAuth } from "../utils/fetchWithAuth";

const api = axios.create();

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;

export async function uploadFiles(formData) {
  const token = localStorage.getItem("token");

  const response = await fetchWithAuth(`${API_BASE_URL}/generate-ddl`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Upload failed");
  }

  return response.json(); // { session_id, sql, mermaid, dbml }
}
import { create } from "zustand";
import { API_BASE_URL } from "../config";

const useUserSummary = create((set, get) => ({
  summary: {
    profile: {},
    usage: {
      schemas: 0,
      filesUploaded: 0,
      aiFixesRun: 0,
    },
    schemas: [],
  },
  hasFetched: false,

  setSummary: (data) => set({ summary: data }),
  setHasFetched: (flag) => set({ hasFetched: flag }),

  refreshSummary: async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const [schemaRes, usageRes] = await Promise.all([
        fetch(`${API_BASE_URL}/ai-schema-history`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE_URL}/account-summary`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const schemaData = await schemaRes.json();
      const usageData = await usageRes.json();

      set({
        summary: {
          ...get().summary,
          schemas: schemaData.schemas ?? [],
          usage: usageData.usage ?? {},
        },
        hasFetched: true,
      });
    } catch (err) {
      console.error("❌ Failed to refresh account summary:", err);
    }
  },

  loadIfNeeded: async () => {
    const { hasFetched } = get();
    if (!hasFetched) {
      await get().refreshSummary();
    }
  },
}));

export default useUserSummary;

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { API_BASE_URL } from "../config";
import axios from "axios";

const LICENSE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const OFFLINE_GRACE_PERIOD_MS = 3 * 24 * 60 * 60 * 1000; // 3 days

export const useLicenseStore = create(
    persist(
      (set, get) => ({
        status: null,
        lastChecked: null,
        licenseId: null,
        expires: null,
  
      checkLicense: async () => {
        const now = Date.now();
        const { lastChecked, status } = get();

        // ✅ Skip if recently checked and still valid
        if (status === "valid" && lastChecked && now - lastChecked < LICENSE_TTL_MS) {
          return;
        }

        const token = localStorage.getItem("token");
        if (!token) return;

        try {
          const res = await axios.get(`${API_BASE_URL}/admin/license`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          set({
            status: res.data.status || "invalid",
            lastChecked: now,
            licenseId: res.data.license_id || null,
            expires: res.data.expires || null,
          });
        } catch (err) {
          console.warn("⚠️ License check failed:", err);

          if (lastChecked && now - lastChecked > OFFLINE_GRACE_PERIOD_MS) {
            set({ status: "expired-offline", lastChecked: now });
          } else {
            set({ status: "unknown", lastChecked: now });
          }
        }
      },
      }),
      {
        name: "license-check-store",
      }
    )
  );
import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { LockClosedIcon } from "@heroicons/react/24/outline";
import { API_BASE_URL } from "../config";

export default function LicenseSetupModal() {
  const [showModal, setShowModal] = useState(false);
  const [licenseKey, setLicenseKey] = useState("");

  useEffect(() => {
    axios.get(`${API_BASE_URL}/license/status`).then((res) => {
      if (!res.data.ready) setShowModal(true);
    });
  }, []);

  const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    // Step 1: Validate and save key
    const setupRes = await axios.post(`${API_BASE_URL}/license/setup`, {
      license_key: licenseKey,
    });

    toast.success("License key validated and saved");

    // Step 3: Reload app after success
    setTimeout(() => window.location.reload(), 1000);

  } catch (err) {
    // ⛔ Show error from backend
    const msg =
      err.response?.data?.detail ||
      err.response?.data?.message ||
      "❌ Activation failed. Please check your license key.";
    toast.error(msg);
  }
};

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-md w-full space-y-4 text-gray-900 dark:text-white shadow-lg">
        <div className="flex items-center gap-3">
          <LockClosedIcon className="h-6 w-6 text-red-500" />
          <h2 className="text-xl font-semibold">License Required</h2>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Enter your license key to activate LayerNEXUS.
        </p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            placeholder="License Key"
            value={licenseKey}
            onChange={(e) => setLicenseKey(e.target.value.trim())}
            className="w-full border px-3 py-2 rounded dark:bg-gray-800 dark:border-gray-700"
            required
          />
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg"
          >
            Save and Activate
          </button>
        </form>
      </div>
    </div>
  );
}

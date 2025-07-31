// NonAdminSettingsPage.jsx – height-controlled, scroll-safe
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Toaster, toast  } from "react-hot-toast";
import {
  User,
  Activity,
  FileText,
  BrainCircuit,
  ShieldCheck,
  Trash2,
  LogOut,
} from "lucide-react";
import useAuthStore from "../stores/authStore";
import useUserSummary from "../stores/useUserSummary";
import { API_BASE_URL } from "../config";
import { fetchWithAuth } from "../utils/fetchWithAuth";

export default function NonAdminSettingsPage() {
  const user = useAuthStore((s) => s.user);
  const { summary, refreshSummary, loadIfNeeded } = useUserSummary();
  const [modalOpen, setModalOpen] = useState(false);
  const [actionType, setActionType] = useState("schemas");
  const trainingEnabled = summary?.profile?.allow_training ?? false;
  const [trainingPending, setTrainingPending] = useState(false);
  const navigate = useNavigate();

    useEffect(() => {
    loadIfNeeded();
  }, [loadIfNeeded]);

  if (!user) {
    return (
      <main className="flex flex-1 items-center justify-center h-full bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
        <Toaster position="bottom-left" />
        <div className="text-center space-y-3">
          <p className="text-sm text-gray-500 dark:text-gray-400">Your session has ended.</p>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded-md"
            onClick={() => navigate("/login", { replace: true })}
          >
            Go to Login
          </button>
        </div>
      </main>
    );
  }


  const handleTrainingToggle = async () => {
    try {
      setTrainingPending(true);
      const res = await fetch(`${API_BASE_URL}/update-training-preference`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ allowTraining: !trainingEnabled }),
      });
      if (!res.ok) throw new Error("Failed to update preference");
      await refreshSummary();
      toast.success("Preference saved");
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong");
    } finally {
      setTrainingPending(false);
    }
  };
  

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-500 p-6">
      <Toaster position="bottom-left" />

      <div className="flex-shrink-0">
        <h1 className="text-3xl font-semibold tracking-tight">Account Settings</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Manage your profile, privacy and data usage
        </p>
      </div>

      <div className=" overflow-y-auto mt-4 space-y-6 dark:bg-gray-900 text-gray-900 dark:text-white ">
        {/* GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ">
          <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow p-4 flex items-center gap-3 text-sm">
            <img
              src={`https://api.dicebear.com/9.x/identicon/svg?seed=${user?.username || "guest"}`}
              alt="Avatar"
              className="w-12 h-12 rounded-full border border-gray-300 dark:border-gray-600"
            />
            <div>
              <div className="flex items-center gap-2 font-medium">
                <User className="w-4 h-4" /> {user.username}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Joined: {summary?.profile?.join_date || "—"}
              </p>
            </div>
          </section>

          <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow p-4 text-sm">
            <div className="flex items-start gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-500 mt-1" />
              <div>
                <h2 className="font-semibold">Anonymous Data Contribution</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Share <span className="font-medium">masked</span> schema metadata to improve LayerNEXUS (default off).
                </p>
              </div>
            </div>
            <div className="mt-3 flex justify-end">
              <button
                disabled={trainingPending}
                // onClick={handleTrainingToggle}
                className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${
                  trainingEnabled ? "bg-green-600" : "bg-gray-300"
                }`}
              >
                <span className="sr-only">Toggle</span>
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                    trainingEnabled ? "translate-x-5" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </section>
        </div>

        <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow p-6 space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <Activity className="w-6 h-6 text-purple-500" />
            <h2 className="text-xl font-semibold">Usage Analytics</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard label="Schemas Created" value={summary?.usage?.schemas ?? 0} icon={<BrainCircuit className="w-5 h-5 text-green-400" />} />
            <StatCard label="Files Processed" value={summary?.usage?.filesUploaded ?? 0} icon={<FileText className="w-5 h-5 text-blue-400" />} />
            <StatCard label="AI Fixes Run" value={summary?.usage?.aiFixesRun ?? 0} icon={<Activity className="w-5 h-5 text-purple-400" />} />
          </div>
        </section>

        <section className="bg-red-50 dark:bg-red-900/40 border border-red-300 dark:border-red-700 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-red-700 dark:text-red-400 flex items-center gap-2 mb-4">
            <Trash2 className="w-5 h-5" /> Danger Zone
          </h2>
          <div className="space-y-4">
            <DangerButton label="Clear All Schemas" Icon={Trash2} onClick={() => { setActionType("schemas"); setModalOpen(true); }} />
            <DangerButton label="Delete Account" Icon={LogOut} onClick={() => { setActionType("account"); setModalOpen(true); }} />
          </div>
        </section>
      </div>

{modalOpen && (
  <ConfirmModal
    actionType={actionType}
    onClose={() => setModalOpen(false)}
    onConfirm={async () => {
      const token = localStorage.getItem("token");
      const endpoint =
        actionType === "schemas"
          ? "/delete-schemas"
          : "/remove-account";

      try {
        const res = await fetchWithAuth(`${API_BASE_URL}${endpoint}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });

        if (actionType === "account") {
          navigate("/login", { replace: true })
          localStorage.removeItem("token");
          useAuthStore.getState().logout?.(); // optional
          return;
        }

        await refreshSummary();
      } catch (err) {
        console.error(err);
        toast.error("Failed to complete action");
      } finally {
        setModalOpen(false);
      }
    }}
  />
)}
    </main>
  );
}

const StatCard = ({ label, value, icon }) => (
  <div className="bg-gray-50 dark:bg-gray-800 p-5 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-between">
    <div>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
    <div className="text-gray-500 dark:text-gray-300">{icon}</div>
  </div>
);

const DangerButton = ({ label, Icon, onClick }) => (
  <button onClick={onClick} className="w-full flex items-center justify-between px-4 py-3 bg-red-900/10 hover:bg-red-900/20 dark:bg-red-900/30 rounded border border-red-500/60">
    <span>{label}</span>
    <Icon className="w-4 h-4" />
  </button>
);

const ConfirmModal = ({ actionType, onClose, onConfirm }) => (
  <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-300 dark:border-gray-700 max-w-sm w-full">
      <h3 className="text-lg font-semibold mb-4 text-red-600 dark:text-red-400">Confirm {actionType === "schemas" ? "Clear Schemas" : "Delete Account"}</h3>
      <p className="text-sm text-gray-700 dark:text-gray-300 mb-6">This action cannot be undone.</p>
      <div className="flex justify-end gap-3">
        <button className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 text-sm" onClick={onClose}>Cancel</button>
        <button className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-sm text-white" onClick={async () => { await onConfirm(); onClose(); }}>Yes, Delete</button>
      </div>
    </div>
  </div>
);

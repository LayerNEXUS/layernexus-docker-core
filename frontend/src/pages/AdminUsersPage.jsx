import { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE_URL } from "../config";
import { 
  PencilIcon, TrashIcon, ArrowPathIcon, UserPlusIcon, 
  KeyIcon, UsersIcon, ShieldCheckIcon, ShieldExclamationIcon,
  EyeIcon, EyeSlashIcon 
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import { fetchWithAuth } from "../utils/fetchWithAuth";

export default function AdminUsersPage() {
  const [form, setForm] = useState({ username: "", password: "", is_admin: false });
  const [users, setUsers] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const strengthColors = ['text-red-500', 'text-orange-500', 'text-yellow-500', 'text-green-500'];

  const fetchUsers = async () => {
    try {
      const data = await fetchWithAuth(`${API_BASE_URL}/auth/users`);
      setUsers(data);
    } catch (err) {
      toast.error("Failed to fetch users");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (users.length >= 5) return toast.error("User limit reached (max 5 users)");
    
    try {
      await fetchWithAuth(`${API_BASE_URL}/auth/create-user`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      toast.success(`Created user: ${form.username}`);
      setForm({ username: "", password: "", is_admin: false });
      await fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to create user");
    }
  };

    // Corrected delete handler with window.confirm
    const handleDelete = async (id) => {
      if (!window.confirm("Permanently delete this user?")) return;
      try {
        await fetchWithAuth(`${API_BASE_URL}/auth/users/${id}`, { method: "DELETE" });
        setUsers(users.filter(u => u.id !== id));
        toast.success("User deleted");
      } catch {
        toast.error("Delete failed");
      }
    };

    // Add missing handleChange function
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const updateUser = async (userData) => {
    try {
      await fetchWithAuth(`${API_BASE_URL}/auth/users/${userData.id}`, {
        method: "PUT",
        body: JSON.stringify(userData)
      });
      toast.success("User updated");
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Update failed");
    }
  };

  const generatePassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()";
    const password = Array.from({ length: 15 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    calculateStrength(password);
    return password;
  };

  const calculateStrength = (password) => {
    const strength = Math.min(
      Math.floor(password.length / 4) +
      (/[A-Z]/.test(password) ? 1 : 0) +
      (/[0-9]/.test(password) ? 1 : 0) +
      (/[^A-Za-z0-9]/.test(password) ? 1 : 0),
      4
    );
    setPasswordStrength(strength);
  };

  const handlePasswordChange = (value) => {
    calculateStrength(value);
    setForm(prev => ({ ...prev, password: value }));
  };

  // API Key Management
  const fetchKey = async () => {
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/admin/openai-key`);
      setApiKey(res.openai_api_key || "");
    } catch {
      toast.error("Failed to load key");
    }
  };

  const saveKey = async () => {
    if (!apiKey) return toast.error("Please enter an API key");
    try {
      await fetchWithAuth(`${API_BASE_URL}/admin/openai-key`, {
        method: "POST",
        body: JSON.stringify({ openai_api_key: apiKey })
      });
      toast.success("API key saved");
    } catch {
      toast.error("Failed to save key");
    }
  };

  useEffect(() => { fetchUsers(); }, []);
  useEffect(() => { if (users.some(u => u.is_admin)) fetchKey(); }, [users]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white transition-colors duration-500 p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight">Admin Dashboard</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Manage users and platform settings
          </p>
        </div>
      
      {/* User Creation Card */}
      <div className="space-y-4 max-h-[calc(100vh-180px)] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700 scrollbar-track-transparent hover:scrollbar-thumb-gray-700 dark:hover:scrollbar-thumb-gray-700">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 mb-4">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-3">
          <UserPlusIcon className="w-6 h-6 text-cyan-500" />
          Create New User
          <span className="text-sm font-normal text-gray-500 ml-2">
            ({users.length}/5 users created)
          </span>
        </h2>
        
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Username</label>
            <input
              name="username"
              value={form.username}
              onChange={handleChange}
              required
              className="w-full rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 px-4 py-3"
              placeholder="Enter username"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Password
              <span className={`ml-2 ${strengthColors[passwordStrength]}`}>
                {'★'.repeat(passwordStrength + 1)}
              </span>
            </label>
            <div className="relative">
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                required
                className="w-full rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 px-4 py-3 pr-12"
                placeholder="Generate or enter password"
              />
              <button
                type="button"
                onClick={() => handlePasswordChange(generatePassword())}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-cyan-600"
              >
                <ArrowPathIcon className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex flex-col justify-end space-y-4">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                name="is_admin"
                checked={form.is_admin}
                onChange={handleChange}
                className="w-4 h-4 rounded border-gray-300 text-cyan-600 focus:ring-cyan-600"
              />
              <span className="text-sm">Admin Privileges</span>
            </label>
            <button
              type="submit"
              className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-medium py-2.5 rounded-lg transition-all"
            >
              Create User
            </button>
          </div>
        </form>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold flex items-center gap-3">
            <UsersIcon className="w-6 h-6 text-cyan-500" />
            User Management
          </h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium">User</th>
                <th className="px-4 py-3 text-center text-sm font-medium">Admin</th>
                <th className="px-4 py-3 text-center text-sm font-medium">Created</th>
                <th className="px-4 py-3 text-center text-sm font-medium">Last Active</th>
                <th className="px-4 py-3 text-center text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-900">
                  <td className="px-4 py-3 text-sm font-medium">{user.username}</td>
                  <td className="px-4 py-3 text-center">
                    {user.is_admin ? (
                      <ShieldCheckIcon className="w-5 h-5 text-green-500 mx-auto" />
                    ) : (
                      <ShieldExclamationIcon className="w-5 h-5 text-gray-400 mx-auto" />
                    )}
                  </td>
                  <td className="px-4 py-3 text-center text-sm">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-center text-sm">
                    {user.last_login ? new Date(user.last_login).toLocaleString() : 'Never'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex justify-center space-x-3">
                      <button
                        onClick={() => setEditingUser({ ...user, password: '' })}
                        className="text-cyan-600 hover:text-cyan-700 p-1 rounded-lg"
                      >
                        <PencilIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="text-red-500 hover:text-red-600 p-1 rounded-lg"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* API Key Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mt-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-3">
          <KeyIcon className="w-6 h-6 text-cyan-500" />
          OpenAI API Configuration
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="col-span-2">
            <label className="block text-sm font-medium mb-2">API Key</label>
            <div className="relative">
              <input
                type={showKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 px-4 py-3 pr-12"
                placeholder="sk-...xxxxxxxx"
              />
              <button
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-cyan-600"
              >
                {showKey ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
              </button>
            </div>
          </div>
          <button
            onClick={saveKey}
            className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-medium py-2.5 rounded-lg transition-all"
          >
            Save Key
          </button>
        </div>
        <p className="text-sm text-gray-500 mt-3">
          Key is encrypted at rest and only used for authorized AI operations
        </p>
      </div>

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-4">Edit User: {editingUser.username}</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Username</label>
                <input
                  value={editingUser.username}
                  onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })}
                  className="w-full rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 px-4 py-3"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">New Password</label>
                <input
                  type="password"
                  placeholder="Leave blank to keep current"
                  onChange={(e) => setEditingUser({ ...editingUser, password: e.target.value })}
                  className="w-full rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 px-4 py-3"
                />
              </div>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={editingUser.is_admin}
                  onChange={(e) => setEditingUser({ ...editingUser, is_admin: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300 text-cyan-600 focus:ring-cyan-600"
                />
                <span className="text-sm">Admin Privileges</span>
              </label>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  updateUser(editingUser);
                  setEditingUser(null);
                }}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
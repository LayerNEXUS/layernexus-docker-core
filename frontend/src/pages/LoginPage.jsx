// src/pages/LoginPage.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../services/auth";
import useAuthStore from "../stores/authStore";
import DarkModeToggle from "../components/DarkModeToggle";
import HelpButton from "../components/HelpButton";
import { compareVersions } from "compare-versions";
import { APP_VERSION } from "../constants/version";

const CURRENT_VERSION = APP_VERSION;

export default function LoginPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();
    const setUser = useAuthStore((s) => s.setUser);

    const [versionBlocked, setVersionBlocked] = useState(false);
    const [upgradeMsg, setUpgradeMsg] = useState("");
    const [latestVersion, setLatestVersion] = useState("");
  
    const handleLogin = async (e) => {
      e.preventDefault();
      const result = await login(username, password);
      if (result.success) {
        setUser(result.user);
        localStorage.setItem("token", result.token);
        navigate("/dashboard");
      } else {
        setError("Invalid username or password");
      }
    };
    

    useEffect(() => {
    fetch("https://layernexus.com/version.json")
      .then(res => res.json())
      .then(data => {
        if (compareVersions(CURRENT_VERSION, data.block_versions_below) < 0) {
          setVersionBlocked(true);
          setUpgradeMsg(data.message);
          setLatestVersion(data.latest);
        }
      })
      .catch(err => console.warn("Version check failed", err));
  }, []);

    if (versionBlocked) {
      return (
        <div className="min-h-screen flex items-center justify-center dark:bg-gray-900  p-4 font-mono">
          <div className="max-w-md w-full">
            <img
              src="/logo192.png" // or your actual logo path like /logo.svg or /layernexus-logo.png
              alt="LayerNEXUS Logo"
              className="mx-auto mb-6 h-14 w-auto"
            />
            <h1 className="text-3xl font-bold text-nexus-blue mb-2">Update Required</h1>
            <p className="text-gray-700 dark:text-gray-300 text-lg">{upgradeMsg}</p>
              <span className="text-sm">
                Current version: <code>{CURRENT_VERSION}</code> → Latest: <code>{latestVersion}</code>
              </span>
  <span className="text-sm text-gray-500 dark:text-gray-400 block mt-2">
    Apologies for the inconvenience. We’re continuously improving LayerNEXUS to bring you a better experience.
  </span>
            <a
              href="https://layernexus.com/changelog"
              className="mt-4 inline-block px-4 py-2 bg-nexus-blue text-white rounded shadow"
              target="_blank"
              rel="noopener noreferrer"
            >
              View Latest Update →
            </a>
            
          </div>
        </div>
      );
    }
  
    return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 transition-colors duration-500 px-4">

        <div className="absolute top-4 right-4 flex items-center gap-4">
            <DarkModeToggle />
        </div>

        {/* Logo / Title */}
        <div className="mb-6 text-center">
        {/* You can swap this h1 with an <img src="logo.svg" /> if needed */}
        <h1 className="text-4xl font-bold text-gray-800 dark:text-white tracking-tight">
            Layer<span className="ml-1 bg-gradient-to-br from-blue-700 via-cyan-600 to-purple-400 bg-clip-text text-transparent">NEXUS</span>
        </h1>
        </div>

        {/* Login Box */}
        <div className="w-full max-w-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-md p-8 transition-colors duration-500">
          <h1 className="text-2xl dark:text-white font-semibold text-gray-900 text-center mb-6">
            Sign in to your account
          </h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1 transition-colors duration-500">
                Username
              </label>
              <input
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1 transition-colors duration-500">
                Password
              </label>
              <input
                type="password"
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition duration-200"
            >
              Log In
            </button>
          </form>
        </div>
        
        <HelpButton />
      </div>
    );
  }
  

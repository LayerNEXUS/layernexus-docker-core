import { useEffect } from "react";
import { APP_VERSION } from "../constants/version";
import Sidebar from "./Sidebar";
import DarkModeToggle from "./DarkModeToggle";
import {useLicenseStore} from "../stores/licenseStore"
import useOpenAIStatus from "../services/useOpenAIStatus";  

export default function Layout({ children }) {
  
  const { status, checkLicense, licenseId, expires } = useLicenseStore();
  const openaiStatus = useOpenAIStatus(); 

  useEffect(() => {
    checkLicense();
  }, []);

  const licenseLabel = {
    valid: "Verified",
    unknown: "Offline (valid)",
    "expired-offline": "Offline too long",
    invalid: "Invalid license",
  };
  
  const color = {
    valid: "bg-green-500",
    unknown: "bg-yellow-400",
    "expired-offline": "bg-orange-500",
    invalid: "bg-red-500",
  };
  
  const tooltip = {
    valid: "License is active and verified.",
    unknown: "License is valid but could not be reverified (offline).",
    "expired-offline": "License has expired due to offline too long.",
    invalid: "License is invalid or rejected.",
  };

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white transition-colors relative">
      <Sidebar />

      <main className="flex-1 relative">
        {/* Dark mode toggle in top-right corner */}
        <div className="absolute top-4 right-4 z-50">
          <DarkModeToggle />
        </div>

        {/* Page content */}
        <div>{children}</div>

        <div className="absolute bottom-2 right-2 flex items-center gap-2 text-xs text-gray-400">
          <span>LayerNEXUS {APP_VERSION}</span>

          {status && (
            <div
              className={`flex items-center gap-1 ${
                status === "valid"
                  ? "text-green-500"
                  : status === "unknown"
                  ? "text-yellow-500"
                  : status === "expired-offline"
                  ? "text-orange-500"
                  : "text-red-500"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  status === "valid"
                    ? "bg-green-500 animate-pulse"
                    : status === "unknown"
                    ? "bg-yellow-400 animate-pulse"
                    : status === "expired-offline"
                    ? "bg-orange-500"
                    : "bg-red-500"
                }`}
              />
              {status === "valid" && expires ? (
                <span>
                  Verified • expires in{" "}
                  {Math.max(0, Math.ceil((new Date(expires) - Date.now()) / (1000 * 60 * 60 * 24)))}{" "}
                  day{Math.ceil((new Date(expires) - Date.now()) / (1000 * 60 * 60 * 24)) !== 1 ? "s" : ""}
                </span>
              ) : status === "unknown" ? (
                <span>Offline (valid)</span>
              ) : status === "expired-offline" ? (
                <span>Offline too long</span>
              ) : (
                <span>Un-Verified</span>
              )}
            </div>
          )}
        </div>

        {/* ─────────────────────────────
             Bottom-left: OpenAI-key status
           ───────────────────────────── */}
        <div className="absolute bottom-2 left-2 flex items-center gap-2 text-xs text-gray-400">
          {/* Status dot */}
          <span
            className={`w-2 h-2 rounded-full ${
              openaiStatus === "available"
                ? "bg-green-500"
                : openaiStatus === "checking"
                ? "bg-yellow-400"
                : "bg-red-500"
            }`}
          />

          {/* Label */}
          <span>
            {openaiStatus === "available"
              ? "OpenAI Key Active"
              : openaiStatus === "checking"
              ? "Checking…"
              : "Key Missing - please contact admin or provide a key"}
          </span>
        </div>
        
      </main>
    </div>
  );
}

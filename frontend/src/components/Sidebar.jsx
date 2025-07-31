// src/components/Sidebar.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  HomeIcon,
  ArrowLeftOnRectangleIcon,
  CloudArrowUpIcon,
  RectangleStackIcon,
  Cog6ToothIcon,
  Bars3Icon,
  QuestionMarkCircleIcon,
  UsersIcon
} from "@heroicons/react/24/outline";
import useAuthStore from "../stores/authStore";
import useSidebarStore from "../stores/useSidebarStore";
import useSchemaStore from "../stores/useSchemaStore";

export default function Sidebar() {
  const { collapsed, setCollapsed } = useSidebarStore();
  const navigate = useNavigate();
  const { user, loading } = useAuthStore();
  const resetSchemaState = useSchemaStore((state) => state.resetSchemaState);

  if (loading && !user) return null; 

  const menu = [
    { label: "Home", icon: <HomeIcon className="h-5 w-5" />, path: "/dashboard" },
    { label: "Upload", icon: <CloudArrowUpIcon className="h-5 w-5" />, path: "/upload" },
    { label: "Schemas", icon: <RectangleStackIcon className="h-5 w-5" />, path: "/schema-store" },
    { label: "Settings", icon: <Cog6ToothIcon className="h-5 w-5" />, path: "/settings" },
    { label: "Help & Support", icon: <QuestionMarkCircleIcon className="h-5 w-5" />, path: "/help" }

  ];

  

  // 👇 Only admins see this
    if (user?.is_admin) {
        menu.push({
        label: "Admin",
        icon: <UsersIcon className="h-5 w-5" />,
        path: "/admin/users",
        });
    }

  return (
        <aside
        className={`h-screen bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700  ${
            collapsed ? "w-16" : "w-56"
        } transition-[width] duration-300 flex flex-col justify-between`}
        >
        {/* Top section */}
        <div className="p-4">
            <div className={`flex items-center mb-6 gap-2 px-2`}>
            {/* Burger + Logo (Always show icon) */}
            <button
                onClick={() => setCollapsed(!collapsed)}
                className="flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            >
                <Bars3Icon className="h-6 w-6" />
            </button>
            </div>

            <nav className="space-y-2">
            {menu.map((item) => (
                <button
                key={item.label}
                onClick={() => navigate(item.path)}
                className="flex items-center px-2 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-sm text-left gap-3 overflow-hidden"
                >
                {/* ICON — always visible */}
                <div className="min-w-[24px] text-gray-600 dark:text-gray-300">{item.icon}</div>

                {/* TEXT — smooth transition */}
                <span
                    className={`transition-all duration-300 origin-left whitespace-nowrap ${
                    collapsed ? "opacity-0 scale-95 w-0" : "opacity-100 scale-100"
                    }`}
                >
                    {item.label}
                </span>
                </button>
            ))}
            </nav>
        </div>

      

        {/* Bottom section */}
        <div className="p-4">
            <button
            onClick={() => {
                localStorage.removeItem("token");
                resetSchemaState(); // 🧼 clear Zustand
                navigate("/login"); // 🚪 send to login
            }}
            className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-700 text-red-600 dark:text-red-400 w-full text-sm overflow-hidden"
            >
            <div className="min-w-[24px]">
                <ArrowLeftOnRectangleIcon className="h-5 w-5" />
            </div>
            <span
                className={`transition-all duration-300 origin-left whitespace-nowrap ${
                collapsed ? "opacity-0 scale-95 w-0" : "opacity-100 scale-100"
                }`}
            >
                Logout
            </span>
            </button>
        </div>
    </aside>
  );
}

import { useThemeStore } from "../stores/themeStore";
import { useEffect } from "react";
import { Sun, Moon } from "lucide-react";

export default function DarkModeToggle() {
  const darkMode = useThemeStore((s) => s.darkMode);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);



  return (
    <button
      onClick={toggleTheme}
      title="Toggle dark mode"
      className={`w-12 h-6 flex items-center justify-between rounded-full px-1 transition-colors duration-300 ${
        darkMode ? "bg-yellow-600" : "bg-gray-500"
      }`}
    >
      <Sun className="w-4 h-4 text-yellow-400" />
      <Moon className="w-4 h-4 text-white" />
      <div
        className={`absolute w-4 h-4 rounded-full bg-white transform transition-transform duration-300 ${
          darkMode ? "translate-x-6" : "translate-x-0"
        }`}
      />
    </button>
  );
}

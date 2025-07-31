import { create } from "zustand";

export const useThemeStore = create((set) => ({
  darkMode: localStorage.getItem("darkMode") === "true",
  toggleTheme: () =>
    set((state) => {
      const newVal = !state.darkMode;
      localStorage.setItem("darkMode", newVal);
      if (newVal) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      return { darkMode: newVal };
    }),
}));

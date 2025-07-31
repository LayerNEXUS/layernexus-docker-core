import { create } from "zustand";

const useSidebarStore = create((set) => ({
  collapsed: false,
  setCollapsed: (value) => set({ collapsed: value }),
}));

export default useSidebarStore;

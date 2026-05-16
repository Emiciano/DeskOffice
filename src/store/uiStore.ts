import { create } from "zustand";
import { persist } from "zustand/middleware";

type ThemeMode = "light" | "dark";

type UiState = {
  theme: ThemeMode;
  toggleTheme: () => void;
};

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      theme: "light",
      toggleTheme: () => set((s) => ({ theme: s.theme === "light" ? "dark" : "light" })),
    }),
    { name: "ui-theme-mode" },
  ),
);

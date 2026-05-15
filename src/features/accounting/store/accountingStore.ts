import { create } from "zustand";
import { persist } from "zustand/middleware";
import { chartOfAccountsSeed } from "@/data/chartOfAccounts";
import type { ChartAccount, SkrType } from "../types/accountingTypes";

type AccountingState = {
  accounts: ChartAccount[];
  selectedSkr: SkrType;
  setSelectedSkr: (skr: SkrType) => void;
  addAccount: (payload: Omit<ChartAccount, "id">) => void;
  updateAccount: (id: string, patch: Partial<ChartAccount>) => void;
  toggleActive: (id: string) => void;
};

export const useAccountingStore = create<AccountingState>()(
  persist(
    (set) => ({
      accounts: chartOfAccountsSeed,
      selectedSkr: "SKR03",
      setSelectedSkr: (selectedSkr) => set({ selectedSkr }),
      addAccount: (payload) =>
        set((state) => ({
          accounts: [{ ...payload, id: `${payload.skrType}-${payload.number}-${Date.now()}` }, ...state.accounts],
        })),
      updateAccount: (id, patch) =>
        set((state) => ({
          accounts: state.accounts.map((a) => (a.id === id ? { ...a, ...patch } : a)),
        })),
      toggleActive: (id) =>
        set((state) => ({
          accounts: state.accounts.map((a) => (a.id === id ? { ...a, active: !a.active } : a)),
        })),
    }),
    { name: "accounting-store-v1" },
  ),
);

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { chartOfAccountsSeed } from "@/data/chartOfAccounts";
import type { ChartAccount, SkrType } from "../types/accountingTypes";

type AccountingState = {
  accounts: ChartAccount[];
  selectedSkr: SkrType;
  companyId: string;
  setSelectedSkr: (skr: SkrType) => void;
  hydrateFromApi: () => Promise<void>;
  addAccount: (payload: Omit<ChartAccount, "id">) => void;
  updateAccount: (id: string, patch: Partial<ChartAccount>) => void;
  toggleActive: (id: string) => void;
};

export const useAccountingStore = create<AccountingState>()(
  persist(
    (set) => ({
      accounts: chartOfAccountsSeed,
      selectedSkr: "SKR03",
      companyId: "default-company",
      setSelectedSkr: (selectedSkr) => set({ selectedSkr }),
      hydrateFromApi: async () => {
        try {
          const b = await fetch("/api/bootstrap").then((r) => r.json());
          const companyId = String(b.companyId ?? "default-company");
          const items = await fetch(`/api/accounts?companyId=${companyId}`).then((r) => r.json());
          if (Array.isArray(items) && items.length > 0) {
            set({ accounts: items, companyId });
          } else {
            set({ companyId });
          }
        } catch {
          // Fallback bleibt im lokalen Seed-State.
        }
      },
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

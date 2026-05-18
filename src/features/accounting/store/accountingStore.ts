import { create } from "zustand";
import { apiFetch } from "@/lib/api";
import type { ChartAccount, SkrType } from "../types/accountingTypes";

type ImportPayload = {
  format: "csv" | "json";
  data: string;
  skrType: SkrType;
  year: number;
  replace: boolean;
};

type AccountingState = {
  accounts: ChartAccount[];
  selectedSkr: SkrType;
  selectedYear: number;
  companyId: string;
  versions: Array<{ skrType: SkrType; year: number; count: number }>;
  setSelectedSkr: (skr: SkrType) => void;
  setSelectedYear: (year: number) => void;
  hydrateFromApi: () => Promise<void>;
  importAccounts: (payload: ImportPayload) => Promise<{ imported: number }>;
  updateAccount: (id: string, patch: Partial<ChartAccount>) => Promise<void>;
};

export const useAccountingStore = create<AccountingState>()((set, get) => ({
  accounts: [],
  selectedSkr: "SKR03",
  selectedYear: new Date().getFullYear(),
  companyId: "default-company",
  versions: [],
  setSelectedSkr: (selectedSkr) => set({ selectedSkr }),
  setSelectedYear: (selectedYear) => set({ selectedYear }),
  hydrateFromApi: async () => {
    const b = await apiFetch("/api/bootstrap").then((r) => r.json());
    const companyId = String(b.companyId ?? "default-company");
    const versions = await apiFetch(`/api/accounts/versions?companyId=${companyId}`).then((r) => r.json());
    const typedVersions = Array.isArray(versions) ? versions : [];
    const selectedYear = typedVersions[0]?.year ?? get().selectedYear;
    const selectedSkr = typedVersions[0]?.skrType ?? get().selectedSkr;
    const items = await apiFetch(
      `/api/accounts?companyId=${companyId}&skrType=${selectedSkr}&year=${selectedYear}`,
    ).then((r) => r.json());
    set({
      accounts: Array.isArray(items) ? items : [],
      companyId,
      versions: typedVersions,
      selectedYear,
      selectedSkr,
    });
  },
  importAccounts: async (payload) => {
    const state = get();
    const res = await apiFetch("/api/accounts/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, companyId: state.companyId }),
    });
    if (!res.ok) {
      let message = "Import fehlgeschlagen";
      try {
        const body = (await res.json()) as { error?: string };
        if (body?.error) message = body.error;
      } catch {
        // ignore json parse errors
      }
      throw new Error(message);
    }
    const data = (await res.json()) as { imported: number };
    await get().hydrateFromApi();
    return data;
  },
  updateAccount: async (id, patch) => {
    const state = get();
    const res = await apiFetch(`/api/accounts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...patch, companyId: state.companyId }),
    });
    if (!res.ok) throw new Error("Konto konnte nicht gespeichert werden");
    set((current) => ({
      accounts: current.accounts.map((a) => (a.id === id ? { ...a, ...patch } : a)),
    }));
  },
}));

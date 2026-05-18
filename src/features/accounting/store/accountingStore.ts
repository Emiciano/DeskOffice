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
  setSelectedSkr: (skr: SkrType) => Promise<void>;
  setSelectedYear: (year: number) => Promise<void>;
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
  setSelectedSkr: async (selectedSkr) => {
    const state = get();
    const yearFallback = state.versions.find((v) => v.skrType === selectedSkr)?.year ?? state.selectedYear;
    const items = await apiFetch(
      `/api/accounts?companyId=${state.companyId}&skrType=${selectedSkr}&year=${yearFallback}`,
    ).then((r) => r.json());
    set({
      selectedSkr,
      selectedYear: yearFallback,
      accounts: Array.isArray(items) ? items : [],
    });
  },
  setSelectedYear: async (selectedYear) => {
    const state = get();
    const items = await apiFetch(
      `/api/accounts?companyId=${state.companyId}&skrType=${state.selectedSkr}&year=${selectedYear}`,
    ).then((r) => r.json());
    set({
      selectedYear,
      accounts: Array.isArray(items) ? items : [],
    });
  },
  hydrateFromApi: async () => {
    const b = await apiFetch("/api/bootstrap").then((r) => r.json());
    const companyId = String(b.companyId ?? "default-company");
    const versions = await apiFetch(`/api/accounts/versions?companyId=${companyId}`).then((r) => r.json());
    const typedVersions = (Array.isArray(versions) ? versions : []) as Array<{ skrType: SkrType; year: number; count: number }>;
    const settings = await apiFetch(`/api/settings?companyId=${companyId}`).then((r) => r.json()).catch(() => ({}));
    const preferredSkr = settings?.accountFrame === "SKR04" ? "SKR04" : settings?.accountFrame === "SKR03" ? "SKR03" : get().selectedSkr;
    const selectedVersion =
      typedVersions.find((v) => v.skrType === preferredSkr) ??
      typedVersions.find((v) => v.skrType === get().selectedSkr) ??
      typedVersions[0];
    const selectedYear = selectedVersion?.year ?? get().selectedYear;
    const selectedSkr = selectedVersion?.skrType ?? get().selectedSkr;
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

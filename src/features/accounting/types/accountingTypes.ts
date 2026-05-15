import type { AccountType, ChartAccount, SkrType } from "@/data/chartOfAccounts";

export type { AccountType, ChartAccount, SkrType };

export type AccountFilters = {
  query: string;
  skrType: "Alle" | SkrType;
  type: "Alle" | AccountType;
  active: "Alle" | "Aktiv" | "Inaktiv";
};

export type SkrType = "SKR03" | "SKR04";
export type AccountStatus = "Aktiv" | "Inaktiv";

export type ChartAccount = {
  id: string;
  number: string;
  name: string;
  skrType: SkrType;
  year: number;
  accountClass: string;
  accountType: string;
  taxKey: string | null;
  active: boolean;
};

export type AccountFilters = {
  query: string;
  skrType: "Alle" | SkrType;
  year: "Alle" | number;
  active: "Alle" | AccountStatus;
};

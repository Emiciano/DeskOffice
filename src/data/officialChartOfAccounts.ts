export type SkrType = "SKR03" | "SKR04";

export type OfficialChartAccount = {
  number: string;
  name: string;
  skrType: SkrType;
  year: number;
  accountClass: string;
  accountType: string;
  taxKey: string | null;
  active: boolean;
};

// Intentionally empty: only official verified DATEV data may be imported.
// If no verified source file is available, system must require import by admin.
export const officialChartOfAccountsSeed: OfficialChartAccount[] = [];

import type { ChartAccount } from "../types/accountingTypes";

export function accountLabel(account: ChartAccount) {
  return `${account.number} ${account.name}`;
}

export function filterAccounts(accounts: ChartAccount[], query: string) {
  const q = query.toLowerCase();
  if (!q) return accounts;
  return accounts.filter(
    (a) =>
      a.number.includes(q) ||
      a.name.toLowerCase().includes(q) ||
      a.accountClass.toLowerCase().includes(q) ||
      a.accountType.toLowerCase().includes(q),
  );
}

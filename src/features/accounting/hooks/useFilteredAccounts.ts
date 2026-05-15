import { useMemo } from "react";
import { useAccountingStore } from "../store/accountingStore";

export function useFilteredAccounts(query: string) {
  const { accounts, selectedSkr } = useAccountingStore();
  return useMemo(
    () =>
      accounts.filter(
        (a) =>
          a.skrType === selectedSkr &&
          a.active &&
          (!query || `${a.number} ${a.name}`.toLowerCase().includes(query.toLowerCase())),
      ),
    [accounts, selectedSkr, query],
  );
}

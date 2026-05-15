import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useAccountingStore } from "../store/accountingStore";
import { accountLabel, filterAccounts } from "../utils/accountingUtils";
import type { ChartAccount } from "../types/accountingTypes";

type Props = {
  value: string;
  onSelect: (account: ChartAccount) => void;
  placeholder?: string;
};

export function AccountAutocomplete({ value, onSelect, placeholder = "Konto suchen..." }: Props) {
  const { accounts, selectedSkr } = useAccountingStore();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  const selected = accounts.find((a) => a.number === value) ?? null;
  const source = useMemo(() => accounts.filter((a) => a.skrType === selectedSkr && a.active), [accounts, selectedSkr]);
  const results = useMemo(() => filterAccounts(source, query).slice(0, 12), [source, query]);

  return (
    <div className="relative">
      <button
        type="button"
        className="flex h-10 w-full items-center justify-between rounded-xl border border-border px-3 text-sm"
        onClick={() => setOpen((o) => !o)}
      >
        <span className={selected ? "" : "text-muted-foreground"}>
          {selected ? accountLabel(selected) : placeholder}
        </span>
      </button>
      {open ? (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-border bg-white p-2 shadow-soft">
          <div className="mb-2 flex items-center rounded-lg border border-border px-2">
            <Search size={14} className="text-muted-foreground" />
            <input
              autoFocus
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActive(0);
              }}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") setActive((i) => Math.min(results.length - 1, i + 1));
                if (e.key === "ArrowUp") setActive((i) => Math.max(0, i - 1));
                if (e.key === "Enter" && results[active]) {
                  onSelect(results[active]);
                  setOpen(false);
                }
              }}
              className="h-8 w-full px-2 text-sm outline-none"
              placeholder="Nummer oder Name..."
            />
          </div>
          <div className="max-h-64 overflow-auto">
            {results.map((acc, idx) => (
              <button
                type="button"
                key={acc.id}
                className={`mb-1 block w-full rounded-lg px-2 py-2 text-left text-sm ${active === idx ? "bg-muted" : "hover:bg-muted/70"}`}
                onClick={() => {
                  onSelect(acc);
                  setOpen(false);
                }}
              >
                <div className="flex items-center justify-between">
                  <span>{acc.number} {acc.name}</span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">{acc.taxRate}%</span>
                </div>
                <p className="text-xs text-muted-foreground">{acc.type} · {acc.category}</p>
              </button>
            ))}
            {results.length === 0 ? <p className="px-2 py-3 text-xs text-muted-foreground">Keine passenden Konten</p> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

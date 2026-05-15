import { Bell, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export function Topbar() {
  return (
    <header className="mb-6 flex items-center justify-between rounded-2xl border border-border bg-white p-4 shadow-soft">
      <div className="relative w-full max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-9" placeholder="Suchen nach Rechnungen, Kunden, Transaktionen..." />
      </div>
      <div className="ml-4 flex items-center gap-3">
        <button className="rounded-xl border border-border bg-white p-2">
          <Bell size={18} />
        </button>
        <div className="flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm">
          <div className="h-7 w-7 rounded-full bg-primary/15" />
          <span>Marie Keller</span>
        </div>
      </div>
    </header>
  );
}

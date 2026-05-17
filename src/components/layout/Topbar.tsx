import { Bell, Moon, Search, Sun } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useUiStore } from "@/store/uiStore";
import { useAuthStore } from "@/store/authStore";

export function Topbar() {
  const { theme, toggleTheme } = useUiStore();
  const { user, logout } = useAuthStore();
  return (
    <header className="sticky top-4 z-20 mb-6 flex items-center justify-between rounded-2xl border border-border/80 bg-white/90 p-4 shadow-soft backdrop-blur-sm">
      <div className="relative w-full max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-9" placeholder="Suchen nach Rechnungen, Kunden, Transaktionen..." />
      </div>
      <div className="ml-4 flex items-center gap-3">
        <button className="rounded-xl border border-border/90 bg-white p-2.5 hover:bg-muted/60" onClick={toggleTheme} title="Theme wechseln">
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <button className="rounded-xl border border-border/90 bg-white p-2.5 hover:bg-muted/60">
          <Bell size={18} />
        </button>
        <div className="flex items-center gap-2 rounded-xl border border-border/90 bg-white px-3 py-2 text-sm">
          <div className="h-7 w-7 rounded-full bg-primary/15" />
          <span>{user?.name ?? "Benutzer"}</span>
          <button className="ml-2 text-xs text-muted-foreground underline" onClick={() => void logout()} type="button">
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}

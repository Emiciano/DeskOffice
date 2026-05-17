import { BarChart3, Building2, CreditCard, FileText, LayoutDashboard, Package, Receipt, Settings, Users, WalletCards, BookOpenText, Inbox, Bot, ShieldCheck } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const links = [
  { label: "Dashboard", to: "/", icon: LayoutDashboard },
  { label: "Rechnungen", to: "/rechnungen", icon: FileText },
  { label: "Angebote", to: "/angebote", icon: Receipt },
  { label: "Kunden", to: "/kunden", icon: Users },
  { label: "Belege", to: "/belege", icon: CreditCard },
  { label: "Banking", to: "/banking", icon: Building2 },
  { label: "Produkte", to: "/produkte", icon: Package },
  { label: "Kontenrahmen", to: "/kontenrahmen", icon: WalletCards },
  { label: "Buchungen", to: "/buchungen", icon: BookOpenText },
  { label: "Smart Inbox", to: "/inbox", icon: Inbox },
  { label: "AI Copilot", to: "/copilot", icon: Bot },
  { label: "Berichte", to: "/berichte", icon: BarChart3 },
  { label: "Einstellungen", to: "/einstellungen", icon: Settings },
  { label: "Admin", to: "/admin", icon: ShieldCheck },
] as const;

export function Sidebar() {
  const location = useLocation();
  const showDocumentChildren = location.pathname === "/belege";

  return (
    <aside className="fixed left-0 top-0 z-30 h-screen w-64 border-r border-border/80 bg-card p-4 shadow-soft backdrop-blur-sm">
      <div className="mb-6 px-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Emiciano</p>
        <p className="text-lg font-semibold tracking-tight">DeskOffice</p>
      </div>
      <nav className="space-y-1">
        {links.map(({ label, to, icon: Icon }) => (
          <div key={to}>
          <NavLink
            to={to}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-muted-foreground transition",
                isActive ? "bg-muted text-foreground shadow-sm" : "hover:bg-muted/70 hover:text-foreground",
              )
            }
          >
            <Icon size={17} />
            {label}
          </NavLink>
          {showDocumentChildren && to === "/belege" ? (
            <div className="ml-8 mt-1 space-y-1 border-l border-border pl-3">
              <NavLink to="/belege?group=Ausgangsbelege" className="block rounded-lg px-2 py-1 text-xs text-muted-foreground hover:bg-muted/80">Ausgangsbelege</NavLink>
              <NavLink to="/belege?group=Eingangsbelege" className="block rounded-lg px-2 py-1 text-xs text-muted-foreground hover:bg-muted/80">Eingangsbelege</NavLink>
              <NavLink to="/belege?group=Eingangsbelege&subType=Ausgaben" className="block rounded-lg px-2 py-1 text-xs text-muted-foreground hover:bg-muted/80">Ausgaben</NavLink>
              <NavLink to="/belege?group=Eingangsbelege&subType=Ausgabenminderung" className="block rounded-lg px-2 py-1 text-xs text-muted-foreground hover:bg-muted/80">Ausgabenminderung</NavLink>
              <NavLink to="/belege?group=Eingangsbelege&subType=Einnahmen" className="block rounded-lg px-2 py-1 text-xs text-muted-foreground hover:bg-muted/80">Einnahmen</NavLink>
              <NavLink to="/belege?group=Eingangsbelege&subType=Einnahmenminderung" className="block rounded-lg px-2 py-1 text-xs text-muted-foreground hover:bg-muted/80">Einnahmenminderung</NavLink>
            </div>
          ) : null}
          </div>
        ))}
      </nav>
    </aside>
  );
}

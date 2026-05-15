import { BarChart3, Building2, CreditCard, FileText, LayoutDashboard, Package, Receipt, Settings, Users } from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";

const links = [
  ["Dashboard", "/", LayoutDashboard],
  ["Rechnungen", "/rechnungen", FileText],
  ["Angebote", "/angebote", Receipt],
  ["Kunden", "/kunden", Users],
  ["Belege", "/belege", CreditCard],
  ["Banking", "/banking", Building2],
  ["Produkte", "/produkte", Package],
  ["Berichte", "/berichte", BarChart3],
  ["Einstellungen", "/einstellungen", Settings],
] as const;

export function Sidebar() {
  return (
    <aside className="sticky top-6 h-[calc(100vh-3rem)] w-64 rounded-2xl border border-border bg-white p-4 shadow-soft">
      <div className="mb-6 px-2 text-lg font-semibold">Buchhaltung CMS</div>
      <nav className="space-y-1">
        {links.map(([label, to, Icon]) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-muted-foreground transition",
                isActive ? "bg-muted text-foreground" : "hover:bg-muted/80",
              )
            }
          >
            <Icon size={17} />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

import { useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { DashboardPage } from "@/pages/DashboardPage";
import { InvoicesPage } from "@/pages/InvoicesPage";
import { OffersPage } from "@/pages/OffersPage";
import { CustomersPage } from "@/pages/CustomersPage";
import { BankingPage } from "@/pages/BankingPage";
import { ProductsPage } from "@/pages/ProductsPage";
import { ReportsPage } from "@/pages/ReportsPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { BookingsPage } from "@/pages/BookingsPage";
import { DocumentsPage } from "@/features/documents/DocumentsPage";
import { AccountsPage } from "@/features/accounting/pages/AccountsPage";
import { useUiStore } from "@/store/uiStore";

export default function App() {
  const { theme } = useUiStore();
  const location = useLocation();

  useEffect(() => {
    document.documentElement.classList.toggle("theme-dark", theme === "dark");
  }, [theme]);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="flex w-full gap-6">
        <Sidebar />
        <main className="min-w-0 flex-1">
          <Topbar />
          <div key={location.pathname} className="page-enter">
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/rechnungen" element={<InvoicesPage />} />
              <Route path="/angebote" element={<OffersPage />} />
              <Route path="/kunden" element={<CustomersPage />} />
              <Route path="/belege" element={<DocumentsPage />} />
              <Route path="/banking" element={<BankingPage />} />
              <Route path="/produkte" element={<ProductsPage />} />
              <Route path="/kontenrahmen" element={<AccountsPage />} />
              <Route path="/buchungen" element={<BookingsPage />} />
              <Route path="/berichte" element={<ReportsPage />} />
              <Route path="/einstellungen" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
}

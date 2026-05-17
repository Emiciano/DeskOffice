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
import { AdminPage } from "@/pages/AdminPage";
import { BookingsPage } from "@/pages/BookingsPage";
import { SmartInboxPage } from "@/pages/SmartInboxPage";
import { AICopilotPage } from "@/pages/AICopilotPage";
import { DocumentsPage } from "@/features/documents/DocumentsPage";
import { AccountsPage } from "@/features/accounting/pages/AccountsPage";
import { useUiStore } from "@/store/uiStore";
import { useAuthStore } from "@/store/authStore";
import { LoginPage } from "@/pages/LoginPage";

export default function App() {
  const { theme } = useUiStore();
  const { user, loading, init } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    document.documentElement.classList.toggle("theme-dark", theme === "dark");
  }, [theme]);

  useEffect(() => {
    void init();
  }, [init]);

  if (loading) {
    return <div className="min-h-screen bg-background p-6 text-sm text-muted-foreground">Lade Benutzer...</div>;
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen w-screen overflow-x-hidden bg-background">
      <Sidebar />
      <main className="ml-64 min-w-0 p-4 lg:p-5">
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
            <Route path="/inbox" element={<SmartInboxPage />} />
            <Route path="/copilot" element={<AICopilotPage />} />
            <Route path="/berichte" element={<ReportsPage />} />
            <Route path="/einstellungen" element={<SettingsPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

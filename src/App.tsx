import { Suspense, lazy, useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { useUiStore } from "@/store/uiStore";
import { useAuthStore } from "@/store/authStore";

const DashboardPage = lazy(() => import("@/pages/DashboardPage").then((m) => ({ default: m.DashboardPage })));
const InvoicesPage = lazy(() => import("@/pages/InvoicesPage").then((m) => ({ default: m.InvoicesPage })));
const OffersPage = lazy(() => import("@/pages/OffersPage").then((m) => ({ default: m.OffersPage })));
const CustomersPage = lazy(() => import("@/pages/CustomersPage").then((m) => ({ default: m.CustomersPage })));
const BankingPage = lazy(() => import("@/pages/BankingPage").then((m) => ({ default: m.BankingPage })));
const ProductsPage = lazy(() => import("@/pages/ProductsPage").then((m) => ({ default: m.ProductsPage })));
const ReportsPage = lazy(() => import("@/pages/ReportsPage").then((m) => ({ default: m.ReportsPage })));
const SettingsPage = lazy(() => import("@/pages/SettingsPage").then((m) => ({ default: m.SettingsPage })));
const AdminPage = lazy(() => import("@/pages/AdminPage").then((m) => ({ default: m.AdminPage })));
const BookingsPage = lazy(() => import("@/pages/BookingsPage").then((m) => ({ default: m.BookingsPage })));
const SmartInboxPage = lazy(() => import("@/pages/SmartInboxPage").then((m) => ({ default: m.SmartInboxPage })));
const AICopilotPage = lazy(() => import("@/pages/AICopilotPage").then((m) => ({ default: m.AICopilotPage })));
const DocumentsPage = lazy(() => import("@/features/documents/DocumentsPage").then((m) => ({ default: m.DocumentsPage })));
const AccountsPage = lazy(() => import("@/features/accounting/pages/AccountsPage").then((m) => ({ default: m.AccountsPage })));
const LoginPage = lazy(() => import("@/pages/LoginPage").then((m) => ({ default: m.LoginPage })));

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
    return (
      <Suspense fallback={<div className="min-h-screen bg-background p-6 text-sm text-muted-foreground">Lade Login...</div>}>
        <LoginPage />
      </Suspense>
    );
  }

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-background">
      <Sidebar />
      <main className="ml-64 min-h-screen w-[calc(100vw-16rem)] min-w-0 max-w-none p-4 lg:p-5">
        <Topbar />
        <div key={location.pathname} className="page-enter">
          <Suspense fallback={<div className="rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">Seite wird geladen...</div>}>
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
          </Suspense>
        </div>
      </main>
    </div>
  );
}

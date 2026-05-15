import { Navigate, Route, Routes } from "react-router-dom";
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
import { DocumentsPage } from "@/features/documents/DocumentsPage";

export default function App() {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="flex w-full gap-6">
        <Sidebar />
        <main className="min-w-0 flex-1">
          <Topbar />
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/rechnungen" element={<InvoicesPage />} />
            <Route path="/angebote" element={<OffersPage />} />
            <Route path="/kunden" element={<CustomersPage />} />
            <Route path="/belege" element={<DocumentsPage />} />
            <Route path="/banking" element={<BankingPage />} />
            <Route path="/produkte" element={<ProductsPage />} />
            <Route path="/berichte" element={<ReportsPage />} />
            <Route path="/einstellungen" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { invoices as seedInvoices, offers as seedOffers } from "@/data/seedData";
import type { InvoiceStatus } from "@/data/seedData";

type Invoice = (typeof seedInvoices)[number];
type Offer = (typeof seedOffers)[number];

type AppState = {
  invoices: Invoice[];
  offers: Offer[];
  addInvoice: (invoice: Omit<Invoice, "id">) => void;
  convertOffer: (offerId: string) => void;
  updateInvoiceStatus: (id: string, status: InvoiceStatus) => void;
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      invoices: seedInvoices,
      offers: seedOffers,
      addInvoice: (invoice) =>
        set((state) => ({
          invoices: [
            {
              id: `RE-2026-${100 + state.invoices.length + 1}`,
              ...invoice,
            },
            ...state.invoices,
          ],
        })),
      convertOffer: (offerId) => {
        const offer = get().offers.find((o) => o.id === offerId);
        if (!offer) return;
        set((state) => ({
          invoices: [
            {
              id: `RE-2026-${100 + state.invoices.length + 1}`,
              customer: offer.customer,
              amount: offer.amount,
              dueDate: "2026-05-31",
              status: "Offen",
            },
            ...state.invoices,
          ],
        }));
      },
      updateInvoiceStatus: (id, status) =>
        set((state) => ({
          invoices: state.invoices.map((inv) => (inv.id === id ? { ...inv, status } : inv)),
        })),
    }),
    { name: "buchhaltung-cms-store" },
  ),
);

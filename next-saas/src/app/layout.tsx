import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DeskOffice SaaS",
  description: "Production-ready Buchhaltungsplattform"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}

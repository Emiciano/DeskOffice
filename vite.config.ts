import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  preview: {
    host: "127.0.0.1",
    port: 3050,
    allowedHosts: [
      "portfolio.allseasonsproduction.de",
      "www.portfolio.allseasonsproduction.de",
      "lunaoffice.de",
      "www.lunaoffice.de",
    ],
  },
});

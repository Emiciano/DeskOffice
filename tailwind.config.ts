import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        border: "hsl(240 10% 90%)",
        background: "hsl(240 18% 98%)",
        foreground: "hsl(227 20% 17%)",
        primary: {
          DEFAULT: "hsl(244 83% 63%)",
          foreground: "hsl(0 0% 100%)",
        },
        muted: {
          DEFAULT: "hsl(240 16% 95%)",
          foreground: "hsl(230 11% 45%)",
        },
      },
      boxShadow: {
        soft: "0 10px 30px rgba(26, 31, 68, 0.08)",
      },
      borderRadius: {
        xl2: "1rem",
      },
    },
  },
  plugins: [],
} satisfies Config;

import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Base surfaces
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Custom dark palette
        dark: {
          50:  "#f0fdf4",
          100: "#1a1a2e",
          200: "#16213e",
          300: "#0f3460",
          400: "#111827",
          500: "#1f2937",
          600: "#374151",
          700: "#4b5563",
          800: "#6b7280",
          900: "#9ca3af",
        },
        // Brand accent — green
        brand: {
          50:  "#f0fdf4",
          100: "#dcfce7",
          200: "#bbf7d0",
          300: "#86efac",
          400: "#4ade80",
          500: "#22c55e",
          600: "#16a34a",
          700: "#15803d",
          800: "#166534",
          900: "#14532d",
        },
        // Macro colours
        protein: "#3b82f6",   // blue
        carbs:   "#f59e0b",   // amber
        fat:     "#f97316",   // orange
        fiber:   "#a78bfa",   // violet
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl2: "1rem",
        xl3: "1.5rem",
      },
      boxShadow: {
        card: "0 4px 24px 0 rgba(0,0,0,0.4)",
        glow: "0 0 20px rgba(34,197,94,0.25)",
      },
    },
  },
  plugins: [],
};
export default config;

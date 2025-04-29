/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./sidepanel.tsx",
    "./background/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./assets/**/*.{ts,tsx}",
    "./public/**/*.html"
  ],
  theme: {
    extend: {
      minWidth: {
        custom: "400px" // Add a custom min-width value
      },
      maxWidth: {
        custom: "400px" // Add a custom max-width value
      },
      colors: {
        primary: {
          50: "#e6eef4",
          100: "#ccdde9",
          200: "#99bbcf",
          300: "#6699b4",
          400: "#33779a",
          500: "#00557f", // Lighter version
          600: "#004466", // Base color close to your image
          700: "#00334d",
          800: "#002233",
          900: "#00111a",
          950: "#000d14"
        },
        secondary: {
          50: "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          300: "#cbd5e1",
          400: "#94a3b8",
          500: "#64748b",
          600: "#475569",
          700: "#334155",
          800: "#1e293b",
          900: "#0f172a",
          950: "#020617"
        },
        success: {
          light: "#4ade80",
          DEFAULT: "#22c55e",
          dark: "#16a34a"
        },
        error: {
          light: "#f87171",
          DEFAULT: "#ef4444",
          dark: "#dc2626"
        }
      }
    }
  },
  plugins: []
}

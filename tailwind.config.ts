import type { Config } from "tailwindcss";

/**
 * Lumina — Aura Health System
 * Design tokens estratti dai mockup Stitch (DESIGN.md).
 *
 * - Palette principale: nautical-inspired (Cerulean / Navy).
 * - Accent `violet`: riservato esclusivamente al Copilot AI per
 *   distinguerlo visivamente come "human-in-the-loop intelligence".
 * - Tipografia: Manrope per headlines/dati biometrici, Inter per body.
 */
const config: Config = {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Surface tiers
        surface: "#f5faff",
        "surface-dim": "#b8dffb",
        "surface-bright": "#f5faff",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#eaf5ff",
        "surface-container": "#def0ff",
        "surface-container-high": "#d2ecff",
        "surface-container-highest": "#c5e7ff",
        "surface-variant": "#c5e7ff",
        "surface-tint": "#0a6397",
        "on-surface": "#001e2d",
        "on-surface-variant": "#40474f",
        "inverse-surface": "#04344a",
        "inverse-on-surface": "#e4f3ff",

        // Outline
        outline: "#717880",
        "outline-variant": "#c0c7d0",

        // Primary (Deep Cerulean)
        primary: "#005685",
        "on-primary": "#ffffff",
        "primary-container": "#226fa3",
        "on-primary-container": "#ddedff",
        "inverse-primary": "#93ccff",
        "primary-fixed": "#cde5ff",
        "primary-fixed-dim": "#93ccff",
        "on-primary-fixed": "#001d32",
        "on-primary-fixed-variant": "#004b74",

        // Secondary (Midnight Navy)
        secondary: "#3b6284",
        "on-secondary": "#ffffff",
        "secondary-container": "#afd5fd",
        "on-secondary-container": "#375d7f",
        "secondary-fixed": "#cee5ff",
        "secondary-fixed-dim": "#a4caf1",
        "on-secondary-fixed": "#001d33",
        "on-secondary-fixed-variant": "#214a6b",

        // Tertiary (Deep Atlantic)
        tertiary: "#2e5576",
        "on-tertiary": "#ffffff",
        "tertiary-container": "#476d90",
        "on-tertiary-container": "#ddecff",
        "tertiary-fixed": "#cee5ff",
        "tertiary-fixed-dim": "#a4caf1",
        "on-tertiary-fixed": "#001d33",
        "on-tertiary-fixed-variant": "#214a6b",

        // Error
        error: "#ba1a1a",
        "on-error": "#ffffff",
        "error-container": "#ffdad6",
        "on-error-container": "#93000a",

        // Background
        background: "#f5faff",
        "on-background": "#001e2d",

        // Copilot AI accent — usato SOLO per identificare l'AI
        violet: {
          50: "#f5f3ff",
          100: "#ede9fe",
          200: "#ddd6fe",
          500: "#8b5cf6",
          600: "#7c3aed",
        },
      },
      borderRadius: {
        sm: "0.5rem",
        DEFAULT: "1rem",
        md: "1.5rem",
        lg: "2rem",
        xl: "3rem",
        full: "9999px",
      },
      spacing: {
        unit: "4px",
        "margin-mobile": "20px",
        gutter: "12px",
        "container-padding": "24px",
      },
      fontFamily: {
        "body-md": ["Inter", "system-ui", "sans-serif"],
        "label-sm": ["Inter", "system-ui", "sans-serif"],
        "display-xl": ["Manrope", "system-ui", "sans-serif"],
        "headline-lg": ["Manrope", "system-ui", "sans-serif"],
        "stat-lg": ["Manrope", "system-ui", "sans-serif"],
      },
      fontSize: {
        "label-sm": [
          "12px",
          { lineHeight: "16px", letterSpacing: "0.05em", fontWeight: "600" },
        ],
        "body-md": [
          "16px",
          { lineHeight: "24px", letterSpacing: "0em", fontWeight: "400" },
        ],
        "headline-lg": [
          "24px",
          { lineHeight: "32px", letterSpacing: "-0.01em", fontWeight: "600" },
        ],
        "stat-lg": [
          "32px",
          { lineHeight: "40px", letterSpacing: "-0.01em", fontWeight: "500" },
        ],
        "display-xl": [
          "40px",
          { lineHeight: "48px", letterSpacing: "-0.02em", fontWeight: "700" },
        ],
      },
      backdropBlur: {
        "20": "20px",
        "40": "40px",
        "60": "60px",
      },
      boxShadow: {
        // "Ambient" shadows — diffused, low-opacity (vedi DESIGN.md §Elevation)
        ambient:
          "0 10px 30px rgba(4,53,85,0.03), 0 4px 12px rgba(80,118,142,0.04)",
        "ambient-lg":
          "0 20px 60px rgba(4,53,85,0.05), 0 8px 24px rgba(80,118,142,0.06)",
        "nav-up": "0 -8px 30px rgba(80,118,142,0.08)",
      },
    },
  },
  plugins: [],
};

export default config;

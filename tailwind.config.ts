import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Manrope", "Inter", "system-ui", "sans-serif"],
      },
      // Sub-`xs` font tokens for compact UI (badges, labels, table micro-text).
      // Closes audit finding B3 — replaces ad-hoc `text-[Npx]` arbitrary
      // values with semantic tokens that respond to design-system updates.
      //   text-2xs → 11px  (audit B3: replaces `text-[11px]`)
      //   text-3xs → 10px  (audit B3: replaces `text-[10px]`)
      //   text-4xs → 9px   (audit B3: replaces `text-[9px]`)
      //   text-5xs → 8px   (audit B3: replaces `text-[8px]`)
      fontSize: {
        "2xs": ["0.6875rem", { lineHeight: "1rem" }],
        "3xs": ["0.625rem", { lineHeight: "0.875rem" }],
        "4xs": ["0.5625rem", { lineHeight: "0.75rem" }],
        "5xs": ["0.5rem", { lineHeight: "0.75rem" }],
      },
      colors: {
        /* Athlete brand palette — namespaced to avoid colliding with Coach semantic tokens */
        brand: {
          DEFAULT: "#005685",
          container: "#226fa3",
          foreground: "#ffffff",
        },
        surface: {
          DEFAULT: "#f5faff",
          variant: "#c5e7ff",
          container: "#def0ff",
        },
        "on-surface": {
          DEFAULT: "#001e2d",
          variant: "#40474f",
        },
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        warning: {
          DEFAULT: "var(--warning)",
          foreground: "var(--warning-foreground)",
        },
        success: {
          DEFAULT: "var(--success)",
          foreground: "var(--success-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        sidebar: {
          DEFAULT: "var(--sidebar-background)",
          foreground: "var(--sidebar-foreground)",
          primary: "var(--sidebar-primary)",
          "primary-foreground": "var(--sidebar-primary-foreground)",
          accent: "var(--sidebar-accent)",
          "accent-foreground": "var(--sidebar-accent-foreground)",
          border: "var(--sidebar-border)",
          ring: "var(--sidebar-ring)",
        },
        /* Aura Health System — Material 3 inspired surface roles.
           These map 1:1 to the CSS vars defined in `src/index.css`
           so components can reach them via `bg-surface-container`,
           `border-outline-variant`, `text-on-surface-variant`, etc.
           Note: `bg-surface` (no suffix) is NOT mapped here because the
           legacy athlete namespace `surface.{DEFAULT,variant,container}`
           above would conflict. Use `bg-background` for the base Aura
           surface — they're CSS-var-identical (`--background`). */
        outline: {
          DEFAULT: "var(--outline)",
          variant: "var(--outline-variant)",
        },
        "on-surface-variant": "var(--on-surface-variant)",
        "surface-container-lowest": "var(--surface-container-lowest)",
        "surface-container-low": "var(--surface-container-low)",
        "surface-container": "var(--surface-container)",
        "surface-container-high": "var(--surface-container-high)",
        "surface-container-highest": "var(--surface-container-highest)",
        "primary-container": "var(--primary-container)",
        "on-primary-container": "var(--on-primary-container)",
        "inverse-surface": "var(--inverse-surface)",
        "inverse-on-surface": "var(--inverse-on-surface)",
        "inverse-primary": "var(--inverse-primary)",
      },
      borderRadius: {
        /* Aura shape language — ultra-rounded / organic. The DEFAULT
           is 1rem (16px) per DESIGN.md; aliased so `rounded-lg`/`md`
           remain the legacy mid-step values, and the new `2xl`/`3xl`
           expose the 24px and 32px card targets directly. */
        sm: "calc(var(--radius) - 0.5rem)" /* 0.5rem */,
        md: "var(--radius)" /* 1rem */,
        lg: "calc(var(--radius) + 0.5rem)" /* 1.5rem — Form inputs */,
        xl: "calc(var(--radius) + 1rem)" /* 2rem */,
        "2xl": "calc(var(--radius) + 0.5rem)" /* 24px — Cards lower bound */,
        "3xl": "calc(var(--radius) + 1rem)" /* 32px — Cards upper bound */,
      },
      boxShadow: {
        /* Aura ambient shadow — wide and soft, gives the "float" effect
           described in DESIGN.md without harsh drop. Cards get `aura`,
           inputs use `aura-focus` on focus. */
        aura: "0 8px 30px rgba(0, 0, 0, 0.04)",
        "aura-hover": "0 12px 40px rgba(0, 0, 0, 0.06)",
        "aura-focus": "0 0 0 4px hsl(204 100% 26% / 0.12)",
      },
      backdropBlur: {
        aura: "20px",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-right": {
          from: { transform: "translateX(100%)" },
          to: { transform: "translateX(0)" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
        "scan-line": {
          "0%": { top: "0%", opacity: "0.2" },
          "50%": { top: "100%", opacity: "1" },
          "100%": { top: "0%", opacity: "0.2" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "slide-in-right": "slide-in-right 0.3s ease-out",
        "pulse-soft": "pulse-soft 2s ease-in-out infinite",
        "scan-line": "scan-line 2s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;

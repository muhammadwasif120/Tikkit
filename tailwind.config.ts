import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          // Use RGB CSS vars so Tailwind opacity modifiers work (bg-brand-blue/10 etc.)
          // Repointed at the cyan accent — see globals.css design tokens.
          blue: "rgb(var(--brand-blue-rgb) / <alpha-value>)",
          "blue-dark": "rgb(var(--brand-blue-dark-rgb) / <alpha-value>)",
          "blue-light": "rgb(var(--brand-blue-light-rgb) / <alpha-value>)",
          // CSS vars for surface colors (no opacity modifier needed)
          charcoal: "var(--brand-charcoal)",
          "charcoal-light": "var(--brand-charcoal-light)",
          muted: "#6B7280",
        },
        // Navy Glass palette — see globals.css for the CSS custom properties
        // these mirror. Use these when a component needs a fixed value that
        // shouldn't shift between light/dark (rare); prefer the CSS vars
        // (bg-brand-blue, var(--text-primary) etc.) for anything themed.
        navy:    { 950: "#060B22", 900: "#0B1437", 800: "#132057", 700: "#1D2E78", 600: "#2B40A0" },
        cyan:    { 300: "#80F3FF", 400: "#33EBFF", 500: "#00E5FF", 600: "#00B8CC" },
        magenta: { 400: "#E066FF", 500: "#CC00FF" },
        sky:     { 400: "#A3C0FF", 500: "#7FA7FF" },
        mint:    { 500: "#3DD68C" },
        coral:   { 500: "#FF6B6B" },
        mist:    { 300: "#C3CAE0", 400: "#8C97B8", 500: "#66708F" },
      },
      fontFamily: {
        display: ["var(--font-sora)", "sans-serif"],
        body: ["var(--font-dm-sans)", "sans-serif"],
      },
      borderRadius: {
        panel: "18px",
        hero: "28px",
      },
      backgroundImage: {
        "grid-pattern": "linear-gradient(rgba(30,94,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(30,94,255,0.05) 1px, transparent 1px)",
      },
      backgroundSize: {
        "grid": "40px 40px",
      },
      animation: {
        "fade-in": "fadeIn 0.4s ease forwards",
        "slide-up": "slideUp 0.4s ease forwards",
        "pulse-dot": "pulseDot 2s infinite",
      },
      keyframes: {
        fadeIn: { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        slideUp: { "0%": { opacity: "0", transform: "translateY(16px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        pulseDot: { "0%, 100%": { opacity: "1", transform: "scale(1)" }, "50%": { opacity: "0.5", transform: "scale(0.85)" } },
      }
    },
  },
  plugins: [],
};

export default config;
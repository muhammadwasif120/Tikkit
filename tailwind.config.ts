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
          blue: "rgb(var(--brand-blue-rgb) / <alpha-value>)",
          "blue-dark": "rgb(var(--brand-blue-dark-rgb) / <alpha-value>)",
          "blue-light": "rgb(var(--brand-blue-light-rgb) / <alpha-value>)",
          gold: "#FFC745",
          "gold-dark": "#E5A800",
          // CSS vars for surface colors (no opacity modifier needed)
          charcoal: "var(--brand-charcoal)",
          "charcoal-light": "var(--brand-charcoal-light)",
          muted: "#6B7280",
        }
      },
      fontFamily: {
        display: ["var(--font-syne)", "sans-serif"],
        body: ["var(--font-dm-sans)", "sans-serif"],
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
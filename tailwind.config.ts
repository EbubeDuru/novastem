import type { Config } from "tailwindcss";

// Design tokens — see DESIGN.md for rationale.
// Theme: "night sky / stellar discovery" — dark space as canvas,
// opportunities as stars, match quality as luminosity/warmth.
const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Base canvas — not pure black, a deep space navy so glass panels
        // have somewhere to catch light.
        void: {
          950: "#06070C",
          900: "#0A0D16",
          800: "#11141F",
          700: "#181C2B",
          600: "#242938",
        },
        // Signature accent — "Nova gold": a warm stellar glow, distinct
        // from the generic violet/indigo SaaS default. Used sparingly.
        nova: {
          400: "#FFD98E",
          500: "#F5B942",
          600: "#D89A2A",
        },
        // Secondary accent for interactive/AI elements — a cool aurora teal.
        aurora: {
          400: "#7DE8D8",
          500: "#3FCFB8",
          600: "#22A794",
        },
        // Semantic — eligibility states map directly to these.
        eligible: "#3FCFB8",
        almost: "#F5B942",
        ineligible: "#E8607A",
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        sans: ["var(--font-sans)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      backdropBlur: {
        xs: "2px",
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
      },
      boxShadow: {
        glow: "0 0 40px -10px rgba(245, 185, 66, 0.35)",
        "glow-aurora": "0 0 40px -10px rgba(63, 207, 184, 0.35)",
      },
      keyframes: {
        twinkle: {
          "0%, 100%": { opacity: "0.3" },
          "50%": { opacity: "1" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        twinkle: "twinkle 3s ease-in-out infinite",
        "fade-up": "fade-up 0.4s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;

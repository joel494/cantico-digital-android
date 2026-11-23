/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {
      colors: {
        border: "oklch(88% 0.02 80 / <alpha-value>)",
        input: "oklch(88% 0.02 80 / <alpha-value>)",
        ring: "oklch(62% 0.12 62 / <alpha-value>)",
        background: "oklch(97.6% 0.012 85 / <alpha-value>)",
        foreground: "oklch(24% 0.03 45 / <alpha-value>)",
        card: {
          DEFAULT: "oklch(99.2% 0.008 85 / <alpha-value>)",
          foreground: "oklch(24% 0.03 45 / <alpha-value>)",
        },
        primary: {
          DEFAULT: "oklch(34% 0.07 255 / <alpha-value>)",
          foreground: "oklch(98% 0.01 85 / <alpha-value>)",
        },
        secondary: {
          DEFAULT: "oklch(93% 0.02 85 / <alpha-value>)",
          foreground: "oklch(28% 0.04 45 / <alpha-value>)",
        },
        muted: {
          DEFAULT: "oklch(94% 0.015 85 / <alpha-value>)",
          foreground: "oklch(50% 0.03 60 / <alpha-value>)",
        },
        accent: {
          DEFAULT: "oklch(62% 0.12 62 / <alpha-value>)",
          foreground: "oklch(98% 0.01 85 / <alpha-value>)",
        },
        biblia: {
          DEFAULT: "oklch(44% 0.09 196 / <alpha-value>)",
          foreground: "oklch(98% 0.01 196 / <alpha-value>)",
          suave: "oklch(96% 0.02 196 / <alpha-value>)",
        },
        destructive: {
          DEFAULT: "oklch(57.7% 0.245 27.325 / <alpha-value>)",
          foreground: "oklch(98.4% 0.003 247.858 / <alpha-value>)",
        },
        proyeccion: {
          cantico: "oklch(16% 0.03 255 / <alpha-value>)",
          biblia: "oklch(17% 0.05 196 / <alpha-value>)",
          texto: "oklch(97% 0.01 85 / <alpha-value>)",
          acento: "oklch(78% 0.13 62 / <alpha-value>)",
          "biblia-acento": "oklch(80% 0.11 196 / <alpha-value>)",
        },
      },
      borderRadius: {
        DEFAULT: "0.5rem",
      },
      fontFamily: {
        display: ["Cormorant Garamond", "Georgia", "serif"],
        body: ["Karla", "system-ui", "sans-serif"],
        sans: ["Karla", "system-ui", "sans-serif"],
        calibri: ["Calibri", "Carlito", "Segoe UI", "sans-serif"],
      },
    },
  },
  plugins: [],
};

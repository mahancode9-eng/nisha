import type { Config } from "tailwindcss";

const withOpacity = (variable: string) => `rgb(var(${variable}) / <alpha-value>)`;

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: withOpacity("--color-background"),
        foreground: withOpacity("--color-foreground"),
        surface: withOpacity("--color-surface"),
        "surface-muted": withOpacity("--color-surface-muted"),
        border: withOpacity("--color-border"),
        brand: {
          DEFAULT: withOpacity("--color-brand"),
          foreground: withOpacity("--color-brand-foreground"),
          soft: withOpacity("--color-brand-soft"),
          deep: withOpacity("--color-brand-deep"),
        },
        accent: withOpacity("--color-accent"),
        "accent-foreground": withOpacity("--color-accent-foreground"),
      },
    },
  },
  plugins: [],
};

export default config;

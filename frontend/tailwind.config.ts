import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "bg-primary": "#0f1014",
        "bg-secondary": "#15171c",
        "bg-tertiary": "#17191f",
        "bg-input": "#111318",
        "border-default": "#2a2d34",
        "border-hover": "#3a3d44",
        "brand-primary": "#2563eb",
        "brand-primary-hover": "#3b82f6",
        "status-success": "#22c55e",
        "status-warning": "#facc15",
        "status-error": "#ef4444",
        "text-primary": "#e5e7eb",
        "text-secondary": "#9ca3af",
        "text-muted": "#8b949e",
      },
      fontFamily: {
        inter: ["Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        "md": "8px",
        "lg": "12px",
        "xl": "16px",
        "2xl": "20px",
      },
    },
  },
  plugins: [],
};

export default config;

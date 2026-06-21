import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        pine: {
          50: "#f1f6f3",
          100: "#dceae0",
          200: "#bad5c4",
          300: "#8fb8a0",
          400: "#60957a",
          500: "#427860",
          600: "#2f604c",
          700: "#264d3e",
          800: "#203e33",
          900: "#1b332b",
        },
        bark: {
          500: "#7a5c3e",
          600: "#5f472f",
          700: "#4a3724",
        },
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "Helvetica", "Arial", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;

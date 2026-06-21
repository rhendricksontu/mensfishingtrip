import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Blue/white palette drawn from crossings.church's button ribbon
        // (primary #337ab7, light #cde1f1, navy #142f46).
        brand: {
          50: "#f5f9fc",
          100: "#e1edf7",
          200: "#cde1f1",
          300: "#92bce0",
          400: "#5697d0",
          500: "#337ab7",
          600: "#2a6396",
          700: "#245682",
          800: "#1b3f60",
          900: "#142f46",
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

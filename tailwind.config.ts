import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Palette sampled from the trip logo:
        // navy #24343f · olive #5f644b · cream #f9f6f1
        cream: {
          DEFAULT: "#f9f6f1",
          100: "#f2eee4",
          200: "#e7e1d3",
        },
        // Primary (navy) — text, nav, buttons
        brand: {
          50: "#f3f5f7",
          100: "#e3e8ed",
          200: "#c4ccd6",
          300: "#97a4b3",
          400: "#5f7185",
          500: "#3a4d62",
          600: "#2c3e52",
          700: "#263545",
          800: "#202d3a",
          900: "#1a2430",
        },
        // Accent (olive green)
        olive: {
          50: "#f2f4ea",
          100: "#e2e6d1",
          200: "#c7cdaa",
          300: "#a6ae7c",
          400: "#838c54",
          500: "#666f3e",
          600: "#525a31",
          700: "#414728",
          800: "#353a23",
          900: "#2c301d",
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

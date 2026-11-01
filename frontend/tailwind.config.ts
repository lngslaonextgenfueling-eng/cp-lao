import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: { 50: "#eef4ff", 100: "#dbe7ff", 500: "#2f6bff", 600: "#1f55e0", 700: "#1a44b3" },
      },
      fontFamily: { sans: ['"Noto Sans Lao"', "system-ui", "sans-serif"] },
    },
  },
  plugins: [],
};
export default config;

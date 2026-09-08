import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: "#152039",
          pink: "#d6155a",
        },
      },
    },
  },
  plugins: [],
};

export default config;

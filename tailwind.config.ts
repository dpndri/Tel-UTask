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
        telu: {
          red: "#B6252A",
          dark: "#8E1B20",
          light: "#FDF2F2",
        },
      },
    },
  },
  plugins: [],
};
export default config;

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
        background: "#0b0e14",
        surface: "#111722",
        "surface-border": "#1f293d",
        accent: {
          cyan: "#00f0ff",
          green: "#00ff88",
          red: "#ff3366",
          yellow: "#ffd000",
          purple: "#9d4edd"
        }
      },
      fontFamily: {
        mono: ["JetBrains Mono", "Fira Code", "Courier New", "monospace"],
      }
    },
  },
  plugins: [],
};
export default config;

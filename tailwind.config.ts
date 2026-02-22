import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts}",
  ],
  theme: {
    extend: {
      colors: {
        siteblack: "#131519",
        siteDimBlack: "#191d23",
        siteViolet: "#7f46f0",
        siteWhite: "#9eacc7",
        vault: "#0d0d10",
        arena: "#2a2a32",
        accent: "#7f46f0",
        "accent-dim": "#6b3bd4",
        danger: "#ff3366",
      },
      fontFamily: {
        rajdhani: ["Rajdhani", "sans-serif"],
        mono: ["JetBrains Mono", "SF Mono", "Fira Code", "monospace"],
      },
      backgroundImage: {
        landing: "url('/assets/background/landing.jpg')",
        heroImg: "url('/assets/background/hero-img.jpg')",
        astral: "url('/assets/background/astral.jpg')",
        saiman: "url('/assets/background/saiman.jpg')",
        eoaalien: "url('/assets/background/eoaalien.jpg')",
        panight: "url('/assets/background/panight.jpg')",
      },
    },
  },
  plugins: [],
};

export default config;

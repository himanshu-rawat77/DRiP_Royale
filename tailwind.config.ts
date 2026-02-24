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
      keyframes: {
        glowPulse: {
          "0%, 100%": { opacity: "0.4", filter: "blur(18px)" },
          "50%": { opacity: "0.9", filter: "blur(26px)" },
        },
        borderGlow: {
          "0%": { "border-color": "rgba(127, 70, 240, 0.3)" },
          "50%": { "border-color": "rgba(127, 70, 240, 0.9)" },
          "100%": { "border-color": "rgba(127, 70, 240, 0.3)" },
        },
        bgDrift: {
          "0%": { transform: "translate3d(0px, 0px, 0px) scale(1.05)" },
          "50%": { transform: "translate3d(-12px, -8px, 0px) scale(1.08)" },
          "100%": { transform: "translate3d(0px, 0px, 0px) scale(1.05)" },
        },
        particleFloat: {
          "0%": { transform: "translateY(0px)", opacity: "0" },
          "20%": { opacity: "0.8" },
          "80%": { opacity: "0.8" },
          "100%": { transform: "translateY(-40px)", opacity: "0" },
        },
      },
      animation: {
        "glow-pulse": "glowPulse 4s ease-in-out infinite",
        "border-glow": "borderGlow 2.4s ease-in-out infinite",
        "bg-drift": "bgDrift 30s ease-in-out infinite",
        "particle-float": "particleFloat 6s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;

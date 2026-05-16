/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx}", "./components/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0B1020",
        surface: "#131A2E",
        card: "#0F1628",
        primary: { DEFAULT: "#00FF88", hover: "#00E07A" },
        accent: { blue: "#3B82F6", purple: "#7C3AED" },
        ink: { 100: "#F8FAFC", 300: "#94A3B8", 500: "#64748B" },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      fontSize: {
        h1: ["56px", { lineHeight: "1.05", fontWeight: "700", letterSpacing: "-0.02em" }],
        h2: ["36px", { lineHeight: "1.15", fontWeight: "600", letterSpacing: "-0.01em" }],
        h3: ["24px", { lineHeight: "1.3", fontWeight: "600" }],
      },
      borderRadius: { "2xl": "1rem", "3xl": "1.5rem" },
      boxShadow: {
        glow: "0 0 0 1px rgba(0,255,136,0.25), 0 10px 40px -10px rgba(0,255,136,0.45)",
        "glow-sm": "0 0 0 1px rgba(0,255,136,0.2), 0 6px 22px -8px rgba(0,255,136,0.4)",
        card: "0 1px 0 rgba(255,255,255,0.04) inset, 0 10px 30px -15px rgba(0,0,0,0.6)",
      },
      backgroundImage: {
        "grid-fade":
          "radial-gradient(ellipse at top, rgba(0,255,136,0.08), transparent 60%)",
      },
      keyframes: {
        "pulse-glow": {
          "0%,100%": { opacity: "0.55", filter: "blur(14px)" },
          "50%": { opacity: "1", filter: "blur(18px)" },
        },
        "dash": { to: { strokeDashoffset: "-24" } },
        "float-in": {
          "0%": { opacity: "0", transform: "translateY(8px) scale(.98)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
      },
      animation: {
        "pulse-glow": "pulse-glow 3s ease-in-out infinite",
        "dash": "dash 0.6s linear infinite",
        "float-in": "float-in .4s cubic-bezier(.16,1,.3,1) both",
      },
    },
  },
  plugins: [],
};

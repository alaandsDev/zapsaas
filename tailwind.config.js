/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx}", "./components/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0B0F14",
        surface: "#111827",
        card: "#0F172A",
        primary: { DEFAULT: "#00FFB2", hover: "#00DFA2" },
        accent: { blue: "#3B82F6", purple: "#8B5CF6" },
        ink: { 100: "#E5E7EB", 300: "#9CA3AF", 500: "#6B7280" },
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
        glow: "0 0 0 1px rgba(0,255,178,0.25), 0 10px 40px -10px rgba(0,255,178,0.45)",
        card: "0 1px 0 rgba(255,255,255,0.04) inset, 0 10px 30px -15px rgba(0,0,0,0.6)",
      },
      backgroundImage: {
        "grid-fade":
          "radial-gradient(ellipse at top, rgba(0,255,178,0.08), transparent 60%)",
      },
    },
  },
  plugins: [],
};

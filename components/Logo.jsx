export default function Logo({ size = 28 }) {
  return (
    <div className="flex items-center gap-2.5">
      <div
        className="rounded-xl flex items-center justify-center font-bold text-bg"
        style={{
          width: size,
          height: size,
          background: "linear-gradient(135deg, #00FFB2 0%, #00DFA2 100%)",
          boxShadow: "0 4px 14px -4px rgba(0,255,178,0.55)",
        }}
      >
        <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 24 24" fill="none">
          <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" fill="currentColor" />
        </svg>
      </div>
      <span className="font-bold text-lg tracking-tight">ZapFlow</span>
    </div>
  );
}

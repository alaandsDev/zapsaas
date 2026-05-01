export function Field({ label, hint, error, children }) {
  return (
    <label className="block">
      {label && <span className="block text-sm font-medium text-ink-100 mb-1.5">{label}</span>}
      {children}
      {hint && !error && <span className="block text-xs text-ink-500 mt-1.5">{hint}</span>}
      {error && <span className="block text-xs text-red-400 mt-1.5">{error}</span>}
    </label>
  );
}

export function Input(props) {
  return (
    <input
      {...props}
      className={
        "w-full rounded-xl bg-bg/60 border border-white/10 px-4 py-3 text-ink-100 placeholder:text-ink-500 outline-none transition-all focus:border-primary/60 focus:ring-2 focus:ring-primary/20 " +
        (props.className || "")
      }
    />
  );
}

export function Textarea(props) {
  return (
    <textarea
      {...props}
      className={
        "w-full rounded-xl bg-bg/60 border border-white/10 px-4 py-3 text-ink-100 placeholder:text-ink-500 outline-none transition-all focus:border-primary/60 focus:ring-2 focus:ring-primary/20 min-h-[100px] " +
        (props.className || "")
      }
    />
  );
}

export function Select({ children, ...props }) {
  return (
    <select
      {...props}
      className={
        "w-full rounded-xl bg-bg/60 border border-white/10 px-4 py-3 text-ink-100 outline-none transition-all focus:border-primary/60 focus:ring-2 focus:ring-primary/20 " +
        (props.className || "")
      }
    >
      {children}
    </select>
  );
}

export function Button({ variant = "primary", loading, children, ...props }) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary:
      "bg-primary text-bg hover:bg-primary-hover shadow-glow hover:scale-[1.01] active:scale-[0.99]",
    ghost: "text-ink-100 border border-white/10 hover:border-white/20 hover:bg-white/5",
    danger: "bg-red-500/10 border border-red-500/30 text-red-300 hover:bg-red-500/20",
  };
  return (
    <button {...props} disabled={props.disabled || loading} className={`${base} ${variants[variant]} ${props.className || ""}`}>
      {loading && <span className="size-4 border-2 border-current border-t-transparent rounded-full animate-spin" />}
      {children}
    </button>
  );
}

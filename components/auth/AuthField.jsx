// Inputs/botões com a nova aparência (tema light) exclusivos das telas de
// autenticação. Não reaproveita components/ui/Field.jsx de propósito: aquele
// arquivo ainda serve o tema escuro do dashboard interno.

export function AuthField({ label, hint, error, children }) {
  return (
    <label className="block">
      {label && (
        <span className="block text-[13.5px] font-semibold text-[#26303E] mb-[7px]">
          {label}
        </span>
      )}
      {children}
      {hint && !error && (
        <span className="block text-xs text-[#8A94A6] mt-1.5">{hint}</span>
      )}
      {error && (
        <span className="block text-xs text-red-500 mt-1.5">{error}</span>
      )}
    </label>
  );
}

export function AuthInput(props) {
  return (
    <input
      {...props}
      className={
        "w-full rounded-[13px] bg-[#FBFCFD] border border-[#E1E5EB] px-[15px] py-[13px] text-[15px] text-[#0A1020] placeholder:text-[#9AA3B2] outline-none transition-all " +
        "focus:border-[#0E8A47] focus:bg-white focus:ring-4 focus:ring-[#25D366]/[0.16] " +
        (props.className || "")
      }
    />
  );
}

export function AuthButton({ loading, children, className = "", ...props }) {
  return (
    <button
      {...props}
      disabled={props.disabled || loading}
      className={
        "w-full inline-flex items-center justify-center gap-2 rounded-full px-5 py-[13px] text-[15.5px] font-semibold text-white bg-[#0E8A47] " +
        "shadow-[0_16px_32px_-16px_rgba(14,138,71,0.7)] transition-all duration-200 " +
        "hover:bg-[#0B7239] hover:-translate-y-px active:translate-y-0 " +
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0 " +
        className
      }
    >
      {loading && (
        <span className="size-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {children}
    </button>
  );
}

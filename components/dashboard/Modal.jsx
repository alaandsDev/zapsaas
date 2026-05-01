"use client";
import { useEffect } from "react";

export default function Modal({ open, onClose, title, children, footer, size = "md" }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;
  const sizes = { sm: "max-w-md", md: "max-w-xl", lg: "max-w-3xl" };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full ${sizes[size]} card p-6 max-h-[85vh] overflow-y-auto`}>
        <div className="flex items-start justify-between mb-5">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="text-ink-500 hover:text-ink-100 size-8 rounded-lg hover:bg-white/5 flex items-center justify-center">✕</button>
        </div>
        {children}
        {footer && <div className="mt-6 flex items-center justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}

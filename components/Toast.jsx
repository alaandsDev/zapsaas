"use client";
import { createContext, useCallback, useContext, useEffect, useState } from "react";

const ToastCtx = createContext(null);

let externalPush = null; // permite chamar toast.success() fora de hooks

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);

  const push = useCallback((toast) => {
    const id = toast.id ?? `t_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const item = {
      id,
      type: toast.type || "info",
      title: toast.title || null,
      message: toast.message || (typeof toast === "string" ? toast : ""),
      duration: toast.duration ?? 4500,
      action: toast.action,
    };
    setItems((prev) => [...prev, item]);
    if (item.duration > 0) setTimeout(() => dismiss(id), item.duration);
    return id;
  }, []);

  const dismiss = useCallback((id) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => { externalPush = push; return () => { if (externalPush === push) externalPush = null; }; }, [push]);

  return (
    <ToastCtx.Provider value={{ push, dismiss }}>
      {children}
      <div className="pointer-events-none fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-[calc(100vw-2rem)] sm:max-w-sm">
        {items.map((t) => <ToastItem key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />)}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) return { push: () => {}, dismiss: () => {} };
  return ctx;
}

// API global — pode chamar de qualquer lugar (fora de hook):
//   toast.success("Salvo!"); toast.error({ title: "Falha", message: "..." })
export const toast = {
  success: (m) => externalPush?.(typeof m === "string" ? { type: "success", message: m } : { ...m, type: "success" }),
  error:   (m) => externalPush?.(typeof m === "string" ? { type: "error",   message: m } : { ...m, type: "error" }),
  info:    (m) => externalPush?.(typeof m === "string" ? { type: "info",    message: m } : { ...m, type: "info" }),
  warning: (m) => externalPush?.(typeof m === "string" ? { type: "warning", message: m } : { ...m, type: "warning" }),
};

const STYLES = {
  success: { ring: "border-primary/30",      bar: "bg-primary",      icon: "✓", iconBg: "bg-primary/15 text-primary" },
  error:   { ring: "border-red-500/30",      bar: "bg-red-500",      icon: "✕", iconBg: "bg-red-500/15 text-red-300" },
  info:    { ring: "border-accent-blue/30",  bar: "bg-accent-blue",  icon: "i", iconBg: "bg-accent-blue/15 text-accent-blue" },
  warning: { ring: "border-yellow-500/30",   bar: "bg-yellow-500",   icon: "!", iconBg: "bg-yellow-500/15 text-yellow-300" },
};

function ToastItem({ toast, onDismiss }) {
  const s = STYLES[toast.type] || STYLES.info;
  const [exiting, setExiting] = useState(false);

  function close() {
    setExiting(true);
    setTimeout(onDismiss, 180);
  }

  return (
    <div
      role="status"
      className={`pointer-events-auto relative overflow-hidden rounded-xl border bg-bg2/95 backdrop-blur-md shadow-2xl shadow-black/30 ${s.ring} ${exiting ? "animate-toast-out" : "animate-toast-in"}`}
    >
      {/* Barra de progresso */}
      {toast.duration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/[0.06] overflow-hidden">
          <div className={`h-full ${s.bar} animate-toast-bar`} style={{ animationDuration: `${toast.duration}ms` }} />
        </div>
      )}
      <div className="flex items-start gap-3 p-4 pr-3">
        <div className={`size-8 shrink-0 rounded-lg flex items-center justify-center font-bold text-sm ${s.iconBg}`}>
          {s.icon}
        </div>
        <div className="flex-1 min-w-0 pt-0.5">
          {toast.title && <div className="font-semibold text-sm text-ink-100">{toast.title}</div>}
          {toast.message && <div className={`text-sm text-ink-300 ${toast.title ? "mt-0.5" : ""}`}>{toast.message}</div>}
          {toast.action && (
            <button onClick={() => { toast.action.onClick?.(); close(); }} className="mt-2 text-xs font-semibold text-primary hover:underline">
              {toast.action.label}
            </button>
          )}
        </div>
        <button onClick={close} className="size-7 shrink-0 rounded-md text-ink-500 hover:text-ink-100 hover:bg-white/5 flex items-center justify-center text-lg leading-none">
          ×
        </button>
      </div>
    </div>
  );
}

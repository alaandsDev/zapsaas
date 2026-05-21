"use client";
import { useEffect, useRef, useState } from "react";

const KEY = "zapflow_theme";
const MODES = [
  { v: "dark",  label: "Escuro",   icon: "🌙" },
  { v: "light", label: "Claro",    icon: "☀️" },
  { v: "auto",  label: "Sistema",  icon: "💻" },
];

function applyTheme(mode) {
  if (typeof document === "undefined") return;
  const sys = window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  const effective = mode === "auto" ? sys : mode;
  document.documentElement.dataset.theme = effective;
}

export default function ThemeToggle() {
  const [mode, setMode] = useState("dark");
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem(KEY) || "dark";
    setMode(saved);
    applyTheme(saved);
    // Reage a mudança de preferência do SO em modo auto
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const onChange = () => { if (localStorage.getItem(KEY) === "auto") applyTheme("auto"); };
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  function pick(v) {
    setMode(v);
    localStorage.setItem(KEY, v);
    applyTheme(v);
    setOpen(false);
  }

  const current = MODES.find((m) => m.v === mode) || MODES[0];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="size-9 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-ink-300 hover:text-ink-100 transition-colors"
        aria-label="Tema"
        title={`Tema: ${current.label}`}
      >
        <span className="text-sm">{current.icon}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-44 card p-1.5 shadow-2xl shadow-black/40 z-50">
          {MODES.map((m) => (
            <button
              key={m.v}
              onClick={() => pick(m.v)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                mode === m.v ? "bg-primary/10 text-primary" : "text-ink-200 hover:bg-white/5"
              }`}
            >
              <span>{m.icon}</span>
              <span className="flex-1 text-left">{m.label}</span>
              {mode === m.v && <span className="text-primary">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

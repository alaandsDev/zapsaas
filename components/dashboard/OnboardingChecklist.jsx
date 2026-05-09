"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "../../lib/api";

const STORAGE_KEY = "zapflow_onboarding_dismissed";

export default function OnboardingChecklist() {
  const [steps, setSteps] = useState({
    connected: false,
    hasContacts: false,
    hasDispatch: false,
  });
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem(STORAGE_KEY) === "1") {
      setDismissed(true);
    }
    Promise.all([
      api("/api/whatsapp/sessions").catch(() => []),
      api("/api/leads").catch(() => []),
      api("/api/dispatches").catch(() => []),
    ]).then(([sessions, leads, dispatches]) => {
      const sArr = Array.isArray(sessions) ? sessions : [];
      const lArr = Array.isArray(leads) ? leads : (leads?.data || []);
      const dArr = Array.isArray(dispatches) ? dispatches : (dispatches?.data || []);
      setSteps({
        connected: sArr.some((s) => s.status === "connected"),
        hasContacts: lArr.length > 0,
        hasDispatch: dArr.length > 0,
      });
      setLoading(false);
    });
  }, []);

  if (loading || dismissed) return null;

  const items = [
    {
      done: steps.connected,
      title: "Conectar seu WhatsApp",
      desc: "Escaneie o QR code em 30s e ative seu número",
      cta: "Conectar agora",
      href: "/dashboard/conexoes",
    },
    {
      done: steps.hasContacts,
      title: "Importar sua lista de contatos",
      desc: "Excel, CSV ou cadastre manualmente — limpamos duplicatas pra você",
      cta: "Importar contatos",
      href: "/dashboard/leads",
    },
    {
      done: steps.hasDispatch,
      title: "Fazer seu primeiro disparo",
      desc: "Mande uma mensagem em massa pra sua base — em 2 cliques",
      cta: "Criar disparo",
      href: "/dashboard/disparos",
    },
  ];

  const completed = items.filter((i) => i.done).length;
  const pct = Math.round((completed / items.length) * 100);
  if (completed === items.length) return null; // Some quando 100%

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, "1");
    setDismissed(true);
  }

  return (
    <div className="card p-6 bg-gradient-to-br from-primary/[0.08] via-card to-card border-primary/30 relative overflow-hidden">
      <div className="absolute -top-12 -right-12 size-40 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

      <div className="flex items-start justify-between gap-4 relative">
        <div>
          <div className="text-xs uppercase tracking-[0.15em] text-primary font-semibold mb-1">
            🚀 Comece em 3 passos
          </div>
          <h3 className="text-xl font-bold">Configure sua conta e venda hoje mesmo</h3>
          <p className="text-sm text-ink-300 mt-1">
            {completed} de {items.length} concluído · {pct}% pronto
          </p>
        </div>
        <button
          onClick={dismiss}
          className="text-xs text-ink-400 hover:text-ink-200 px-3 py-1 rounded-lg hover:bg-white/5"
          title="Dispensar checklist"
        >
          Dispensar
        </button>
      </div>

      {/* Barra de progresso */}
      <div className="mt-4 h-2 rounded-full bg-white/[0.05] overflow-hidden relative">
        <div
          className="h-full bg-gradient-to-r from-primary to-accent-blue rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Steps */}
      <div className="mt-6 grid gap-3">
        {items.map((item, i) => (
          <div
            key={i}
            className={`flex items-center gap-4 p-4 rounded-xl border transition-colors ${
              item.done
                ? "bg-primary/[0.04] border-primary/20"
                : "bg-white/[0.02] border-white/10 hover:border-primary/30"
            }`}
          >
            <div
              className={`size-10 shrink-0 rounded-full flex items-center justify-center font-bold ${
                item.done
                  ? "bg-primary text-bg"
                  : "bg-white/5 text-ink-400 border border-white/10"
              }`}
            >
              {item.done ? "✓" : i + 1}
            </div>
            <div className="flex-1 min-w-0">
              <div className={`font-semibold text-sm ${item.done ? "text-ink-400 line-through" : ""}`}>
                {item.title}
              </div>
              {!item.done && <div className="text-xs text-ink-400 mt-0.5">{item.desc}</div>}
            </div>
            {!item.done && (
              <Link
                href={item.href}
                className="shrink-0 px-4 py-2 rounded-lg bg-primary text-bg font-semibold text-xs hover:opacity-90 transition-opacity"
              >
                {item.cta} →
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

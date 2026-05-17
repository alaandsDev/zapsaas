"use client";
import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, X, Clock, TrendingDown, Flame, ShieldCheck,
  Workflow, ArrowUpRight, Send,
} from "lucide-react";
import Link from "next/link";
import { api } from "../../lib/api";

const brl = (n) => Number(n || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

export default function AiCopilot() {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState(null);
  const [q, setQ] = useState("");
  const [answer, setAnswer] = useState(null);

  const toggle = useCallback(() => setOpen((v) => !v), []);

  useEffect(() => {
    const onEvt = () => setOpen(true);
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("wayvo:open-copilot", onEvt);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("wayvo:open-copilot", onEvt);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  useEffect(() => {
    if (!open || data) return;
    Promise.all([
      api("/api/stats").catch(() => ({})),
      api("/api/dashboard/insights").catch(() => null),
      api("/api/sales/summary?days=30").catch(() => null),
      api("/api/dispatches").catch(() => []),
    ]).then(([stats, ins, rev, disp]) => {
      const ds = Array.isArray(disp) ? disp : disp?.data || [];
      const bestHour = (ins?.hours || []).reduce((a, h) => (h.value > (a?.value || 0) ? h : a), null);
      setData({ stats: stats || {}, bestHour, revenue: rev, dispatches: ds });
    });
  }, [open, data]);

  const insights = buildInsights(data);

  function ask(e) {
    e?.preventDefault();
    const text = q.trim();
    if (!text) return;
    setAnswer({
      q: text,
      a: "Posso te ajudar a montar campanhas, fluxos e ler a operação. Esta resposta inteligente entra em breve — por enquanto, veja as recomendações priorizadas abaixo, geradas a partir dos seus dados.",
    });
    setQ("");
  }

  return (
    <>
      {/* Launcher flutuante */}
      <button
        onClick={toggle}
        aria-label="Abrir Wayvo AI"
        className="fixed bottom-5 right-5 z-40 size-12 rounded-2xl flex items-center justify-center shadow-[0_12px_40px_-10px_rgba(124,58,237,0.6)] transition-transform hover:scale-105 active:scale-95"
        style={{ background: "linear-gradient(135deg, #7C3AED, #00D1FF)" }}
      >
        <Sparkles className="size-5 text-white" />
        <span className="absolute -top-1 -right-1 size-3 rounded-full bg-primary border-2 border-bg" />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px]"
            />
            <motion.aside
              initial={{ x: 420, opacity: 0.6 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 420, opacity: 0.4 }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className="fixed right-0 top-0 z-50 h-screen w-[400px] max-w-[92vw] flex flex-col border-l border-white/[0.08]"
              style={{ background: "linear-gradient(180deg, #0B1120, #0F172A)" }}
            >
              <div className="flex items-center justify-between px-5 h-16 border-b border-white/[0.06]">
                <div className="flex items-center gap-2.5">
                  <div className="size-8 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#7C3AED,#00D1FF)" }}>
                    <Sparkles className="size-4 text-white" />
                  </div>
                  <div>
                    <div className="text-sm font-bold flex items-center gap-2">
                      Wayvo AI
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-secondary/20 text-secondary border border-secondary/30">BETA</span>
                    </div>
                    <div className="text-[11px] text-ink-500">Copiloto operacional</div>
                  </div>
                </div>
                <button onClick={() => setOpen(false)} className="text-ink-500 hover:text-ink-100"><X className="size-5" /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {answer && (
                  <div className="rounded-2xl border border-secondary/25 bg-secondary/[0.06] p-3.5">
                    <div className="text-[11px] text-ink-400 mb-1">Você: {answer.q}</div>
                    <div className="text-[13px] text-ink-100 leading-relaxed">{answer.a}</div>
                  </div>
                )}

                <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-500">
                  Recomendações priorizadas
                </div>

                {!data ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-24 rounded-2xl bg-white/[0.04] animate-pulse" />
                  ))
                ) : (
                  insights.map((it, i) => (
                    <motion.div
                      key={it.title}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.06 }}
                      className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-3.5 hover:border-white/[0.14] transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <span className="size-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                          style={{ background: `${it.tint}1a`, border: `1px solid ${it.tint}40` }}>
                          <it.Icon className="size-4" style={{ color: it.tint }} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[13px] font-semibold text-ink-50">{it.title}</span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full uppercase tracking-wide"
                              style={{ background: `${it.tint}1a`, color: it.tint }}>{it.tag}</span>
                          </div>
                          <p className="text-[12px] text-ink-300 mt-1 leading-relaxed">{it.text}</p>
                          {it.href && (
                            <Link href={it.href} onClick={() => setOpen(false)}
                              className="inline-flex items-center gap-1 text-[12px] font-semibold mt-2 hover:underline"
                              style={{ color: it.tint }}>
                              {it.cta} <ArrowUpRight className="size-3" />
                            </Link>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>

              <form onSubmit={ask} className="p-4 border-t border-white/[0.06]">
                <div className="relative">
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Peça algo ao copiloto…"
                    className="w-full rounded-xl bg-white/[0.04] border border-white/10 pl-4 pr-11 py-3 text-sm outline-none focus:border-secondary/50 transition-colors placeholder:text-ink-500"
                  />
                  <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 size-8 rounded-lg flex items-center justify-center text-white"
                    style={{ background: "linear-gradient(135deg,#7C3AED,#00D1FF)" }}>
                    <Send className="size-4" />
                  </button>
                </div>
                <div className="text-[10px] text-ink-600 mt-2">
                  Sugestões geradas a partir dos seus dados reais. Respostas conversacionais em breve.
                </div>
              </form>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

// Constrói insights — usa dado real quando existe; senão, recomendação acionável.
function buildInsights(d) {
  if (!d) return [];
  const { stats = {}, bestHour, revenue, dispatches = [] } = d;
  const out = [];

  if (bestHour && bestHour.value > 0) {
    out.push({
      Icon: Clock, tint: "#22D3EE", tag: "timing",
      title: "Melhor horário detectado",
      text: `Seus contatos respondem mais por volta de ${bestHour.h}. Agende campanhas nessa janela para maior taxa de resposta.`,
      href: "/dashboard/campanhas", cta: "Criar campanha nesse horário",
    });
  }

  const lastDisp = dispatches[0];
  if (lastDisp && (lastDisp.total || 0) > 0) {
    const rate = Math.round(((lastDisp.sent || 0) / Math.max(lastDisp.total, 1)) * 100);
    if (rate < 70) {
      out.push({
        Icon: TrendingDown, tint: "#F59E0B", tag: "atenção",
        title: "Campanha com performance baixa",
        text: `"${lastDisp.message_title || "Sua última campanha"}" entregou ${rate}%. Reveja segmentação e horário, e ative o balanceamento entre canais.`,
        href: "/dashboard/campanhas", cta: "Revisar campanha",
      });
    }
  }

  if ((stats.newLeads || 0) > 0) {
    out.push({
      Icon: Flame, tint: "#EF4444", tag: "lead quente",
      title: `${stats.newLeads} lead(s) novo(s) aguardando`,
      text: "Leads recém-capturados convertem muito mais nas primeiras horas. Priorize o atendimento agora.",
      href: "/dashboard/leads", cta: "Abrir CRM",
    });
  }

  out.push({
    Icon: ShieldCheck, tint: "#00FF88", tag: "estabilidade",
    title: "Saúde operacional dos canais",
    text: "Distribua o volume entre os números conectados e use intervalos entre mensagens para manter a entrega estável e consistente.",
    href: "/dashboard/canais", cta: "Ver canais",
  });

  if (revenue && (revenue.total || 0) >= 0) {
    out.push({
      Icon: Workflow, tint: "#7C3AED", tag: "revenue ops",
      title: "Automação pode elevar a receita",
      text: `Receita atribuída nos últimos 30d: ${brl(revenue.total || 0)}. Um fluxo de follow-up costuma recuperar parte dos leads sem resposta.`,
      href: "/dashboard/workflow", cta: "Montar fluxo de recuperação",
    });
  }

  return out;
}

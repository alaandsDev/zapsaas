"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Topbar from "../../../components/dashboard/Topbar";
import { Field, Input, Button } from "../../../components/ui/Field";
import { api, getUser } from "../../../lib/api";

function fmtDate(iso) {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleDateString("pt-BR"); } catch { return "—"; }
}

function ConsultarPrecoModal({ open, onClose }) {
  const [form, setForm] = useState({ nome: "", whatsapp: "", email: "", disparos: "", usaApi: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState("");

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  async function submit() {
    if (!form.nome.trim() || !form.whatsapp.trim() || !form.email.trim() || !form.disparos || !form.usaApi) {
      setErr("Preencha todos os campos para continuar."); return;
    }
    setSending(true); setErr("");
    try {
      await api("/api/lead-contact", { method: "POST", body: form });
    } catch (_) {}
    setSent(true); setSending(false);
  }

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#0B1120] shadow-2xl overflow-hidden"
      >
        <div className="h-1 w-full bg-gradient-to-r from-primary to-accent-blue" />
        <div className="p-6">
          {sent ? (
            <div className="text-center py-6 space-y-3">
              <div className="text-4xl">🎉</div>
              <h3 className="text-lg font-bold text-ink-100">Recebemos sua solicitação!</h3>
              <p className="text-sm text-ink-400 leading-relaxed">
                Nossa equipe vai entrar em contato com você em breve no WhatsApp informado com a melhor proposta personalizada.
              </p>
              <button onClick={onClose} className="mt-4 px-6 py-2 rounded-xl bg-primary/15 border border-primary/30 text-primary text-sm font-semibold hover:bg-primary/25 transition-colors">
                Fechar
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-base font-bold text-ink-100">Consultar preço</h3>
                  <p className="text-xs text-ink-500 mt-0.5">Preencha e nossa equipe entra em contato</p>
                </div>
                <button onClick={onClose} className="text-ink-500 hover:text-ink-300 text-xl leading-none">✕</button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-400 mb-1">Nome *</label>
                  <input value={form.nome} onChange={e => set("nome", e.target.value)} placeholder="Seu nome completo"
                    className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-[13px] outline-none focus:border-primary/50 transition-colors placeholder:text-ink-600" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-400 mb-1">WhatsApp *</label>
                  <input value={form.whatsapp} onChange={e => set("whatsapp", e.target.value)} placeholder="(11) 99999-9999"
                    className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-[13px] outline-none focus:border-primary/50 transition-colors placeholder:text-ink-600" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-400 mb-1">E-mail *</label>
                  <input value={form.email} onChange={e => set("email", e.target.value)} placeholder="seu@email.com" type="email"
                    className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-[13px] outline-none focus:border-primary/50 transition-colors placeholder:text-ink-600" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-400 mb-1">Quantidade de disparos mensais *</label>
                  <select value={form.disparos} onChange={e => set("disparos", e.target.value)}
                    className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-[13px] outline-none focus:border-primary/50 transition-colors appearance-none cursor-pointer">
                    <option value="">Selecione...</option>
                    <option value="ate_1000">Até 1.000</option>
                    <option value="1001_5000">1.001 a 5.000</option>
                    <option value="5001_20000">5.001 a 20.000</option>
                    <option value="20001_50000">20.001 a 50.000</option>
                    <option value="acima_50000">Acima de 50.000</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-400 mb-2">Usa API oficial da Meta? *</label>
                  <div className="flex gap-3">
                    {["sim", "nao"].map(v => (
                      <button key={v} type="button" onClick={() => set("usaApi", v)}
                        className={`flex-1 py-2 rounded-xl border text-[13px] font-semibold transition-colors ${form.usaApi === v ? "border-primary/50 bg-primary/15 text-primary" : "border-white/10 bg-white/[0.04] text-ink-400 hover:border-white/20"}`}>
                        {v === "sim" ? "✓ Sim" : "✕ Não"}
                      </button>
                    ))}
                  </div>
                </div>

                {err && <p className="text-[12px] text-red-400 font-medium">{err}</p>}

                <button onClick={submit} disabled={sending}
                  className="w-full mt-2 py-2.5 rounded-xl bg-primary text-bg font-bold text-sm hover:bg-primary/90 transition-colors disabled:opacity-60">
                  {sending ? "Enviando..." : "Solicitar proposta personalizada"}
                </button>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default function WorkspacePage() {
  const [user, setUser] = useState(null);
  const [sub, setSub] = useState(null);
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [portalErr, setPortalErr] = useState("");
  const [showConsultar, setShowConsultar] = useState(false);

  useEffect(() => {
    setUser(getUser());
    api("/api/subscription").then(setSub).catch(() => {});
    api("/api/usage").then(setUsage).catch(() => {});
  }, []);
  async function portal() {
    setLoading(true); setPortalErr("");
    try {
      const r = await api("/api/stripe/portal", { method: "POST" });
      if (r?.url) location.href = r.url;
      else setPortalErr("Não foi possível abrir o portal. Tente novamente.");
    } catch (e) {
      setPortalErr(e.message || "Erro ao acessar portal de assinatura.");
    } finally { setLoading(false); }
  }

  const isPro = sub?.plan === "pro" || sub?.status === "active";

  return (
    <>
      <Topbar title="Workspace" subtitle="Perfil, plano e configurações" />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10 space-y-6">
        <div className="card p-6">
          <h3 className="font-semibold mb-4">👤 Perfil</h3>
          <div className="space-y-4">
            <Field label="Nome"><Input value={user?.name || ""} disabled /></Field>
            <Field label="E-mail"><Input value={user?.email || ""} disabled /></Field>
            <p className="text-xs text-ink-500">Para alterar dados de perfil ou senha, entre em contato com o suporte.</p>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="font-semibold mb-4">💳 Plano</h3>
          <div className="flex items-start gap-4 flex-wrap">
            <div className="size-12 rounded-xl bg-gradient-to-br from-primary to-accent-blue text-bg font-bold flex items-center justify-center shrink-0">⚡</div>
            <div className="flex-1 min-w-[200px]">
              <div className="text-sm text-ink-300">Plano atual</div>
              <div className="text-2xl font-bold flex items-center gap-2">
                {isPro ? "Pro" : "Gratuito"}
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isPro ? "bg-primary/15 text-primary border border-primary/30" : "bg-white/5 text-ink-300 border border-white/10"}`}>
                  {isPro ? "Ativo" : "Free"}
                </span>
              </div>
              <div className="text-sm text-ink-300 mt-1">
                {isPro ? "Disparos ilimitados · Contatos ilimitados · Suporte" : "Até 50 contatos · 3 disparos/mês"}
              </div>
            </div>
            {isPro ? (
              <div className="space-y-2">
                <Button variant="ghost" loading={loading} onClick={portal}>Gerenciar Assinatura</Button>
                {portalErr && <p className="text-xs text-red-400 mt-1">{portalErr}</p>}
              </div>
            ) : (
              <button onClick={() => setShowConsultar(true)}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-accent-blue text-bg font-bold text-sm hover:opacity-90 transition-opacity shadow-lg shadow-primary/25">
                Consultar preço
              </button>
            )}
          </div>

          {usage && (
            <div className="mt-5 pt-5 border-t border-white/[0.06] grid grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-ink-500 text-xs">Disparos usados</div>
                <div className="font-semibold mt-1">{usage.dispatches?.used ?? 0}{usage.dispatches?.limit != null ? ` / ${usage.dispatches.limit}` : ""}</div>
              </div>
              <div>
                <div className="text-ink-500 text-xs">Contatos</div>
                <div className="font-semibold mt-1">{usage.contacts?.used ?? usage.leads?.used ?? 0}{usage.contacts?.limit ?? usage.leads?.limit ? ` / ${usage.contacts?.limit ?? usage.leads?.limit}` : ""}</div>
              </div>
              <div>
                <div className="text-ink-500 text-xs">{isPro ? "Próxima cobrança" : "Renova em"}</div>
                <div className="font-semibold mt-1">{sub?.current_period_end || sub?.expires_at ? fmtDate(sub.current_period_end || sub.expires_at) : "—"}</div>
              </div>
            </div>
          )}
        </div>

        {!isPro && (
          <div className="card p-6 bg-gradient-to-br from-primary/[0.06] to-card border-primary/20">
            <h3 className="font-semibold">Quer mais poder na sua operação?</h3>
            <ul className="mt-4 space-y-2 text-sm text-ink-100">
              <li className="flex gap-2"><span className="text-primary">✓</span> Disparos ilimitados</li>
              <li className="flex gap-2"><span className="text-primary">✓</span> Contatos e listas ilimitados</li>
              <li className="flex gap-2"><span className="text-primary">✓</span> Agendamento de envios</li>
              <li className="flex gap-2"><span className="text-primary">✓</span> Suporte prioritário no WhatsApp</li>
            </ul>
            <div className="mt-5">
              <button onClick={() => setShowConsultar(true)}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-primary to-accent-blue text-bg font-bold text-sm hover:opacity-90 transition-opacity shadow-lg shadow-primary/25">
                Consultar preço →
              </button>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showConsultar && <ConsultarPrecoModal open={showConsultar} onClose={() => setShowConsultar(false)} />}
      </AnimatePresence>
    </>
  );
}

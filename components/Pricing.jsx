"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Megaphone, Radio, MessagesSquare, ListFilter, Image as ImageIcon, LayoutTemplate,
  LayoutDashboard, Brain, Workflow, TrendingUp, BarChart3, FileSpreadsheet, Plug,
  Headset, Check, Minus, Sparkles,
} from "lucide-react";
import { track } from "./Analytics";
import { api, getToken } from "../lib/api";
import Icon from "./ui/Icon";

const plans = [
  {
    id: "starter",
    name: "Starter",
    tagline: "Pra começar a vender",
    price: "R$ 97,90",
    period: "/mês",
    trial: "7 dias grátis · cartão pedido agora, cobrança só depois do 7º dia",
    desc: "Campanhas ilimitadas, CRM conversacional, automação com IA e canais com balanceamento inteligente.",
    cta: "Começar teste de 7 dias",
    highlighted: false,
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "Starter + Agente de IA",
    price: "R$ 197,90",
    period: "/mês",
    trial: "7 dias grátis · cartão pedido agora, cobrança só depois do 7º dia",
    desc: "Tudo do Starter, mais o Agente de IA: você treina como ele responde, e ele atende sozinho no WhatsApp.",
    cta: "Começar teste de 7 dias",
    highlighted: true,
    badge: "Agente de IA incluso",
  },
];

const FEATURE_GROUPS = [
  {
    category: "Campanhas & canais",
    items: [
      { icon: Megaphone, label: "Campanhas por mês", starter: "Ilimitadas", pro: "Ilimitadas" },
      { icon: Radio, label: "Canais conectados", starter: "2 canais (balanceamento inteligente)", pro: "2 canais (balanceamento inteligente)" },
      { icon: MessagesSquare, label: "Leads / CRM conversacional", starter: "Ilimitados", pro: "Ilimitados" },
      { icon: ListFilter, label: "Listas e segmentação", starter: "Ilimitadas", pro: "Ilimitadas" },
    ],
  },
  {
    category: "Conteúdo & atendimento",
    items: [
      { icon: ImageIcon, label: "Mídia (foto/vídeo/áudio/PDF)", starter: true, pro: true },
      { icon: LayoutTemplate, label: "Templates prontos por nicho", starter: true, pro: true },
      { icon: LayoutDashboard, label: "Painel operacional completo", starter: true, pro: true },
    ],
  },
  {
    category: "IA & automação",
    items: [
      { icon: Brain, label: "Copiloto de IA operacional", starter: true, pro: true },
      { icon: Workflow, label: "Automação com IA (monta o fluxo pra você)", starter: true, pro: true },
      { icon: TrendingUp, label: "Receita rastreada por campanha", starter: true, pro: true },
      { icon: Sparkles, label: "Agente de IA autônomo — você treina, ele responde no WhatsApp", starter: false, pro: true },
    ],
  },
  {
    category: "Relatórios & suporte",
    items: [
      { icon: BarChart3, label: "Relatórios e métricas em tempo real", starter: true, pro: true },
      { icon: FileSpreadsheet, label: "Export de relatórios em Excel", starter: true, pro: true },
      { icon: Plug, label: "API oficial WhatsApp (Canal Oficial)", starter: true, pro: true },
      { icon: Headset, label: "Suporte prioritário", starter: true, pro: true },
    ],
  },
];

const DISPAROS_OPTS = [
  { value: "ate_1000", label: "Até 1.000" },
  { value: "1001_5000", label: "1.001 a 5.000" },
  { value: "5001_20000", label: "5.001 a 20.000" },
  { value: "20001_50000", label: "20.001 a 50.000" },
  { value: "acima_50000", label: "Acima de 50.000" },
];

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://delivery-full-production.up.railway.app";

function ConsultarPrecoModal({ open, onClose }) {
  const [form, setForm] = useState({ nome: "", whatsapp: "", email: "", disparos: "", usaApi: "" });
  const [aceite, setAceite] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState("");

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  async function submit() {
    if (!form.nome.trim() || !form.whatsapp.trim() || !form.email.trim() || !form.disparos || !form.usaApi) {
      setErr("Preencha todos os campos para continuar."); return;
    }
    if (!aceite) {
      setErr("Marque o aceite da Política de Privacidade para continuar."); return;
    }
    setSending(true); setErr("");
    try {
      const res = await fetch(`${API_URL}/api/lead-contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error(`status ${res.status}`);
      track("Lead", { origem: "modal-consultar-preco" });
      setSent(true);
    } catch (_) {
      // Nunca mostrar sucesso sem o lead ter chegado: o cliente iria embora
      // achando que temos os dados dele.
      setErr("Não conseguimos enviar agora. Tente de novo ou chame a gente no WhatsApp.");
    } finally {
      setSending(false);
    }
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
        <div className="h-1 w-full bg-gradient-to-r from-primary to-[#3B82F6]" />
        <div className="p-6">
          {sent ? (
            <div className="text-center py-6 space-y-3">
              <div className="flex justify-center text-primary">
                <Icon name="sucesso" className="size-11" strokeWidth={1.5} />
              </div>
              <h3 className="text-lg font-bold text-white">Recebemos sua solicitação!</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
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
                  <h3 className="text-base font-bold text-white">Falar com a gente</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Volume alto ou API oficial? Montamos uma proposta</p>
                </div>
                <button onClick={onClose} className="text-gray-500 hover:text-gray-300 text-xl leading-none">✕</button>
              </div>
              <div className="space-y-3">
                {[
                  { key: "nome", label: "Nome", placeholder: "Seu nome completo" },
                  { key: "whatsapp", label: "WhatsApp", placeholder: "(11) 99999-9999" },
                  { key: "email", label: "E-mail", placeholder: "seu@email.com", type: "email" },
                ].map(f => (
                  <div key={f.key}>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1">{f.label} *</label>
                    <input value={form[f.key]} onChange={e => set(f.key, e.target.value)}
                      placeholder={f.placeholder} type={f.type || "text"}
                      className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-[13px] text-white outline-none focus:border-primary/50 transition-colors placeholder:text-gray-600" />
                  </div>
                ))}
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1">Disparos mensais *</label>
                  <select value={form.disparos} onChange={e => set("disparos", e.target.value)}
                    className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-[13px] text-white outline-none focus:border-primary/50 transition-colors appearance-none cursor-pointer">
                    <option value="">Selecione...</option>
                    {DISPAROS_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-2">Usa API oficial da Meta? *</label>
                  <div className="flex gap-3">
                    {["sim", "nao"].map(v => (
                      <button key={v} type="button" onClick={() => set("usaApi", v)}
                        className={`flex-1 py-2 rounded-xl border text-[13px] font-semibold transition-colors ${form.usaApi === v ? "border-primary/50 bg-primary/15 text-primary" : "border-white/10 bg-white/[0.04] text-gray-400 hover:border-white/20"}`}>
                        {v === "sim" ? "✓ Sim" : "✕ Não"}
                      </button>
                    ))}
                  </div>
                </div>
                <label className="flex items-start gap-2.5 pt-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={aceite}
                    onChange={e => setAceite(e.target.checked)}
                    className="mt-0.5 size-4 shrink-0 accent-primary cursor-pointer"
                  />
                  <span className="text-[11px] text-gray-400 leading-relaxed">
                    Autorizo a Wayvo a usar meus dados para entrar em contato com esta proposta,
                    conforme a{" "}
                    <a href="/privacidade" target="_blank" className="text-primary hover:underline">
                      Política de Privacidade
                    </a>.
                  </span>
                </label>
                {err && <p className="text-[12px] text-red-400 font-medium">{err}</p>}
                <button onClick={submit} disabled={sending}
                  className="w-full mt-2 py-2.5 rounded-xl bg-gradient-to-r from-primary to-[#3B82F6] text-black font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-60">
                  {sending ? "Enviando..." : "Solicitar proposta →"}
                </button>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default function Pricing() {
  const [showModal, setShowModal] = useState(false);
  const [checkingOut, setCheckingOut] = useState(null); // planId em andamento, ou null
  const [checkoutErr, setCheckoutErr] = useState("");

  // Visitante deslogado não tem conta pra assinar: manda criar a conta primeiro
  // e o /register já abre o checkout certo logo depois do cadastro.
  async function subscribe(planId) {
    if (!getToken()) {
      window.location.href = `/register?plano=${planId}`;
      return;
    }
    setCheckingOut(planId); setCheckoutErr("");
    try {
      const plan = plans.find((p) => p.id === planId);
      track("InitiateCheckout", { plano: planId, valor: plan?.price });
      const r = await api("/api/stripe/checkout", { method: "POST", body: { planId } });
      if (!r?.url) throw new Error("checkout sem URL");
      window.location.href = r.url;
    } catch (e) {
      setCheckoutErr("Não conseguimos abrir o pagamento agora. Tente de novo em instantes.");
      setCheckingOut(null);
    }
  }

  return (
    <section id="planos" className="py-24">
      <div className="container-x">
        <div className="max-w-2xl mx-auto text-center mb-14">
          <div className="eyebrow justify-center mb-4">
            <span className="size-1.5 rounded-full bg-primary animate-pulse" />
            Planos transparentes
          </div>
          <h2 className="text-h2">7 dias pra testar.<br />Sem surpresa depois.</h2>
          <p className="mt-4 text-ink-300 text-lg">
            Cartão pedido no cadastro, mas a cobrança só entra depois do 7º dia de uso. Cancele quando quiser.
          </p>
        </div>

        {/* Plan cards */}
        <div className="grid md:grid-cols-2 gap-5 max-w-4xl mx-auto">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`relative glass p-8 ${
                p.highlighted
                  ? "border-primary/40 bg-gradient-to-b from-primary/[0.06] to-card shadow-glow scale-[1.02]"
                  : ""
              }`}
            >
              {p.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-bg text-xs font-bold px-4 py-1 rounded-full shadow-lg shadow-primary/30">
                  {p.badge}
                </div>
              )}
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-ink-300 font-medium">{p.name}</div>
                  <div className="text-xs text-ink-500 mt-0.5">{p.tagline}</div>
                </div>
              </div>
              <div className="mt-5 flex items-baseline gap-1">
                <span className="text-4xl font-bold tracking-tight">{p.price}</span>
                {p.period && <span className="text-ink-500 ml-1">{p.period}</span>}
              </div>
              <p className="mt-3 text-ink-300 text-sm">{p.desc}</p>
              <button
                onClick={() => subscribe(p.id)}
                disabled={!!checkingOut}
                className={`w-full mt-6 disabled:opacity-60 ${p.highlighted ? "btn-primary" : "btn-secondary"}`}
              >
                {checkingOut === p.id ? "Abrindo pagamento..." : `${p.cta} →`}
              </button>
              {checkoutErr && checkingOut === null && (
                <p className="mt-3 text-center text-xs text-red-400 font-medium">{checkoutErr}</p>
              )}
              <div className="mt-3 text-center text-[11px] text-ink-500 leading-relaxed">
                {p.trial}
              </div>
              {p.highlighted && (
                <div className="mt-2 text-center text-xs">
                  <button onClick={() => setShowModal(true)} className="text-primary hover:underline">
                    Volume alto ou API oficial? Fale com a gente
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Tabela comparativa */}
        <div className="mt-16 max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold">Compare os planos</h3>
            <p className="text-ink-400 text-sm mt-2">Tudo que vem em cada um — sem surpresa</p>
          </div>
          <div className="glass overflow-hidden">
            <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] border-separate border-spacing-0">
              <thead>
                <tr>
                  <th className="text-left px-5 py-4 text-xs uppercase tracking-wider text-ink-400 font-semibold bg-white/[0.03] border-b border-white/[0.08]">
                    Recurso
                  </th>
                  <th className="px-5 py-4 text-xs uppercase tracking-wider text-ink-400 font-semibold bg-white/[0.03] border-b border-white/[0.08]">
                    Starter
                  </th>
                  <th className="px-5 py-4 text-center bg-primary/[0.07] border-b border-l-2 border-primary/25">
                    <div className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider text-primary font-bold">
                      <Sparkles className="size-3.5" strokeWidth={2.5} />
                      Pro
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {FEATURE_GROUPS.map((group) => (
                  <FeatureGroup key={group.category} group={group} />
                ))}
              </tbody>
            </table>
            </div>
          </div>
        </div>

        {/* Trust badges */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-ink-400">
          <span className="inline-flex items-center gap-2">
            <svg className="size-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M9 12l2 2 4-4"/></svg>
            Proposta personalizada
          </span>
          <span className="inline-flex items-center gap-2">
            <svg className="size-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M9 12l2 2 4-4"/></svg>
            Sem fidelidade
          </span>
          <span className="inline-flex items-center gap-2">
            <svg className="size-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
            LGPD compliant
          </span>
          <span className="inline-flex items-center gap-2">
            <Icon name="suporte" className="size-4 text-primary" strokeWidth={2} />
            Suporte humano em PT-BR
          </span>
        </div>
      </div>

      <AnimatePresence>
        {showModal && <ConsultarPrecoModal open={showModal} onClose={() => setShowModal(false)} />}
      </AnimatePresence>
    </section>
  );
}

function FeatureGroup({ group }) {
  return (
    <>
      <tr>
        <td colSpan={2} className="px-5 pt-6 pb-2 bg-transparent">
          <div className="text-[11px] font-bold uppercase tracking-wider text-ink-500">{group.category}</div>
        </td>
        <td className="px-5 pt-6 pb-2 bg-primary/[0.03] border-l-2 border-primary/25" />
      </tr>
      {group.items.map((f) => (
        <tr key={f.label} className="group">
          <td className="px-5 py-3.5 text-sm text-ink-200 border-b border-white/[0.04]">
            <span className="inline-flex items-center gap-2.5">
              <f.icon className="size-4 text-ink-500 group-hover:text-primary transition-colors shrink-0" strokeWidth={2} />
              {f.label}
            </span>
          </td>
          <td className="px-5 py-3.5 text-center text-sm border-b border-white/[0.04]">
            <Cell value={f.starter} />
          </td>
          <td className="px-5 py-3.5 text-center text-sm bg-primary/[0.03] border-b border-primary/10 border-l-2 border-primary/25">
            <Cell value={f.pro} highlighted />
          </td>
        </tr>
      ))}
    </>
  );
}

function Cell({ value, highlighted }) {
  if (value === true) {
    return (
      <span
        className={`inline-flex items-center justify-center rounded-full ${
          highlighted ? "size-7 bg-primary/20 text-primary shadow-glow-sm" : "size-6 bg-white/5 text-primary/70"
        }`}
      >
        <Check className={highlighted ? "size-4" : "size-3.5"} strokeWidth={3} />
      </span>
    );
  }
  if (value === false) {
    return (
      <span className="inline-flex items-center justify-center size-6 rounded-full bg-white/[0.03] text-ink-600">
        <Minus className="size-3.5" strokeWidth={2.5} />
      </span>
    );
  }
  return <span className={`font-medium ${highlighted ? "text-primary" : "text-ink-200"}`}>{value}</span>;
}

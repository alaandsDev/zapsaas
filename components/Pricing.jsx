"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Megaphone, Radio, MessagesSquare, ListFilter, Image as ImageIcon, LayoutTemplate,
  LayoutDashboard, Brain, Workflow, TrendingUp, BarChart3, FileSpreadsheet, Plug,
  Headset, Check, Minus, Sparkles, CircleCheck, ShieldCheck, X as XIcon,
} from "lucide-react";
import { track } from "./Analytics";
import { api, getToken } from "../lib/api";

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
      { icon: Radio, label: "Canais conectados", starter: "2 canais", pro: "2 canais" },
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
      { icon: Sparkles, label: "Agente de IA autônomo no WhatsApp", starter: false, pro: true },
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

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

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
      <div className="absolute inset-0 bg-[#0A1020]/45 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-md rounded-2xl border border-[#E4E7EC] bg-white shadow-2xl overflow-hidden"
      >
        <div className="h-1 w-full" style={{ background: "linear-gradient(100deg,#0E8A47,#2F80ED)" }} />
        <div className="p-6">
          {sent ? (
            <div className="text-center py-6 space-y-3">
              <div className="flex justify-center text-[#0E8A47]">
                <CircleCheck className="size-11" strokeWidth={1.5} />
              </div>
              <h3 className="text-[18px] font-bold text-[#0A1020]">Recebemos sua solicitação!</h3>
              <p className="text-[14px] text-[#5A6474] leading-relaxed">
                Nossa equipe vai entrar em contato com você em breve no WhatsApp informado com a melhor proposta personalizada.
              </p>
              <button
                onClick={onClose}
                className="mt-4 px-6 py-2 rounded-xl bg-[#EAFBF1] border border-[#D2F0E0] text-[#0E8A47] text-sm font-semibold hover:bg-[#D2F0E0] transition-colors"
              >
                Fechar
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-[16px] font-bold text-[#0A1020]">Falar com a gente</h3>
                  <p className="text-[12px] text-[#8A94A6] mt-0.5">Volume alto ou API oficial? Montamos uma proposta</p>
                </div>
                <button onClick={onClose} aria-label="Fechar" className="text-[#8A94A6] hover:text-[#0A1020] transition-colors">
                  <XIcon className="size-5" strokeWidth={2.25} />
                </button>
              </div>
              <div className="space-y-3">
                {[
                  { key: "nome", label: "Nome", placeholder: "Seu nome completo" },
                  { key: "whatsapp", label: "WhatsApp", placeholder: "(11) 99999-9999" },
                  { key: "email", label: "E-mail", placeholder: "seu@email.com", type: "email" },
                ].map((f) => (
                  <div key={f.key}>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#8A94A6] mb-1">
                      {f.label} *
                    </label>
                    <input
                      value={form[f.key]}
                      onChange={(e) => set(f.key, e.target.value)}
                      placeholder={f.placeholder}
                      type={f.type || "text"}
                      className="w-full bg-[#F5F6F8] border border-[#E4E7EC] rounded-lg px-3 py-2 text-[13px] text-[#0A1020] outline-none focus:border-[#0E8A47] focus:bg-white transition-colors placeholder:text-[#98A1B0]"
                    />
                  </div>
                ))}
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#8A94A6] mb-1">
                    Disparos mensais *
                  </label>
                  <select
                    value={form.disparos}
                    onChange={(e) => set("disparos", e.target.value)}
                    className="w-full bg-[#F5F6F8] border border-[#E4E7EC] rounded-lg px-3 py-2 text-[13px] text-[#0A1020] outline-none focus:border-[#0E8A47] focus:bg-white transition-colors cursor-pointer"
                  >
                    <option value="">Selecione...</option>
                    {DISPAROS_OPTS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#8A94A6] mb-2">
                    Usa API oficial da Meta? *
                  </label>
                  <div className="flex gap-3">
                    {["sim", "nao"].map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => set("usaApi", v)}
                        className={`flex-1 py-2 rounded-xl border text-[13px] font-semibold transition-colors ${
                          form.usaApi === v
                            ? "border-[#D2F0E0] bg-[#EAFBF1] text-[#0E8A47]"
                            : "border-[#E4E7EC] bg-[#F5F6F8] text-[#5A6474] hover:border-[#98A1B0]"
                        }`}
                      >
                        {v === "sim" ? "✓ Sim" : "✕ Não"}
                      </button>
                    ))}
                  </div>
                </div>
                <label className="flex items-start gap-2.5 pt-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={aceite}
                    onChange={(e) => setAceite(e.target.checked)}
                    className="mt-0.5 size-4 shrink-0 accent-[#0E8A47] cursor-pointer"
                  />
                  <span className="text-[11px] text-[#5A6474] leading-relaxed">
                    Autorizo a Wayvo a usar meus dados para entrar em contato com esta proposta, conforme a{" "}
                    <a href="/privacidade" target="_blank" className="text-[#0E8A47] hover:underline">
                      Política de Privacidade
                    </a>.
                  </span>
                </label>
                {err && <p className="text-[12px] text-[#C2434A] font-medium">{err}</p>}
                <button
                  onClick={submit}
                  disabled={sending}
                  className="w-full mt-2 py-2.5 rounded-xl text-white font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-60"
                  style={{ background: "linear-gradient(100deg,#0E8A47,#2F80ED)" }}
                >
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
  const [checkingOut, setCheckingOut] = useState(null);
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
    <section id="planos" className="bg-[#F5F6F8] py-24">
      <div className="container-x">
        <div className="max-w-2xl mx-auto text-center mb-14">
          <div className="inline-flex items-center gap-2 font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] text-[#0E8A47] mb-4">
            <span className="size-1.5 rounded-full bg-[#0E8A47] animate-pulse" />
            Planos transparentes
          </div>
          <h2 className="text-[30px] sm:text-[42px] font-bold leading-[1.1] tracking-[-0.02em] text-[#0A1020]">
            7 dias pra testar.
            <br />
            Sem surpresa depois.
          </h2>
          <p className="mt-4 text-[17px] leading-relaxed text-[#4B5565]">
            Cartão pedido no cadastro, mas a cobrança só entra depois do 7º dia de uso. Cancele quando quiser.
          </p>
        </div>

        {/* Cards de plano */}
        <div className="grid md:grid-cols-2 gap-5 max-w-4xl mx-auto items-start">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`relative rounded-[22px] p-8 border ${
                p.highlighted
                  ? "border-[#BFE8D2] shadow-[0_24px_54px_-28px_rgba(14,138,71,0.5)]"
                  : "border-[#E9ECF1] bg-white shadow-[0_4px_16px_-10px_rgba(10,16,32,0.16)]"
              }`}
              style={
                p.highlighted
                  ? { background: "linear-gradient(160deg,#F2FBF6 0%,#FFFFFF 62%)" }
                  : undefined
              }
            >
              {p.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#0E8A47] text-white text-[11.5px] font-bold px-4 py-1 rounded-full shadow-[0_8px_20px_-8px_rgba(14,138,71,0.7)] whitespace-nowrap">
                  {p.badge}
                </div>
              )}

              <div className="text-[15px] font-semibold text-[#0A1020]">{p.name}</div>
              <div className="text-[13px] text-[#8A94A6] mt-0.5">{p.tagline}</div>

              <div className="mt-5 flex items-baseline gap-1">
                <span className="text-[38px] font-bold tracking-[-0.03em] text-[#0A1020]">{p.price}</span>
                {p.period && <span className="text-[#8A94A6] text-[15px] ml-1">{p.period}</span>}
              </div>

              <p className="mt-3 text-[14.5px] leading-relaxed text-[#4B5565]">{p.desc}</p>

              <button
                onClick={() => subscribe(p.id)}
                disabled={!!checkingOut}
                className={`w-full mt-6 inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-[14.5px] font-semibold transition-all duration-150 disabled:opacity-60 ${
                  p.highlighted
                    ? "bg-[#0E8A47] text-white hover:bg-[#0B7239] shadow-[0_10px_26px_rgba(14,138,71,0.28)]"
                    : "bg-white text-[#0E8A47] border border-[#D2F0E0] hover:bg-[#EAF7F0]"
                }`}
              >
                {checkingOut === p.id ? "Abrindo pagamento..." : `${p.cta} →`}
              </button>

              {checkoutErr && checkingOut === null && (
                <p className="mt-3 text-center text-[12px] text-[#C2434A] font-medium">{checkoutErr}</p>
              )}

              <div className="mt-3 text-center text-[11.5px] text-[#8A94A6] leading-relaxed">{p.trial}</div>

              {p.highlighted && (
                <div className="mt-2 text-center text-[12.5px]">
                  <button onClick={() => setShowModal(true)} className="text-[#0E8A47] hover:text-[#0B7239] hover:underline">
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
            <h3 className="text-[24px] font-bold text-[#0A1020]">Compare os planos</h3>
            <p className="text-[#8A94A6] text-[14px] mt-2">Tudo que vem em cada um — sem surpresa</p>
          </div>
          <div className="rounded-[20px] bg-white border border-[#E9ECF1] overflow-hidden shadow-[0_10px_30px_-22px_rgba(10,16,32,0.25)]">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] border-separate border-spacing-0">
                <thead>
                  <tr>
                    <th className="text-left px-5 py-4 font-mono text-[10px] uppercase tracking-[0.12em] text-[#8A94A6] font-semibold bg-[#F5F6F8] border-b border-[#E9ECF1]">
                      Recurso
                    </th>
                    <th className="px-5 py-4 font-mono text-[10px] uppercase tracking-[0.12em] text-[#8A94A6] font-semibold bg-[#F5F6F8] border-b border-[#E9ECF1]">
                      Starter
                    </th>
                    <th className="px-5 py-4 text-center bg-[#EAFBF1] border-b border-[#D2F0E0] border-l-2 border-l-[#D2F0E0]">
                      <div className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-[#0E8A47] font-bold">
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

        {/* Selos */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-[12.5px] text-[#5A6474]">
          {["Proposta personalizada", "Sem fidelidade"].map((label) => (
            <span key={label} className="inline-flex items-center gap-2">
              <CircleCheck className="size-4 text-[#0E8A47]" strokeWidth={2.25} />
              {label}
            </span>
          ))}
          <span className="inline-flex items-center gap-2">
            <ShieldCheck className="size-4 text-[#0E8A47]" strokeWidth={2.25} />
            LGPD compliant
          </span>
          <span className="inline-flex items-center gap-2">
            <Headset className="size-4 text-[#0E8A47]" strokeWidth={2.25} />
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
        <td colSpan={2} className="px-5 pt-6 pb-2">
          <div className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-[#98A1B0]">
            {group.category}
          </div>
        </td>
        <td className="px-5 pt-6 pb-2 bg-[#F7FDFA] border-l-2 border-l-[#D2F0E0]" />
      </tr>
      {group.items.map((f) => (
        <tr key={f.label} className="group">
          <td className="px-5 py-3.5 text-[14px] text-[#3A4553] border-b border-[#EDEFF3]">
            <span className="inline-flex items-center gap-2.5">
              <f.icon className="size-4 text-[#98A1B0] group-hover:text-[#0E8A47] transition-colors shrink-0" strokeWidth={2} />
              {f.label}
            </span>
          </td>
          <td className="px-5 py-3.5 text-center text-[14px] border-b border-[#EDEFF3]">
            <Cell value={f.starter} />
          </td>
          <td className="px-5 py-3.5 text-center text-[14px] bg-[#F7FDFA] border-b border-[#E4F4EA] border-l-2 border-l-[#D2F0E0]">
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
          highlighted ? "size-7 bg-[#0E8A47] text-white" : "size-6 bg-[#EAFBF1] text-[#0E8A47]"
        }`}
      >
        <Check className={highlighted ? "size-4" : "size-3.5"} strokeWidth={3} />
      </span>
    );
  }
  if (value === false) {
    return (
      <span className="inline-flex items-center justify-center size-6 rounded-full bg-[#EDEFF3] text-[#98A1B0]">
        <Minus className="size-3.5" strokeWidth={2.5} />
      </span>
    );
  }
  return <span className={`font-medium ${highlighted ? "text-[#0E8A47]" : "text-[#3A4553]"}`}>{value}</span>;
}

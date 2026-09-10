"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Plus, Trash2, Sparkles, Lock, MessageSquareText, HelpCircle } from "lucide-react";
import Topbar from "../../../components/dashboard/Topbar";
import { api } from "../../../lib/api";
import { DashButton, DashIconButton, DashSkeletonBar } from "../../../components/dashboard/DashUI";
import { dashHeaderIconStyle, DASH_ACCENT } from "../../../components/dashboard/dashTheme";

const VIOLET = DASH_ACCENT.violet; // #6D3BEA — acento exclusivo da tela Agente de IA

function UpsellCard() {
  return (
    <div className="max-w-lg mx-auto text-center py-16 px-6">
      <div className="size-14 mx-auto rounded-2xl flex items-center justify-center mb-5" style={dashHeaderIconStyle(VIOLET)}>
        <Lock className="size-6" />
      </div>
      <h2 className="text-lg font-bold text-dash-ink">O Agente de IA é exclusivo do plano Pro</h2>
      <p className="mt-2 text-sm text-dash-muted leading-relaxed">
        Treine um agente com instruções e perguntas frequentes do seu negócio, e deixe ele
        responder sozinho no WhatsApp — 24 horas por dia, sem precisar de alguém online.
      </p>
      <a href="/dashboard/configuracoes" className="dash-btn-primary mt-6 inline-flex">
        <Sparkles className="size-4" /> Ver plano Pro
      </a>
    </div>
  );
}

export default function AgenteIaPage() {
  const [loading, setLoading] = useState(true);
  const [blocked, setBlocked] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [instructions, setInstructions] = useState("");
  const [faqs, setFaqs] = useState([]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null); // { type: 'ok'|'err', text }

  useEffect(() => {
    api("/api/ai-agent")
      .then((d) => {
        setEnabled(!!d.enabled);
        setInstructions(d.instructions || "");
        setFaqs(Array.isArray(d.faqs) && d.faqs.length ? d.faqs : [{ question: "", answer: "" }]);
      })
      .catch((e) => {
        if (e.message?.includes("exclusivo do plano Pro")) setBlocked(true);
      })
      .finally(() => setLoading(false));
  }, []);

  function updateFaq(i, key, value) {
    setFaqs((prev) => prev.map((f, idx) => (idx === i ? { ...f, [key]: value } : f)));
  }
  function addFaq() {
    setFaqs((prev) => [...prev, { question: "", answer: "" }]);
  }
  function removeFaq(i) {
    setFaqs((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function save() {
    setSaving(true);
    setMsg(null);
    try {
      const cleanFaqs = faqs.filter((f) => f.question.trim() && f.answer.trim());
      const r = await api("/api/ai-agent", {
        method: "PUT",
        body: { enabled, instructions, faqs: cleanFaqs },
      });
      setFaqs(r.faqs?.length ? r.faqs : [{ question: "", answer: "" }]);
      setMsg({ type: "ok", text: "Agente atualizado. As mudanças já valem pra próxima mensagem recebida." });
    } catch (e) {
      setMsg({ type: "err", text: e.message || "Não consegui salvar agora. Tente de novo." });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <>
        <Topbar title="Agente de IA" subtitle="Treine e ative seu atendente automático" />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="dash-card space-y-3">
              <DashSkeletonBar w="40%" h="14px" />
              <DashSkeletonBar w="100%" h="80px" />
            </div>
          ))}
        </div>
      </>
    );
  }

  if (blocked) {
    return (
      <>
        <Topbar title="Agente de IA" subtitle="Treine e ative seu atendente automático" />
        <UpsellCard />
      </>
    );
  }

  return (
    <>
      <Topbar title="Agente de IA" subtitle="Treine e ative seu atendente automático" />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* Ativar/desativar */}
        <div className="dash-card flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl flex items-center justify-center shrink-0" style={dashHeaderIconStyle(VIOLET)}>
              <Bot className="size-5" />
            </div>
            <div>
              <h2 className="font-semibold text-sm text-dash-ink">Agente ativo</h2>
              <p className="text-xs text-dash-faint mt-0.5">
                {enabled ? "Respondendo sozinho no WhatsApp agora." : "Desativado — ninguém responde automaticamente."}
              </p>
            </div>
          </div>
          <button
            onClick={() => setEnabled((v) => !v)}
            className={`relative w-12 h-7 rounded-full transition-colors shrink-0 ${enabled ? "bg-dash-green" : "bg-dash-border"}`}
            aria-pressed={enabled}
          >
            <motion.span
              layout
              transition={{ type: "spring", stiffness: 500, damping: 35 }}
              className="absolute top-1 size-5 rounded-full bg-white shadow"
              style={{ left: enabled ? "calc(100% - 24px)" : "4px" }}
            />
          </button>
        </div>

        {/* Instruções */}
        <div className="dash-card">
          <div className="flex items-center gap-2 mb-1">
            <MessageSquareText className="size-4" style={{ color: VIOLET }} />
            <h2 className="font-semibold text-dash-ink">Como ele deve responder</h2>
          </div>
          <p className="text-xs text-dash-faint mb-4">
            Descreva o tom, as regras e o que ele pode ou não falar. Ex: "Você é atendente da Ótica
            Bela Vista. Seja simpático e objetivo. Nunca dê desconto sem confirmar com o dono."
          </p>
          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            rows={6}
            maxLength={4000}
            placeholder="Descreva a personalidade e as regras do seu agente..."
            className="w-full rounded-[13px] px-4 py-3 text-sm text-dash-ink placeholder:text-dash-placeholder outline-none transition-colors resize-y"
            style={{ background: "#F5F2FE", border: `1px solid ${VIOLET}33` }}
            onFocus={(e) => (e.target.style.borderColor = VIOLET)}
            onBlur={(e) => (e.target.style.borderColor = `${VIOLET}33`)}
          />
          <div className="mt-1.5 text-right text-[11px] text-dash-faint2">{instructions.length}/4000</div>
        </div>

        {/* FAQs */}
        <div className="dash-card">
          <div className="flex items-center gap-2 mb-1">
            <HelpCircle className="size-4" style={{ color: VIOLET }} />
            <h2 className="font-semibold text-dash-ink">Perguntas frequentes</h2>
          </div>
          <p className="text-xs text-dash-faint mb-4">
            Ensine as respostas certas pras perguntas que seus clientes mais fazem.
          </p>
          <div className="space-y-4">
            {faqs.map((f, i) => (
              <div key={i} className="rounded-xl p-4 relative" style={{ background: "#F5F2FE", border: `1px solid ${VIOLET}33` }}>
                {faqs.length > 1 && (
                  <DashIconButton
                    onClick={() => removeFaq(i)}
                    className="absolute top-3 right-3 !w-7 !h-7 hover:!text-dash-red hover:!border-dash-red/30"
                  >
                    <Trash2 className="size-3.5" />
                  </DashIconButton>
                )}
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-dash-faint2 mb-1.5">Pergunta</label>
                <input
                  value={f.question}
                  onChange={(e) => updateFaq(i, "question", e.target.value)}
                  placeholder="Ex: Vocês fazem entrega?"
                  className="dash-input mb-3"
                />
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-dash-faint2 mb-1.5">Resposta</label>
                <textarea
                  value={f.answer}
                  onChange={(e) => updateFaq(i, "answer", e.target.value)}
                  rows={2}
                  placeholder="Ex: Sim! Entregamos em toda a cidade, frete grátis acima de R$ 100."
                  className="dash-input resize-y"
                />
              </div>
            ))}
          </div>
          <button
            onClick={addFaq}
            className="mt-4 inline-flex items-center gap-2 text-sm hover:underline font-medium"
            style={{ color: VIOLET }}
          >
            <Plus className="size-4" /> Adicionar pergunta
          </button>
        </div>

        <AnimatePresence>
          {msg && (
            <motion.div
              initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className={`text-sm px-4 py-3 rounded-xl border ${
                msg.type === "ok"
                  ? "bg-dash-green/10 border-dash-green/25 text-dash-green"
                  : "bg-dash-red/10 border-dash-red/20 text-dash-red"
              }`}
            >
              {msg.text}
            </motion.div>
          )}
        </AnimatePresence>

        <DashButton onClick={save} loading={saving} className="w-full sm:w-auto">
          {saving ? "Salvando..." : "Salvar agente"}
        </DashButton>
      </div>
    </>
  );
}

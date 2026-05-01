"use client";
import { useEffect, useState } from "react";
import Topbar from "../../../components/dashboard/Topbar";
import { Field, Input, Textarea, Button } from "../../../components/ui/Field";
import { api } from "../../../lib/api";

export default function Automacao() {
  const [enabled, setEnabled] = useState(false);
  const [welcome, setWelcome] = useState("");
  const [rules, setRules] = useState([{ keyword: "", reply: "" }]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api("/api/chatbot/config").then((c) => {
      if (!c) return;
      setEnabled(!!c.enabled);
      setWelcome(c.welcome_message || c.welcomeMessage || "");
      const r = c.rules || c.responses || [];
      setRules(r.length ? r.map(x => ({ keyword: x.keyword || x.trigger || "", reply: x.reply || x.response || "" })) : [{ keyword: "", reply: "" }]);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  function updateRule(i, key, value) {
    setRules((rs) => rs.map((r, idx) => idx === i ? { ...r, [key]: value } : r));
  }
  function addRule() { setRules((rs) => [...rs, { keyword: "", reply: "" }]); }
  function removeRule(i) { setRules((rs) => rs.filter((_, idx) => idx !== i)); }

  async function save() {
    setSaving(true); setSaved(false);
    try {
      await api("/api/chatbot/config", {
        method: "POST",
        body: { enabled, welcome_message: welcome, rules: rules.filter(r => r.keyword && r.reply) },
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      alert(e.message || "Falha ao salvar");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return (
    <>
      <Topbar title="Automação" />
      <div className="p-12 flex justify-center"><div className="size-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
    </>
  );

  return (
    <>
      <Topbar
        title="Automação"
        subtitle="Atenda clientes 24h sem precisar estar online"
        actions={<Button loading={saving} onClick={save}>{saved ? "✓ Salvo" : "Salvar"}</Button>}
      />
      <div className="p-6 lg:p-8 space-y-5 max-w-4xl">
        <div className="card p-5 flex items-center gap-4">
          <div className="size-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-2xl">🤖</div>
          <div className="flex-1">
            <div className="font-semibold">Atendimento automático</div>
            <div className="text-sm text-ink-300">Quando ativo, o sistema responde sozinho aos seus contatos</div>
          </div>
          <Toggle checked={enabled} onChange={setEnabled} />
        </div>

        <Block num={1} title="Mensagem inicial" desc="Primeira mensagem enviada quando alguém te chamar pela primeira vez">
          <Field>
            <Textarea
              value={welcome}
              onChange={(e) => setWelcome(e.target.value)}
              placeholder="Olá! 👋 Recebemos seu contato. Em instantes alguém da nossa equipe vai te responder. Como posso te ajudar?"
            />
          </Field>
        </Block>

        <Block num={2} title="Respostas automáticas" desc="Quando o cliente enviar uma palavra-chave, o sistema responde automaticamente">
          <div className="space-y-3">
            {rules.map((r, i) => (
              <div key={i} className="card p-4 bg-bg/40 grid md:grid-cols-[1fr_2fr_auto] gap-3 items-start">
                <Field label="Palavra-chave">
                  <Input value={r.keyword} onChange={(e) => updateRule(i, "keyword", e.target.value)} placeholder="preço, horário..." />
                </Field>
                <Field label="Resposta automática">
                  <Textarea value={r.reply} onChange={(e) => updateRule(i, "reply", e.target.value)} className="min-h-[60px]" placeholder="Nosso atendimento é de seg a sex das 9h às 18h." />
                </Field>
                <button onClick={() => removeRule(i)} className="mt-7 size-9 rounded-lg text-ink-500 hover:text-red-400 hover:bg-red-500/10 flex items-center justify-center" title="Remover">✕</button>
              </div>
            ))}
            <Button variant="ghost" onClick={addRule}>+ Adicionar resposta</Button>
          </div>
        </Block>

        <div className="card p-5 bg-gradient-to-br from-accent-blue/[0.05] to-card border-accent-blue/20">
          <div className="flex items-start gap-3">
            <div className="text-2xl">💡</div>
            <div className="text-sm text-ink-300">
              <strong className="text-ink-100">Dica:</strong> Use a mensagem inicial pra confirmar o recebimento e ganhar tempo.
              Use respostas automáticas pra perguntas frequentes (preço, horário, localização) e libere sua equipe pra fechar venda.
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function Block({ num, title, desc, children }) {
  return (
    <div className="card p-6">
      <div className="flex items-start gap-4 mb-5">
        <div className="size-8 rounded-lg bg-primary text-bg font-bold flex items-center justify-center text-sm shrink-0">{num}</div>
        <div>
          <div className="font-semibold">{title}</div>
          <div className="text-sm text-ink-300 mt-0.5">{desc}</div>
        </div>
      </div>
      {children}
    </div>
  );
}

function Toggle({ checked, onChange }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors ${checked ? "bg-primary" : "bg-white/10"}`}
    >
      <span className={`absolute top-0.5 size-5 rounded-full bg-white shadow-md transition-all ${checked ? "left-[22px]" : "left-0.5"}`} />
    </button>
  );
}

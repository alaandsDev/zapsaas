"use client";
import { useEffect, useState } from "react";
import { api } from "../../../lib/api";

export default function WppOficialPage() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  // form
  const [phoneNumberId, setPhoneNumberId] = useState("");
  const [businessAccountId, setBusinessAccountId] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [verifyToken, setVerifyToken] = useState("");
  const [appSecret, setAppSecret] = useState("");

  // teste
  const [testTo, setTestTo] = useState("");
  const [testTemplate, setTestTemplate] = useState("");
  const [testVars, setTestVars] = useState("");
  const [templates, setTemplates] = useState([]);

  async function load() {
    setLoading(true);
    try {
      const c = await api("/api/wpp-cloud/config");
      setConfig(c);
      if (c) {
        setPhoneNumberId(c.phone_number_id || "");
        setBusinessAccountId(c.business_account_id || "");
        setVerifyToken(c.webhook_verify_token || "");
      }
    } catch {} finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function loadTemplates() {
    try {
      const t = await api("/api/wpp-cloud/templates");
      setTemplates(t);
    } catch (e) { setErr(e.message); }
  }
  useEffect(() => { if (config) loadTemplates(); }, [config]);

  async function save(e) {
    e?.preventDefault();
    setErr(""); setOk(""); setSaving(true);
    try {
      const body = {
        phone_number_id: phoneNumberId.trim(),
        business_account_id: businessAccountId.trim() || null,
        webhook_verify_token: verifyToken.trim(),
        app_secret: appSecret.trim() || null,
      };
      if (accessToken.trim()) body.access_token = accessToken.trim();
      else if (!config) return setErr("Token obrigatório na primeira configuração");

      // Se já existe e usuário não inseriu novo token, usa um placeholder não-vazio (backend só atualiza se enviado)
      if (!body.access_token) {
        // Backend exige access_token sempre; manda o atual? Não temos, usuário precisa colar. Aviso:
        return setErr("Cole o access_token novamente para atualizar (não fica salvo na tela por segurança)");
      }
      await api("/api/wpp-cloud/config", { method: "POST", body });
      setOk("✅ Credenciais validadas e salvas");
      setAccessToken("");
      setAppSecret("");
      load();
    } catch (e) { setErr(e.message); } finally { setSaving(false); }
  }

  async function sendTest() {
    setErr(""); setOk("");
    try {
      const variables = testVars.split(",").map((v) => v.trim()).filter(Boolean);
      const r = await api("/api/wpp-cloud/test", {
        method: "POST",
        body: { to: testTo, template: testTemplate, variables }
      });
      setOk(`✅ Enviado · wamid: ${r.messages?.[0]?.id || "—"}`);
    } catch (e) { setErr(e.message); }
  }

  const webhookUrl = typeof window !== "undefined"
    ? `${process.env.NEXT_PUBLIC_API_URL || "https://delivery-full-production.up.railway.app"}/api/wpp-cloud/webhook`
    : "";

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">WhatsApp Oficial (Cloud API)</h1>
        <p className="text-ink-300 mt-1">Disparos em massa via API oficial da Meta — sem risco de banimento, escala ilimitada.</p>
      </header>

      {loading ? (
        <div className="text-ink-400 text-center py-20">Carregando...</div>
      ) : (
        <>
          {/* Status */}
          <section className="card p-5 mb-6">
            {config ? (
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="size-2.5 rounded-full bg-primary animate-pulse" />
                    <div className="font-semibold">Conectado</div>
                  </div>
                  <div className="text-sm text-ink-300 mt-1">
                    {config.verified_name || "—"} · {config.display_phone || "—"}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-ink-300">⚪ Não configurado. Preencha as credenciais Meta abaixo.</div>
            )}
          </section>

          {/* Credenciais */}
          <section className="card p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Credenciais Meta</h2>
            <form onSubmit={save} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Phone Number ID *">
                  <input value={phoneNumberId} onChange={(e) => setPhoneNumberId(e.target.value)} required className={input} placeholder="1234567890" />
                </Field>
                <Field label="Business Account ID">
                  <input value={businessAccountId} onChange={(e) => setBusinessAccountId(e.target.value)} className={input} placeholder="opcional, mas precisa pra listar templates" />
                </Field>
              </div>
              <Field label="Access Token (System User permanente) *" hint="Não fica visível depois — guarde em local seguro">
                <input type="password" value={accessToken} onChange={(e) => setAccessToken(e.target.value)} className={input} placeholder={config?.has_token ? "••••••• (preencha pra atualizar)" : "EAAxxxxxx..."} />
              </Field>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Webhook Verify Token *" hint="String custom — Meta usa pra validar webhook">
                  <input value={verifyToken} onChange={(e) => setVerifyToken(e.target.value)} required className={input} placeholder="ex: zapflow_secreto_123" />
                </Field>
                <Field label="App Secret (HMAC)" hint="Opcional, valida assinatura do webhook">
                  <input type="password" value={appSecret} onChange={(e) => setAppSecret(e.target.value)} className={input} placeholder={config?.has_app_secret ? "••••••• (preencha pra atualizar)" : "do app Meta"} />
                </Field>
              </div>
              {err && <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{err}</div>}
              {ok && <div className="text-sm text-primary bg-primary/10 border border-primary/20 rounded-xl px-4 py-3">{ok}</div>}
              <button type="submit" disabled={saving} className="px-5 py-2.5 rounded-xl bg-primary text-bg font-semibold hover:opacity-90 disabled:opacity-50">
                {saving ? "Validando com Meta..." : "💾 Salvar e validar"}
              </button>
            </form>
          </section>

          {/* Webhook URL */}
          <section className="card p-6 mb-6">
            <h2 className="text-xl font-semibold mb-2">URL do Webhook (configure no Meta)</h2>
            <p className="text-sm text-ink-400 mb-3">No painel Meta → WhatsApp → Configuration → Webhooks → Edit, cole:</p>
            <code className="block bg-bg/60 border border-white/10 rounded-lg px-4 py-3 text-sm break-all">{webhookUrl}</code>
            <p className="text-xs text-ink-400 mt-2">Use o mesmo "Verify Token" que você cadastrou acima. Inscreva nos campos: <code>messages</code> e <code>message_template_status_update</code>.</p>
          </section>

          {/* Teste */}
          {config && (
            <section className="card p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Testar envio de template</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Para (com DDD)">
                  <input value={testTo} onChange={(e) => setTestTo(e.target.value)} className={input} placeholder="11987654321" />
                </Field>
                <Field label="Nome do template">
                  <select value={testTemplate} onChange={(e) => setTestTemplate(e.target.value)} className={input}>
                    <option value="">Selecione...</option>
                    {templates.filter(t => t.status === 'APPROVED').map(t => (
                      <option key={t.id || t.name} value={t.name}>{t.name} ({t.language})</option>
                    ))}
                  </select>
                </Field>
              </div>
              <Field label="Variáveis do body (separadas por vírgula)" hint="Ex: João,40%,sexta">
                <input value={testVars} onChange={(e) => setTestVars(e.target.value)} className={input} placeholder="opcional" />
              </Field>
              <button onClick={sendTest} className="mt-4 px-5 py-2.5 rounded-xl bg-primary text-bg font-semibold hover:opacity-90">
                🚀 Enviar teste
              </button>
              {!templates.length && (
                <p className="text-sm text-ink-400 mt-3">Nenhum template encontrado. Crie e aguarde aprovação no painel Meta (ou conecte o Business Account ID acima).</p>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}

const input = "mt-1 w-full bg-bg/60 border border-white/10 rounded-xl px-4 py-2.5 outline-none focus:border-primary text-sm";
const Field = ({ label, hint, children }) => (
  <div>
    <label className="text-xs text-ink-400 uppercase tracking-wider">{label}</label>
    {children}
    {hint && <div className="text-xs text-ink-500 mt-1">{hint}</div>}
  </div>
);

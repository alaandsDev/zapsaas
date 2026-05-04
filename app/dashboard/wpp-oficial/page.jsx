"use client";
import { useEffect, useState } from "react";
import { api } from "../../../lib/api";
import Topbar from "../../../components/dashboard/Topbar";

const WEBHOOK_URL = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL}/api/wpp-cloud/webhook`
  : "https://delivery-full-production.up.railway.app/api/wpp-cloud/webhook";

const STEPS = [
  {
    n: 1,
    title: "Criar conta no Meta for Developers",
    icon: "🌐",
    content: (
      <div className="space-y-3 text-sm text-ink-300">
        <p>Acesse <a href="https://developers.facebook.com" target="_blank" className="text-primary underline">developers.facebook.com</a> e faça login com sua conta Facebook/Meta.</p>
        <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4 space-y-2">
          <p className="font-semibold text-ink-100">No painel, clique em:</p>
          <p>1. <b>"Meus apps"</b> → <b>"Criar app"</b></p>
          <p>2. Escolha <b>"Business"</b> como tipo do app</p>
          <p>3. Dê um nome (ex: <b>ZapFlow Bot</b>) e clique em <b>Criar app</b></p>
        </div>
      </div>
    ),
  },
  {
    n: 2,
    title: "Adicionar produto WhatsApp ao app",
    icon: "💬",
    content: (
      <div className="space-y-3 text-sm text-ink-300">
        <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4 space-y-2">
          <p>Dentro do app criado:</p>
          <p>1. No menu lateral clique em <b>"Adicionar produto"</b></p>
          <p>2. Encontre <b>WhatsApp</b> e clique em <b>"Configurar"</b></p>
          <p>3. Associe a uma <b>conta do Business Manager</b> (ou crie uma nova)</p>
        </div>
        <p>Após adicionar, vá em <b>WhatsApp → Introdução</b> no menu lateral.</p>
      </div>
    ),
  },
  {
    n: 3,
    title: "Obter Phone Number ID e Token",
    icon: "🔑",
    content: (
      <div className="space-y-3 text-sm text-ink-300">
        <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4 space-y-2">
          <p>Em <b>WhatsApp → Introdução</b>:</p>
          <p>1. Em <b>"De:"</b> selecione ou adicione seu número de telefone</p>
          <p>2. Copie o <b>Phone Number ID</b> exibido abaixo do número</p>
          <p>3. Copie o <b>ID da conta do WhatsApp Business</b> (WABA ID)</p>
          <p>4. Copie o <b>Token de acesso temporário</b> (válido 24h)</p>
        </div>
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-4 py-3 text-yellow-300 text-xs">
          ⚠️ O token temporário expira em 24h. Para produção, crie um <b>System User permanente</b> (passo 4).
        </div>
      </div>
    ),
  },
  {
    n: 4,
    title: "Criar System User permanente (recomendado)",
    icon: "👤",
    content: (
      <div className="space-y-3 text-sm text-ink-300">
        <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4 space-y-2">
          <p>No <a href="https://business.facebook.com" target="_blank" className="text-primary underline">Meta Business Suite</a>:</p>
          <p>1. <b>Configurações</b> → <b>Usuários</b> → <b>Usuários do sistema</b></p>
          <p>2. Clique em <b>"Adicionar"</b> → nome: <b>ZapFlow</b> → função: <b>Admin</b></p>
          <p>3. Clique em <b>"Gerar novo token"</b></p>
          <p>4. Selecione seu app → marque <b>whatsapp_business_messaging</b> e <b>whatsapp_business_management</b></p>
          <p>5. Clique em <b>"Gerar token"</b> e copie — esse token <b>não expira</b></p>
        </div>
      </div>
    ),
  },
  {
    n: 5,
    title: "Configurar Webhook",
    icon: "🔗",
    content: (
      <div className="space-y-3 text-sm text-ink-300">
        <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4 space-y-2">
          <p>Em <b>WhatsApp → Configuração</b> no painel do app:</p>
          <p>1. Em <b>Webhooks</b>, clique em <b>"Editar"</b></p>
          <p>2. Cole a URL do webhook abaixo:</p>
        </div>
        <div className="flex items-center gap-2 bg-bg border border-white/15 rounded-xl px-4 py-3">
          <code className="text-xs text-primary flex-1 break-all">{WEBHOOK_URL}</code>
          <button
            onClick={() => navigator.clipboard.writeText(WEBHOOK_URL)}
            className="text-xs px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-ink-200 flex-shrink-0 transition-colors"
          >
            Copiar
          </button>
        </div>
        <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4 space-y-2">
          <p>3. Em <b>Verify Token</b>, cole o mesmo token que você definir no formulário abaixo</p>
          <p>4. Clique em <b>"Verificar e salvar"</b></p>
          <p>5. Em <b>Campos do webhook</b>, ative: <b>messages</b></p>
        </div>
      </div>
    ),
  },
  {
    n: 6,
    title: "Preencher credenciais abaixo e salvar",
    icon: "✅",
    content: (
      <div className="text-sm text-ink-300">
        <p>Com todos os dados em mãos, preencha o formulário abaixo e clique em <b>"Salvar e validar"</b>. O sistema vai verificar as credenciais com a Meta em tempo real.</p>
      </div>
    ),
  },
];

export default function WppOficialPage() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const [openStep, setOpenStep] = useState(null);

  const [phoneNumberId, setPhoneNumberId] = useState("");
  const [businessAccountId, setBusinessAccountId] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [verifyToken, setVerifyToken] = useState("");
  const [appSecret, setAppSecret] = useState("");

  const [testTo, setTestTo] = useState("");
  const [testTemplate, setTestTemplate] = useState("");
  const [testVars, setTestVars] = useState("");
  const [templates, setTemplates] = useState([]);
  const [testing, setTesting] = useState(false);

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

  useEffect(() => {
    if (config?.has_token && config?.business_account_id) {
      api("/api/wpp-cloud/templates").then(setTemplates).catch(() => {});
    }
  }, [config]);

  async function save(e) {
    e?.preventDefault();
    setErr(""); setOk(""); setSaving(true);
    try {
      const body = {
        phone_number_id: phoneNumberId.trim(),
        business_account_id: businessAccountId.trim() || null,
        webhook_verify_token: verifyToken.trim() || "zapflow_webhook",
        app_secret: appSecret.trim() || null,
      };
      if (accessToken.trim()) {
        body.access_token = accessToken.trim();
      } else if (!config?.has_token) {
        return setErr("Access Token é obrigatório na primeira configuração");
      } else {
        return setErr("Cole o Access Token novamente para atualizar (não fica visível por segurança)");
      }
      await api("/api/wpp-cloud/config", { method: "POST", body });
      setOk("✅ Credenciais validadas e salvas com sucesso!");
      setAccessToken("");
      setAppSecret("");
      load();
    } catch (e) { setErr(e.message); } finally { setSaving(false); }
  }

  async function sendTest() {
    setErr(""); setOk(""); setTesting(true);
    try {
      const variables = testVars.split(",").map(v => v.trim()).filter(Boolean);
      const r = await api("/api/wpp-cloud/test", {
        method: "POST",
        body: { to: testTo, template: testTemplate, variables },
      });
      setOk(`✅ Enviado! ID: ${r.messages?.[0]?.id || "—"}`);
    } catch (e) { setErr(e.message); } finally { setTesting(false); }
  }

  async function disconnect() {
    if (!confirm("Remover a configuração da API Meta? Você precisará reconfigurar.")) return;
    try {
      await api("/api/wpp-cloud/config", { method: "DELETE" });
      setConfig(null);
      setPhoneNumberId(""); setBusinessAccountId(""); setVerifyToken("");
      setOk("Configuração removida.");
    } catch (e) { setErr(e.message); }
  }

  if (loading) return (
    <>
      <Topbar title="WhatsApp Oficial" subtitle="API oficial da Meta — sem risco de banimento" />
      <div className="flex items-center justify-center py-32 text-ink-400">Carregando...</div>
    </>
  );

  return (
    <>
      <Topbar title="WhatsApp Oficial (API Meta)" subtitle="Configure sua própria API para disparos oficiais sem risco de banimento" />
      <div className="p-6 lg:p-8 max-w-4xl space-y-6">

        {/* STATUS BANNER */}
        {config ? (
          <div className="rounded-xl bg-primary/10 border border-primary/25 px-5 py-4 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="size-3 rounded-full bg-primary animate-pulse" />
              <div>
                <div className="font-semibold text-primary">API Meta Configurada</div>
                <div className="text-sm text-ink-300 mt-0.5">
                  {config.verified_name || "—"} · {config.display_phone || "—"} · Phone ID: <code className="text-xs">{config.phone_number_id}</code>
                </div>
              </div>
            </div>
            <button onClick={disconnect} className="text-xs px-3 py-1.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors">
              Remover configuração
            </button>
          </div>
        ) : (
          <div className="rounded-xl bg-yellow-500/10 border border-yellow-500/20 px-5 py-4 flex items-center gap-3">
            <span className="text-xl">⚠️</span>
            <div>
              <div className="font-semibold text-yellow-300">API Meta não configurada</div>
              <div className="text-sm text-ink-400 mt-0.5">Siga o guia abaixo para configurar sua conta. Cada usuário usa suas próprias credenciais.</div>
            </div>
          </div>
        )}

        {/* GUIA PASSO A PASSO */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-lg">📋 Guia de configuração passo a passo</h2>
            <button
              onClick={() => setOpenStep(openStep === "all" ? null : "all")}
              className="text-xs px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-ink-300 transition-colors"
            >
              {openStep === "all" ? "Recolher tudo" : "Expandir tudo"}
            </button>
          </div>

          <div className="space-y-2">
            {STEPS.map((step) => {
              const isOpen = openStep === step.n || openStep === "all";
              const isDone = config && step.n <= 5;
              return (
                <div key={step.n} className={`rounded-xl border transition-colors ${isOpen ? "border-primary/25 bg-primary/5" : "border-white/8 bg-white/[0.02]"}`}>
                  <button
                    className="w-full flex items-center gap-4 px-4 py-3.5 text-left"
                    onClick={() => setOpenStep(isOpen && openStep !== "all" ? null : step.n)}
                  >
                    <div className={`size-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0
                      ${isDone ? "bg-primary/20 text-primary" : "bg-white/10 text-ink-400"}`}>
                      {isDone ? "✓" : step.n}
                    </div>
                    <span className="text-lg">{step.icon}</span>
                    <span className="font-medium text-sm flex-1">{step.title}</span>
                    <span className={`text-ink-400 text-xs transition-transform ${isOpen ? "rotate-180" : ""}`}>▼</span>
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 pt-1 border-t border-white/[0.06]">
                      {step.content}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* FORMULÁRIO DE CREDENCIAIS */}
        <div className="card p-6">
          <h2 className="font-bold text-lg mb-5">🔐 Credenciais da API Meta</h2>
          <form onSubmit={save} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Phone Number ID *" hint="WhatsApp → Introdução → ID do número">
                <Input value={phoneNumberId} onChange={e => setPhoneNumberId(e.target.value)} placeholder="Ex: 1234567890123" required />
              </Field>
              <Field label="Business Account ID (WABA)" hint="Necessário para listar templates">
                <Input value={businessAccountId} onChange={e => setBusinessAccountId(e.target.value)} placeholder="Ex: 9876543210987" />
              </Field>
            </div>

            <Field label="Access Token *" hint="Token do System User permanente — não fica visível após salvar">
              <Input
                type="password"
                value={accessToken}
                onChange={e => setAccessToken(e.target.value)}
                placeholder={config?.has_token ? "••••••• (cole novamente para atualizar)" : "EAAxxxxxx..."}
              />
            </Field>

            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Webhook Verify Token *" hint="String que você define — Meta usa para validar o webhook">
                <Input
                  value={verifyToken}
                  onChange={e => setVerifyToken(e.target.value)}
                  placeholder="Ex: zapflow_meu_token_123"
                  required
                />
              </Field>
              <Field label="App Secret (opcional)" hint="Valida assinatura HMAC do webhook — recomendado">
                <Input
                  type="password"
                  value={appSecret}
                  onChange={e => setAppSecret(e.target.value)}
                  placeholder={config?.has_app_secret ? "••••••• (preencha para atualizar)" : "Do painel do app Meta"}
                />
              </Field>
            </div>

            <Field label="URL do Webhook (copie e cole no Meta)" hint="WhatsApp → Configuração → Webhooks → Editar">
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs bg-bg/60 border border-white/10 rounded-xl px-4 py-2.5 text-primary break-all">{WEBHOOK_URL}</code>
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(WEBHOOK_URL)}
                  className="px-3 py-2.5 rounded-xl bg-white/8 hover:bg-white/12 border border-white/10 text-ink-300 text-xs flex-shrink-0 transition-colors"
                >
                  📋 Copiar
                </button>
              </div>
            </Field>

            {err && <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{err}</div>}
            {ok && <div className="text-sm text-primary bg-primary/10 border border-primary/20 rounded-xl px-4 py-3">{ok}</div>}

            <div className="flex items-center gap-3">
              <button type="submit" disabled={saving} className="px-6 py-2.5 rounded-xl bg-primary text-bg font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center gap-2">
                {saving && <span className="size-4 border-2 border-bg border-t-transparent rounded-full animate-spin" />}
                {saving ? "Validando com Meta..." : "💾 Salvar e validar"}
              </button>
              {!config && (
                <span className="text-xs text-ink-500">O sistema verifica suas credenciais com a Meta antes de salvar</span>
              )}
            </div>
          </form>
        </div>

        {/* TEMPLATES E TESTE */}
        {config?.has_token && (
          <div className="card p-6">
            <h2 className="font-bold text-lg mb-5">🧪 Testar envio de template</h2>
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-3 text-sm text-blue-300 mb-5">
              💡 A API Meta só permite enviar <b>templates aprovados</b> para números que nunca interagiram com você. Para contatos que já enviaram mensagem nas últimas 24h, texto livre funciona normalmente.
            </div>
            <div className="space-y-4 max-w-lg">
              <Field label="Número destino (com DDI)">
                <Input value={testTo} onChange={e => setTestTo(e.target.value)} placeholder="5511987654321" />
              </Field>
              <Field label="Template">
                <select
                  value={testTemplate}
                  onChange={e => setTestTemplate(e.target.value)}
                  className="w-full bg-bg/60 border border-white/10 rounded-xl px-4 py-2.5 outline-none focus:border-primary text-sm"
                >
                  <option value="">Selecione um template...</option>
                  {templates.filter(t => t.status === "APPROVED").map(t => (
                    <option key={t.id || t.name} value={t.name}>{t.name} ({t.language})</option>
                  ))}
                </select>
                {!templates.length && (
                  <p className="text-xs text-ink-500 mt-1">Nenhum template aprovado encontrado. Crie em <a href="https://business.facebook.com" target="_blank" className="text-primary underline">Meta Business Suite</a>.</p>
                )}
              </Field>
              <Field label="Variáveis (separadas por vírgula)" hint="Ex: João, 20%, sexta-feira">
                <Input value={testVars} onChange={e => setTestVars(e.target.value)} placeholder="opcional" />
              </Field>
              {err && <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{err}</div>}
              {ok && <div className="text-sm text-primary bg-primary/10 border border-primary/20 rounded-xl px-4 py-3">{ok}</div>}
              <button
                onClick={sendTest}
                disabled={testing || !testTo || !testTemplate}
                className="px-5 py-2.5 rounded-xl bg-primary text-bg font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center gap-2"
              >
                {testing && <span className="size-4 border-2 border-bg border-t-transparent rounded-full animate-spin" />}
                {testing ? "Enviando..." : "🚀 Enviar teste"}
              </button>
            </div>
          </div>
        )}

        {/* DIFERENÇAS */}
        <div className="card p-6">
          <h2 className="font-bold text-lg mb-4">📊 Diferença entre os canais</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-2 pr-6 text-ink-400 font-medium"></th>
                  <th className="text-center py-2 px-4 text-ink-200 font-semibold">📱 WhatsApp (Baileys)</th>
                  <th className="text-center py-2 px-4 text-primary font-semibold">☁️ API Meta (Oficial)</th>
                </tr>
              </thead>
              <tbody className="text-ink-300">
                {[
                  ["Configuração", "QR Code", "Meta for Developers"],
                  ["Risco de banimento", "⚠️ Médio", "✅ Zero"],
                  ["Mensagem de texto livre", "✅ Sempre", "⚠️ Só janela 24h"],
                  ["Templates aprovados", "❌", "✅"],
                  ["Envio de mídia", "✅", "✅"],
                  ["Custo", "Grátis", "Pago pela Meta"],
                  ["Escala", "Moderada", "Alta"],
                  ["Número verificado", "❌", "✅"],
                ].map(([feature, baileys, cloud]) => (
                  <tr key={feature} className="border-b border-white/[0.04]">
                    <td className="py-2.5 pr-6 font-medium text-ink-200">{feature}</td>
                    <td className="py-2.5 px-4 text-center">{baileys}</td>
                    <td className="py-2.5 px-4 text-center">{cloud}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </>
  );
}

const Field = ({ label, hint, children }) => (
  <div>
    <label className="block text-xs text-ink-400 uppercase tracking-wider mb-1.5 font-medium">{label}</label>
    {children}
    {hint && <p className="text-xs text-ink-500 mt-1">{hint}</p>}
  </div>
);

const Input = ({ type = "text", ...props }) => (
  <input
    type={type}
    className="w-full bg-bg/60 border border-white/10 rounded-xl px-4 py-2.5 outline-none focus:border-primary text-sm transition-colors"
    {...props}
  />
);

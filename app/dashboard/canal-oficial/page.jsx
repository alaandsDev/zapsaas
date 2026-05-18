"use client";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck, KeyRound, Webhook, LayoutTemplate, BadgeCheck, Activity,
  Search, Plus, Copy, Check, X, Loader2, Gauge, Wallet, Plug, RefreshCw,
} from "lucide-react";
import { api } from "../../../lib/api";
import Topbar from "../../../components/dashboard/Topbar";

const WEBHOOK_URL = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL}/api/wpp-cloud/webhook`
  : "https://delivery-full-production.up.railway.app/api/wpp-cloud/webhook";

/* ── status / badges ── */
const TPL_STATUS = {
  APPROVED: { label: "Aprovado", color: "#00FF88" },
  PENDING:  { label: "Em análise", color: "#FBBF24" },
  REJECTED: { label: "Rejeitado", color: "#EF4444" },
  PAUSED:   { label: "Pausado", color: "#94A3B8" },
  DISABLED: { label: "Desativado", color: "#94A3B8" },
};
const QUALITY = {
  GREEN: { label: "Alta", color: "#00FF88" },
  YELLOW:{ label: "Média", color: "#FBBF24" },
  RED:   { label: "Baixa", color: "#EF4444" },
  UNKNOWN:{ label: "—", color: "#64748B" },
};
const CATEGORIES = ["MARKETING", "UTILITY", "AUTHENTICATION"];
const CAT_LABEL = { MARKETING: "Marketing", UTILITY: "Utility", AUTHENTICATION: "Authentication" };

// Preço estimado por conversa (R$) — ilustrativo, política Meta muda por país/categoria
const PRICE_BR = { MARKETING: 0.34, UTILITY: 0.04, AUTHENTICATION: 0.34 };
const COUNTRIES = [
  { code: "BR", label: "Brasil", mult: 1 },
  { code: "US", label: "Estados Unidos", mult: 0.07 / 0.34 },
  { code: "MX", label: "México", mult: 0.04 / 0.34 },
  { code: "IN", label: "Índia", mult: 0.011 / 0.34 },
];

const brl = (n) => Number(n || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function StatusCard({ icon: Icon, label, value, tint, sub }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3 }}
      className="glass p-4 relative overflow-hidden group"
    >
      <div className="absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
        style={{ boxShadow: `inset 0 0 0 1px ${tint}33, 0 0 26px -12px ${tint}55` }} />
      <div className="relative flex items-start justify-between">
        <div className="min-w-0">
          <div className="text-[11px] text-ink-400">{label}</div>
          <div className="text-base font-bold mt-1.5 truncate" style={{ color: tint }}>{value}</div>
          {sub && <div className="text-[10px] text-ink-500 mt-0.5 truncate">{sub}</div>}
        </div>
        <span className="size-8 rounded-lg flex items-center justify-center border shrink-0"
          style={{ background: `${tint}14`, borderColor: `${tint}30` }}>
          <Icon className="size-4" style={{ color: tint }} />
        </span>
      </div>
    </motion.div>
  );
}

const Field = ({ label, hint, children }) => (
  <div>
    <label className="block text-[11px] text-ink-400 uppercase tracking-wider mb-1.5 font-semibold">{label}</label>
    {children}
    {hint && <p className="text-[11px] text-ink-500 mt-1">{hint}</p>}
  </div>
);
const Input = ({ type = "text", ...p }) => (
  <input type={type}
    className="w-full bg-bg/60 border border-white/10 rounded-xl px-4 py-2.5 outline-none focus:border-primary/60 text-sm transition-colors placeholder:text-ink-600"
    {...p} />
);

export default function CanalOficialPage() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  const [phoneNumberId, setPhoneNumberId] = useState("");
  const [businessAccountId, setBusinessAccountId] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [verifyToken, setVerifyToken] = useState("");
  const [appSecret, setAppSecret] = useState("");

  const [templates, setTemplates] = useState(null);
  const [tplQ, setTplQ] = useState("");
  const [tplCat, setTplCat] = useState("");
  const [tplStatus, setTplStatus] = useState("");
  const [lastSync, setLastSync] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const [verify, setVerify] = useState(null); // {ok, display_phone, verified_name, quality_rating}
  const [testingConn, setTestingConn] = useState(false);
  const [copied, setCopied] = useState(false);

  // estimativa de custos
  const [estCountry, setEstCountry] = useState("BR");
  const [estCat, setEstCat] = useState("MARKETING");
  const [estQty, setEstQty] = useState(1000);

  async function loadConfig() {
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
  useEffect(() => { loadConfig(); }, []);

  const loadTemplates = () => {
    if (!(config?.has_token && config?.business_account_id)) return;
    api("/api/wpp-cloud/templates")
      .then((t) => { setTemplates(Array.isArray(t) ? t : []); setLastSync(new Date()); })
      .catch(() => setTemplates([]));
  };
  useEffect(() => { loadTemplates(); /* eslint-disable-next-line */ }, [config]);

  async function save(e) {
    e?.preventDefault();
    setErr(""); setOk(""); setSaving(true);
    try {
      const body = {
        phone_number_id: phoneNumberId.trim(),
        business_account_id: businessAccountId.trim() || null,
        webhook_verify_token: verifyToken.trim() || "wayvo_webhook",
        app_secret: appSecret.trim() || null,
      };
      if (accessToken.trim()) body.access_token = accessToken.trim();
      else if (!config?.has_token) return setErr("Access Token é obrigatório na primeira configuração");
      else return setErr("Cole o Access Token novamente para atualizar (oculto por segurança)");
      await api("/api/wpp-cloud/config", { method: "POST", body });
      setOk("Credenciais validadas e salvas com sucesso.");
      setAccessToken(""); setAppSecret("");
      loadConfig();
    } catch (e) { setErr(e.message); } finally { setSaving(false); }
  }

  async function testConnection() {
    setTestingConn(true); setVerify(null);
    try {
      const r = await api("/api/wpp-cloud/verify");
      setVerify(r);
    } catch (e) {
      setVerify({ ok: false, error: e.message });
    } finally { setTestingConn(false); }
  }

  const copyWebhook = () => {
    navigator.clipboard?.writeText(WEBHOOK_URL).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 1500);
    });
  };

  const connected = !!config;
  const statusCards = [
    { icon: Plug, label: "API Oficial", value: connected ? "Conectada" : "Não configurada", tint: connected ? "#00FF88" : "#FBBF24", sub: config?.verified_name || "" },
    { icon: KeyRound, label: "Token de acesso", value: config?.has_token ? "Configurado" : "Ausente", tint: config?.has_token ? "#00FF88" : "#EF4444", sub: config?.has_token ? "System User" : "obrigatório" },
    { icon: Webhook, label: "Webhook", value: config?.webhook_verify_token ? "Configurado" : "Pendente", tint: config?.webhook_verify_token ? "#22D3EE" : "#FBBF24", sub: "verify token definido" },
    { icon: LayoutTemplate, label: "Templates", value: templates == null ? "—" : `${templates.length}`, tint: "#7C3AED", sub: templates ? `${templates.filter((t) => t.status === "APPROVED").length} aprovados` : "sincronizando…" },
    { icon: BadgeCheck, label: "Conta Meta", value: config?.display_phone || "—", tint: "#38BDF8", sub: config?.verified_name || "número oficial" },
    { icon: Gauge, label: "Qualidade", value: verify?.quality_rating ? (QUALITY[verify.quality_rating]?.label || verify.quality_rating) : "—", tint: "#00FF88", sub: verify ? "via Meta" : "teste a conexão" },
  ];

  const filteredTpls = useMemo(() => {
    let out = templates || [];
    if (tplCat) out = out.filter((t) => t.category === tplCat);
    if (tplStatus) out = out.filter((t) => t.status === tplStatus);
    const q = tplQ.toLowerCase().trim();
    if (q) out = out.filter((t) => (t.name || "").toLowerCase().includes(q));
    return out;
  }, [templates, tplCat, tplStatus, tplQ]);

  const est = useMemo(() => {
    const country = COUNTRIES.find((c) => c.code === estCountry) || COUNTRIES[0];
    const per = (PRICE_BR[estCat] || 0) * country.mult;
    const qty = Math.max(0, Number(estQty) || 0);
    const total = per * qty;
    return { per, total, daily: total, monthly: total * 30 };
  }, [estCountry, estCat, estQty]);

  if (loading) return (
    <>
      <Topbar title="Canal Oficial" subtitle="Central operacional da API oficial do WhatsApp (Meta)" />
      <div className="p-6 lg:p-8 grid grid-cols-2 lg:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => <div key={i} className="glass h-24 animate-pulse" />)}
      </div>
    </>
  );

  return (
    <>
      <Topbar title="Canal Oficial" subtitle="Central operacional da API oficial do WhatsApp (Meta)" />
      <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-6 pb-16">

        {/* 1. STATUS */}
        <section className="grid grid-cols-2 lg:grid-cols-6 gap-3">
          {statusCards.map((c, i) => <StatusCard key={i} {...c} />)}
        </section>

        <div className="grid lg:grid-cols-[1fr_360px] gap-6 items-start">
          <div className="space-y-6 min-w-0">

            {/* 2. TEMPLATES */}
            <section className="glass p-5">
              <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
                <div>
                  <h2 className="font-semibold">Templates oficiais</h2>
                  <p className="text-xs text-ink-500 mt-0.5">Sincronizados da sua conta WhatsApp Business (Meta)</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={loadTemplates} title="Sincronizar"
                    className="size-9 rounded-lg border border-white/10 flex items-center justify-center text-ink-400 hover:text-primary hover:bg-white/[0.04] transition-colors">
                    <RefreshCw className="size-4" />
                  </button>
                  <button onClick={() => setModalOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold text-bg"
                    style={{ background: "linear-gradient(135deg,#00FF88,#00D1FF)" }}>
                    <Plus className="size-4" /> Novo Template
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap mb-3">
                <div className="relative flex-1 min-w-[180px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-ink-500" />
                  <input value={tplQ} onChange={(e) => setTplQ(e.target.value)} placeholder="Buscar template…"
                    className="w-full rounded-lg bg-white/[0.03] border border-white/[0.08] pl-9 pr-3 py-2 text-sm outline-none focus:border-primary/50 placeholder:text-ink-600" />
                </div>
                <select value={tplCat} onChange={(e) => setTplCat(e.target.value)}
                  className="bg-bg/60 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none">
                  <option value="">Categoria</option>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{CAT_LABEL[c]}</option>)}
                </select>
                <select value={tplStatus} onChange={(e) => setTplStatus(e.target.value)}
                  className="bg-bg/60 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none">
                  <option value="">Status</option>
                  {Object.entries(TPL_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>

              {templates == null ? (
                <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-12 bg-white/[0.04] rounded-lg animate-pulse" />)}</div>
              ) : !config?.has_token ? (
                <div className="py-12 text-center text-sm text-ink-500">Configure as credenciais Meta para sincronizar seus templates.</div>
              ) : filteredTpls.length === 0 ? (
                <div className="py-12 text-center text-sm text-ink-500">Nenhum template encontrado.</div>
              ) : (
                <div className="overflow-x-auto -mx-1">
                  <table className="w-full text-sm">
                    <thead className="text-[11px] uppercase tracking-wider text-ink-500">
                      <tr className="text-left">
                        <th className="px-3 py-2 font-medium">Nome</th>
                        <th className="px-3 py-2 font-medium">Categoria</th>
                        <th className="px-3 py-2 font-medium">Status</th>
                        <th className="px-3 py-2 font-medium">Qualidade</th>
                        <th className="px-3 py-2 font-medium">Idioma</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04]">
                      {filteredTpls.map((t) => {
                        const st = TPL_STATUS[t.status] || { label: t.status || "—", color: "#94A3B8" };
                        const ql = QUALITY[(t.quality_score?.score || "UNKNOWN").toUpperCase()] || QUALITY.UNKNOWN;
                        return (
                          <tr key={t.id || t.name} className="hover:bg-white/[0.02]">
                            <td className="px-3 py-3 font-medium truncate max-w-[220px]">{t.name}</td>
                            <td className="px-3 py-3 text-ink-300">{CAT_LABEL[t.category] || t.category || "—"}</td>
                            <td className="px-3 py-3">
                              <span className="text-[10px] px-2 py-0.5 rounded-full border font-medium"
                                style={{ background: `${st.color}1a`, color: st.color, borderColor: `${st.color}40` }}>
                                {st.label}
                              </span>
                            </td>
                            <td className="px-3 py-3">
                              <span className="inline-flex items-center gap-1.5 text-[12px]" style={{ color: ql.color }}>
                                <span className="size-2 rounded-full" style={{ background: ql.color }} />{ql.label}
                              </span>
                            </td>
                            <td className="px-3 py-3 text-ink-400 uppercase text-[12px]">{t.language || "—"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* 4. CREDENCIAIS */}
            <section className="glass p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-semibold flex items-center gap-2"><KeyRound className="size-4 text-primary" /> Credenciais Meta</h2>
                  <p className="text-xs text-ink-500 mt-0.5">Validadas com a Meta antes de salvar</p>
                </div>
                {config?.has_token && (
                  <button onClick={testConnection} disabled={testingConn}
                    className="inline-flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg border border-white/10 text-ink-200 hover:bg-white/[0.05] disabled:opacity-50">
                    {testingConn ? <Loader2 className="size-4 animate-spin" /> : <Plug className="size-4" />} Testar conexão
                  </button>
                )}
              </div>

              {verify && (
                <div className={`mb-4 text-sm rounded-xl px-4 py-3 border ${verify.ok ? "bg-primary/10 border-primary/25 text-primary" : "bg-red-500/10 border-red-500/25 text-red-300"}`}>
                  {verify.ok
                    ? `Conexão OK · ${verify.verified_name || "número"} · ${verify.display_phone || ""}`
                    : `Falha: ${verify.error}`}
                </div>
              )}

              <form onSubmit={save} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="Phone Number ID *" hint="WhatsApp → Introdução → ID do número">
                    <Input value={phoneNumberId} onChange={(e) => setPhoneNumberId(e.target.value)} placeholder="123456789012345" required />
                  </Field>
                  <Field label="Business Account ID (WABA)" hint="Necessário para templates">
                    <Input value={businessAccountId} onChange={(e) => setBusinessAccountId(e.target.value)} placeholder="987654321098765" />
                  </Field>
                </div>
                <Field label="Access Token *" hint="Token do System User permanente — oculto após salvar">
                  <Input type="password" value={accessToken} onChange={(e) => setAccessToken(e.target.value)}
                    placeholder={config?.has_token ? "•••••••• (cole novamente para atualizar)" : "EAAxxxxxx…"} />
                </Field>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="Webhook Verify Token *" hint="String que você define">
                    <Input value={verifyToken} onChange={(e) => setVerifyToken(e.target.value)} placeholder="wayvo_meu_token_123" required />
                  </Field>
                  <Field label="App Secret (opcional)" hint="Valida HMAC do webhook">
                    <Input type="password" value={appSecret} onChange={(e) => setAppSecret(e.target.value)}
                      placeholder={config?.has_app_secret ? "•••••••• (preencha p/ atualizar)" : "Do painel do app Meta"} />
                  </Field>
                </div>
                <Field label="URL do Webhook">
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs bg-bg/60 border border-white/10 rounded-xl px-4 py-2.5 text-primary break-all">{WEBHOOK_URL}</code>
                    <button type="button" onClick={copyWebhook}
                      className="px-3 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-ink-300 text-xs shrink-0 inline-flex items-center gap-1.5">
                      {copied ? <Check className="size-3.5 text-primary" /> : <Copy className="size-3.5" />} {copied ? "Copiado" : "Copiar"}
                    </button>
                  </div>
                </Field>
                {err && <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{err}</div>}
                {ok && <div className="text-sm text-primary bg-primary/10 border border-primary/20 rounded-xl px-4 py-3">{ok}</div>}
                <button type="submit" disabled={saving}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-bg font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity">
                  {saving && <Loader2 className="size-4 animate-spin" />}
                  {saving ? "Validando com a Meta…" : "Salvar e validar"}
                </button>
              </form>
            </section>
          </div>

          {/* COLUNA DIREITA: custos + diagnóstico */}
          <div className="space-y-6">
            {/* 5. ESTIMATIVA DE CUSTOS */}
            <section className="glass p-5">
              <h2 className="font-semibold flex items-center gap-2"><Wallet className="size-4 text-primary" /> Estimativa de custos</h2>
              <p className="text-xs text-ink-500 mt-0.5 mb-4">Projeção por conversa iniciada pela empresa</p>
              <div className="space-y-3">
                <Field label="País">
                  <select value={estCountry} onChange={(e) => setEstCountry(e.target.value)}
                    className="w-full bg-bg/60 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none">
                    {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
                  </select>
                </Field>
                <Field label="Categoria">
                  <select value={estCat} onChange={(e) => setEstCat(e.target.value)}
                    className="w-full bg-bg/60 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none">
                    {CATEGORIES.map((c) => <option key={c} value={c}>{CAT_LABEL[c]}</option>)}
                  </select>
                </Field>
                <Field label="Quantidade de conversas">
                  <Input type="number" min={0} value={estQty} onChange={(e) => setEstQty(e.target.value)} />
                </Field>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {[
                  ["Por conversa", brl(est.per)],
                  ["Total estimado", brl(est.total)],
                  ["Projeção diária", brl(est.daily)],
                  ["Projeção mensal", brl(est.monthly)],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                    <div className="text-[10px] text-ink-500 uppercase tracking-wide">{k}</div>
                    <div className="text-base font-bold text-primary mt-0.5">{v}</div>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-ink-600 mt-3">Valores estimados conforme política atual da Meta — sujeitos a alteração por país/categoria.</p>
            </section>

            {/* 6. DIAGNÓSTICO */}
            <section className="glass p-5">
              <h2 className="font-semibold flex items-center gap-2"><Activity className="size-4 text-primary" /> Diagnóstico operacional</h2>
              <div className="mt-4 space-y-2.5 text-sm">
                {[
                  ["Status API Meta", verify ? (verify.ok ? "Operacional" : "Falha") : (config ? "Configurada" : "Não configurada"), verify ? (verify.ok ? "#00FF88" : "#EF4444") : "#94A3B8"],
                  ["Última sincronização", lastSync ? lastSync.toLocaleTimeString("pt-BR") : "—", "#94A3B8"],
                  ["Templates sincronizados", templates == null ? "—" : String(templates.length), "#94A3B8"],
                  ["Webhook", config?.webhook_verify_token ? "Configurado" : "Pendente", config?.webhook_verify_token ? "#22D3EE" : "#FBBF24"],
                  ["Token", config?.has_token ? "Ativo" : "Ausente", config?.has_token ? "#00FF88" : "#EF4444"],
                ].map(([k, v, c]) => (
                  <div key={k} className="flex items-center justify-between gap-3">
                    <span className="text-ink-500 text-xs">{k}</span>
                    <span className="text-xs font-medium flex items-center gap-1.5" style={{ color: c }}>
                      <span className="size-1.5 rounded-full" style={{ background: c }} />{v}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-ink-600 mt-3">Métricas de eventos do webhook (volume/falhas) entram quando o rastreamento histórico estiver ativo.</p>
            </section>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {modalOpen && (
          <CreateTemplateModal
            onClose={() => setModalOpen(false)}
            onCreated={() => { setModalOpen(false); loadTemplates(); }}
          />
        )}
      </AnimatePresence>
    </>
  );
}

/* ════════════════ MODAL: CRIAR TEMPLATE (com preview live) ════════════════ */
function CreateTemplateModal({ onClose, onCreated }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("MARKETING");
  const [language, setLanguage] = useState("pt_BR");
  const [header, setHeader] = useState("");
  const [body, setBody] = useState("");
  const [footer, setFooter] = useState("");
  const [btn, setBtn] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);

  async function submit() {
    setErr("");
    const safeName = name.trim().toLowerCase().replace(/[^a-z0-9_]/g, "_");
    if (!safeName) return setErr("Informe um nome para o template");
    if (!body.trim()) return setErr("O corpo da mensagem é obrigatório");
    const components = [];
    if (header.trim()) components.push({ type: "HEADER", format: "TEXT", text: header.trim() });
    components.push({ type: "BODY", text: body.trim() });
    if (footer.trim()) components.push({ type: "FOOTER", text: footer.trim() });
    if (btn.trim()) components.push({ type: "BUTTONS", buttons: [{ type: "QUICK_REPLY", text: btn.trim() }] });
    setBusy(true);
    try {
      await api("/api/wpp-cloud/templates", {
        method: "POST",
        body: { name: safeName, language, category, components },
      });
      setDone(true);
      setTimeout(onCreated, 1200);
    } catch (e) { setErr(e.message || "Falha ao enviar para a Meta"); }
    finally { setBusy(false); }
  }

  const renderVars = (txt) =>
    String(txt || "").split(/(\{\{\d+\}\})/g).map((p, i) =>
      /^\{\{\d+\}\}$/.test(p)
        ? <span key={i} className="text-emerald-400 font-medium">{p}</span>
        : <span key={i}>{p}</span>
    );

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} className="fixed inset-0 z-[60] bg-black/55 backdrop-blur-[2px]" />
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }}
        className="fixed inset-0 z-[61] flex items-center justify-center p-4 pointer-events-none"
      >
        <div className="pointer-events-auto w-full max-w-3xl rounded-2xl border border-white/[0.08] overflow-hidden"
          style={{ background: "linear-gradient(180deg,#0B1120,#0F172A)", boxShadow: "0 30px 80px -20px rgba(0,0,0,0.85)" }}>
          <div className="flex items-center justify-between px-5 h-14 border-b border-white/[0.06]">
            <h3 className="font-semibold flex items-center gap-2"><LayoutTemplate className="size-4 text-primary" /> Criar template oficial</h3>
            <button onClick={onClose} className="text-ink-500 hover:text-ink-100"><X className="size-5" /></button>
          </div>
          <div className="grid md:grid-cols-2 max-h-[75vh] overflow-y-auto">
            {/* form */}
            <div className="p-5 space-y-4 border-r border-white/[0.06]">
              <Field label="Nome do template" hint="Só minúsculas, números e _ (ex: boas_vindas)">
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="boas_vindas" />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Categoria">
                  <select value={category} onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-bg/60 border border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none">
                    {CATEGORIES.map((c) => <option key={c} value={c}>{CAT_LABEL[c]}</option>)}
                  </select>
                </Field>
                <Field label="Idioma">
                  <select value={language} onChange={(e) => setLanguage(e.target.value)}
                    className="w-full bg-bg/60 border border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none">
                    {["pt_BR", "en_US", "es_ES"].map((l) => <option key={l} value={l}>{l}</option>)}
                  </select>
                </Field>
              </div>
              <Field label="Cabeçalho (opcional)">
                <Input value={header} onChange={(e) => setHeader(e.target.value)} placeholder="Ex: Oferta especial 🎉" />
              </Field>
              <Field label="Corpo da mensagem *" hint="Use {{1}}, {{2}} para variáveis">
                <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4}
                  placeholder="Olá {{1}}! Temos uma condição especial pra você: {{2}} de desconto."
                  className="w-full bg-bg/60 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary/60 resize-none" />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Rodapé (opcional)">
                  <Input value={footer} onChange={(e) => setFooter(e.target.value)} placeholder="Responda PARAR para sair" />
                </Field>
                <Field label="Botão CTA (opcional)">
                  <Input value={btn} onChange={(e) => setBtn(e.target.value)} placeholder="Quero saber mais" />
                </Field>
              </div>
              {err && <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{err}</div>}
              <button onClick={submit} disabled={busy || done}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-bg font-semibold hover:opacity-90 disabled:opacity-50">
                {busy && <Loader2 className="size-4 animate-spin" />}
                {done ? "Enviado ✓" : busy ? "Enviando para a Meta…" : "Enviar para aprovação Meta"}
              </button>
              <p className="text-[10px] text-ink-600">Após o envio, a Meta analisa o template (geralmente minutos a 24h). Acompanhe o status na lista.</p>
            </div>
            {/* preview live */}
            <div className="p-5 bg-[#0b141a] flex flex-col">
              <div className="text-[11px] uppercase tracking-wider text-ink-500 mb-3">Pré-visualização</div>
              <div className="flex-1 flex items-start">
                <div className="max-w-[85%] rounded-xl rounded-tl-sm bg-[#202c33] px-3 py-2.5 shadow-md text-[#e9edef]">
                  {header && <div className="text-[13px] font-bold mb-1">{renderVars(header)}</div>}
                  <div className="text-[13px] leading-snug whitespace-pre-wrap break-words">
                    {body ? renderVars(body) : <span className="text-ink-500 italic">Corpo da mensagem aparece aqui…</span>}
                  </div>
                  {footer && <div className="text-[11px] text-ink-500 mt-1.5">{footer}</div>}
                  <div className="text-[9px] text-ink-500 text-right mt-1">agora</div>
                  {btn && (
                    <div className="mt-2 -mx-3 -mb-2.5 border-t border-white/10 pt-2 text-center text-[12px] text-[#53bdeb] font-medium">
                      {btn}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
}

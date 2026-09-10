"use client";
import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck, KeyRound, Webhook, LayoutTemplate, BadgeCheck, Activity,
  Search, Plus, Copy, Check, X, Loader2, Gauge, Wallet, Plug, RefreshCw,
  Building2, Zap, AlertTriangle, Clock, BarChart3, FileText, ChevronDown,
} from "lucide-react";
import { api } from "../../../lib/api";
import Topbar from "../../../components/dashboard/Topbar";
import {
  DashButton, DashIconButton, DashBadge, DashModal, DashEmptyState, DashTh,
} from "../../../components/dashboard/DashUI";
import { DASH_ACCENT, dashHeaderIconStyle } from "../../../components/dashboard/dashTheme";

/* Paleta oficial do tema light — nenhuma cor fora daqui. */
const GREEN   = DASH_ACCENT.green;    // #0E8A47 — CTA / sucesso
const EMERALD = DASH_ACCENT.emerald;  // #12A150 — acento desta tela
const AMBER   = DASH_ACCENT.amber;    // #C2740A — atenção / pendente
const RED     = DASH_ACCENT.red;      // #C2434A — erro / rejeitado
const BLUE    = DASH_ACCENT.blue;     // #2F80ED — informativo
const VIOLET  = DASH_ACCENT.violet;   // #6D3BEA — informativo
const SLATE   = DASH_ACCENT.slate;    // #5A6474 — neutro
const FAINT   = "#98A1B0";            // desconhecido

const WEBHOOK_URL = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL}/api/wpp-cloud/webhook`
  : "https://api.wayvo.app.br/api/wpp-cloud/webhook";

const STEPS = [
  { n: 1, t: "Criar app no Meta for Developers", d: 'Em developers.facebook.com → "Criar app" → tipo "Business" → nomeie (ex: Wayvo Bot).' },
  { n: 2, t: "Adicionar produto WhatsApp", d: 'No app: "Adicionar produto" → WhatsApp → "Configurar" → associe a uma conta do Business Manager.' },
  { n: 3, t: "Obter Phone Number ID + WABA ID", d: 'WhatsApp → Introdução: copie o Phone Number ID, o WABA ID e o token de acesso.' },
  { n: 4, t: "System User permanente (recomendado)", d: 'Business Suite → Usuários do sistema → Adicionar (Admin) → gerar token com whatsapp_business_messaging e management (não expira).' },
  { n: 5, t: "Configurar Webhook no Meta", d: 'SOMENTE após salvar as credenciais aqui: WhatsApp → Configuração → Webhooks → cole a URL do Webhook e o Verify Token que você definiu no formulário; ative o campo "messages".' },
  { n: 6, t: "Salvar credenciais", d: 'Preencha o formulário de Credenciais e clique em "Salvar e validar" — verificamos com a Meta em tempo real.' },
];

/* ── constantes de mapeamento ── */
const TPL_STATUS = {
  APPROVED: { label: "Aprovado",   color: GREEN },
  PENDING:  { label: "Em análise", color: AMBER },
  REJECTED: { label: "Rejeitado",  color: RED },
  PAUSED:   { label: "Pausado",    color: SLATE },
  DISABLED: { label: "Desativado", color: SLATE },
};
const QUALITY = {
  GREEN:   { label: "Alta",  color: GREEN },
  YELLOW:  { label: "Média", color: AMBER },
  RED:     { label: "Baixa", color: RED },
  UNKNOWN: { label: "—",     color: FAINT },
};
const VERIFICATION = {
  verified:     { label: "Verificada",     color: GREEN },
  not_verified: { label: "Não verificada", color: RED },
  in_review:    { label: "Em análise",     color: AMBER },
  rejected:     { label: "Rejeitada",      color: RED },
};
const TIER_LABEL = {
  TIER_1K:       "1.000 / dia",
  TIER_10K:      "10.000 / dia",
  TIER_100K:     "100.000 / dia",
  TIER_UNLIMITED:"Ilimitado",
  TIER_250:      "250 / dia",
};

const CATEGORIES = ["MARKETING", "UTILITY", "AUTHENTICATION"];
const CAT_LABEL  = { MARKETING: "Marketing", UTILITY: "Utility", AUTHENTICATION: "Authentication" };
const PRICE_BR   = { MARKETING: 0.34, UTILITY: 0.04, AUTHENTICATION: 0.34 };
const COUNTRIES  = [
  { code: "BR", label: "Brasil",          mult: 1 },
  { code: "US", label: "Estados Unidos",  mult: 0.07 / 0.34 },
  { code: "MX", label: "México",          mult: 0.04 / 0.34 },
  { code: "IN", label: "Índia",           mult: 0.011 / 0.34 },
];

const LOG_LABELS = {
  sync:             { label: "Sincronização", icon: RefreshCw, color: BLUE },
  template_created: { label: "Template criado", icon: LayoutTemplate, color: VIOLET },
  template_rejected:{ label: "Template rejeitado", icon: X, color: RED },
  webhook_validated:{ label: "Webhook validado", icon: Webhook, color: GREEN },
  token_updated:    { label: "Token atualizado", icon: KeyRound, color: AMBER },
  test_sent:        { label: "Teste enviado", icon: Plug, color: EMERALD },
};

const brl = (n) => Number(n || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function fmtTime(iso) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    const now = new Date();
    const diff = Math.floor((now - d) / 1000);
    if (diff < 60)    return "agora";
    if (diff < 3600)  return `${Math.floor(diff / 60)}min atrás`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`;
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  } catch { return "—"; }
}

/* ── componentes UI reutilizáveis ── */
function Dot({ color, className = "" }) {
  return <span className={`size-1.5 rounded-full shrink-0 ${className}`} style={{ background: color }} />;
}

function StatusCard({ icon: Icon, label, value, tint, sub, tooltip }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      title={tooltip}
      className="dash-card !p-4 cursor-default"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[11px] text-dash-faint">{label}</div>
          <div className="text-[15px] font-bold mt-1.5 truncate" style={{ color: tint }}>{value}</div>
          {sub && <div className="text-[10px] text-dash-faint2 mt-0.5 truncate">{sub}</div>}
        </div>
        <span className="shrink-0" style={dashHeaderIconStyle(tint)}>
          <Icon width={16} height={16} />
        </span>
      </div>
    </motion.div>
  );
}

const Field = ({ label, hint, children }) => (
  <div>
    <label className="block text-[11px] text-dash-faint2 uppercase tracking-wider mb-1.5 font-semibold">{label}</label>
    {children}
    {hint && <p className="text-[11px] text-dash-faint mt-1">{hint}</p>}
  </div>
);
const Input = ({ type = "text", className = "", ...p }) => (
  <input type={type} className={`dash-input ${className}`} {...p} />
);
const Select = ({ className = "", ...p }) => (
  <select className={`dash-input appearance-none cursor-pointer ${className}`} {...p} />
);
function Skel({ className = "" }) {
  return <div className={`dash-skeleton ${className}`} />;
}

/* ── Health Score Card ── */
function HealthScore({ config, account, quality, templates, verify }) {
  const checks = useMemo(() => {
    const tplCount = Array.isArray(templates) ? templates.length : null;
    const approved = Array.isArray(templates) ? templates.filter(t => t.status === "APPROVED").length : null;
    return [
      {
        key: "api",
        label: "API",
        ok: !!config?.has_token,
        warn: false,
        detail: config?.has_token ? "Token configurado" : "Token ausente",
      },
      {
        key: "webhook",
        label: "Webhook",
        ok: !!config?.webhook_verify_token,
        warn: false,
        detail: config?.webhook_verify_token ? "Verify token definido" : "Pendente de configuração",
      },
      {
        key: "token_verify",
        label: "Token ativo",
        ok: !!verify?.ok,
        warn: !verify,
        detail: verify?.ok ? `${verify.verified_name || "Conectado"}` : verify ? "Falha na validação" : "Não testado",
      },
      {
        key: "conta",
        label: "Conta Meta",
        ok: account?.verification_status === "verified",
        warn: account?.verification_status === "in_review" || !!account?._error,
        detail: account?._error ? "Token sem permissão de gestão" : account ? (VERIFICATION[account.verification_status]?.label || account.verification_status) : (config?.business_account_id ? "Aguardando sync" : "WABA ID não configurado"),
      },
      {
        key: "templates",
        label: "Templates",
        ok: approved > 0,
        warn: tplCount === 0,
        detail: tplCount === null ? "Sincronize para ver" : `${approved}/${tplCount} aprovados`,
      },
      {
        key: "quality",
        label: "Qualidade",
        ok: quality?.quality_rating === "GREEN",
        warn: quality?.quality_rating === "YELLOW" || !!quality?._error,
        detail: quality?._error ? "Token sem permissão de mensagens" : quality ? (QUALITY[quality.quality_rating]?.label || "—") : "Sincronize para ver",
      },
    ];
  }, [config, account, quality, templates, verify]);

  const score = useMemo(() => {
    const w = [20, 15, 20, 15, 15, 15]; // pesos por check
    return checks.reduce((acc, c, i) => acc + (c.ok ? w[i] : c.warn ? w[i] * 0.4 : 0), 0);
  }, [checks]);

  const scoreLevel =
    score >= 70 ? { label: "Saudável", color: GREEN } :
    score >= 40 ? { label: "Atenção",  color: AMBER } :
                  { label: "Crítico",  color: RED };

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className="dash-card !p-5"
      style={{ borderColor: `${scoreLevel.color}33`, background: `${scoreLevel.color}08` }}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
        {/* Score gauge */}
        <div className="shrink-0 flex flex-col items-center gap-1">
          <div className="relative size-20">
            <svg viewBox="0 0 80 80" className="size-20 -rotate-90">
              <circle cx="40" cy="40" r="32" fill="none" stroke="#E9ECF1" strokeWidth="6" />
              <circle cx="40" cy="40" r="32" fill="none" stroke={scoreLevel.color} strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={`${Math.round(score * 2.01)} 201`}
                style={{ transition: "stroke-dasharray 0.8s ease" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-lg font-black leading-none" style={{ color: scoreLevel.color }}>{Math.round(score)}</span>
              <span className="text-[9px] text-dash-faint2">/ 100</span>
            </div>
          </div>
          <span className="text-[11px] font-semibold" style={{ color: scoreLevel.color }}>{scoreLevel.label}</span>
        </div>

        {/* Checklist */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-3">
            <h2 className="m-0 font-semibold text-sm text-dash-ink">Saúde da Conta</h2>
            <span className="font-mono text-[10px] text-dash-faint2">Score {Math.round(score)}/100</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {checks.map((c) => {
              const color = c.ok ? GREEN : c.warn ? AMBER : RED;
              return (
                <div key={c.key} className="flex items-center gap-2 text-[12px]" title={c.detail}>
                  <span className="size-4 rounded-full flex items-center justify-center text-[9px] shrink-0 font-bold"
                    style={{ background: `${color}1f`, color }}>
                    {c.ok ? "✓" : c.warn ? "~" : "✕"}
                  </span>
                  <span style={{ color: c.ok ? "#26303E" : color }}>{c.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </motion.section>
  );
}

/* ── Verification blocker modal ── */
function VerificationModal({ open, verificationStatus, onContinue, onClose }) {
  return (
    <DashModal
      open={open}
      onClose={onClose}
      title="Conta Meta ainda não verificada"
      subtitle="Para criar templates oficiais a Meta exige que sua conta empresarial esteja verificada."
      footer={
        <>
          <a href="https://business.facebook.com/settings/security" target="_blank" rel="noreferrer"
            className="dash-btn-secondary">Como verificar →</a>
          <DashButton variant="primary" onClick={onContinue}>Continuar mesmo assim</DashButton>
        </>
      }
    >
      <div className="flex items-start gap-3">
        <span className="shrink-0" style={{ ...dashHeaderIconStyle(AMBER), width: 40, height: 40, borderRadius: 13 }}>
          <AlertTriangle width={19} height={19} />
        </span>
        <p className="text-[13px] text-dash-muted leading-relaxed m-0">
          {verificationStatus === "in_review" && "Sua conta está em análise. "}
          {verificationStatus === "not_verified" && "Complete a verificação no Business Manager. "}
          Enquanto isso, a Meta pode recusar novos templates.
        </p>
      </div>

      <div className="p-4 rounded-[14px] bg-dash-subtle border border-dash-border text-xs text-dash-muted leading-relaxed">
        <p className="font-semibold text-dash-ink mb-1.5">Como verificar sua conta:</p>
        <ol className="space-y-1 list-decimal list-inside m-0">
          <li>Acesse <a href="https://business.facebook.com" target="_blank" rel="noreferrer" className="font-semibold hover:underline" style={{ color: GREEN }}>business.facebook.com</a></li>
          <li>Vá em Configurações → Central de Segurança</li>
          <li>Clique em "Iniciar verificação" e siga os passos</li>
        </ol>
      </div>
    </DashModal>
  );
}

/* ════════════════════ TESTE YCLOUD (BSP) ════════════════════ */
function YCloudTestCard() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [msg, setMsg] = useState("Teste de envio via YCloud ✅");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null); // { ok, text }

  async function send(body, okText) {
    setResult(null);
    if (!from.trim() || !to.trim()) {
      setResult({ ok: false, text: "Preencha número YCloud e destino." });
      return;
    }
    setSending(true);
    try {
      await api("/api/ycloud/test-send", { method: "POST", body: { from: from.trim(), to: to.trim(), ...body } });
      setResult({ ok: true, text: okText });
    } catch (e) {
      setResult({ ok: false, text: e.message || "Falha ao enviar" });
    } finally {
      setSending(false);
    }
  }
  const sendText = () => {
    if (!msg.trim()) return setResult({ ok: false, text: "Digite a mensagem." });
    send({ message: msg.trim() }, "Aceito! (texto livre só entrega dentro da janela de 24h)");
  };
  const sendTemplate = () => send({ template: "hello_world", language: "en_US" }, "Template enviado! Deve chegar no destino.");

  const [templates, setTemplates] = useState(null);
  async function loadTemplates() {
    setResult(null);
    try {
      const list = await api("/api/ycloud/templates");
      setTemplates(list || []);
      if (!list?.length) setResult({ ok: false, text: "Nenhum template na conta ainda." });
    } catch (e) {
      setResult({ ok: false, text: e.message || "Falha ao listar templates" });
    }
  }
  function sendNamed(t) {
    // Conta variáveis {{n}} no corpo do template
    const body = (t.components || []).find(c => c.type === "BODY")?.text || "";
    const n = (body.match(/\{\{\s*\d+\s*\}\}/g) || []).length;
    const params = [];
    for (let i = 1; i <= n; i++) {
      // Mostra o corpo com a variável atual destacada para o usuário saber qual é
      const preview = body.replace(new RegExp(`\\{\\{\\s*${i}\\s*\\}\\}`, "g"), `►{{${i}}}◄`);
      const val = window.prompt(`Variável {{${i}}} de ${n} — informe o valor:\n\n${preview}`, "");
      if (val === null) return; // cancelou
      params.push(val.trim());
    }
    send({ template: t.name, language: t.language, params }, `Template "${t.name}" enviado!`);
  }

  return (
    <section className="dash-card !p-5">
      <div className="flex items-center gap-2 mb-4">
        <span style={dashHeaderIconStyle(VIOLET)}><Zap width={16} height={16} /></span>
        <h3 className="m-0 text-sm font-semibold text-dash-ink">Teste YCloud (BSP)</h3>
        <DashBadge color={VIOLET} dot={false}>beta</DashBadge>
      </div>
      <div className="grid sm:grid-cols-3 gap-2 mb-3">
        <Input value={from} onChange={e => setFrom(e.target.value)} placeholder="Número YCloud (from), ex: 5513..." />
        <Input value={to} onChange={e => setTo(e.target.value)} placeholder="Enviar para (seu número)" />
        <Input value={msg} onChange={e => setMsg(e.target.value)} placeholder="Mensagem" />
      </div>
      <div className="flex flex-wrap items-center gap-2.5">
        <DashButton onClick={sendTemplate} disabled={sending}>
          {sending ? "Enviando..." : "Enviar template (hello_world)"}
        </DashButton>
        <DashButton variant="secondary" onClick={sendText} disabled={sending}>Enviar texto livre</DashButton>
        <DashButton variant="secondary" onClick={loadTemplates} disabled={sending}>Listar templates</DashButton>
        {result && (
          <span className="text-xs font-medium" style={{ color: result.ok ? GREEN : RED }}>{result.text}</span>
        )}
      </div>

      {templates && templates.length > 0 && (
        <div className="mt-4 space-y-1.5">
          <p className="text-[10px] text-dash-faint2 uppercase tracking-wider font-semibold">Templates da conta — clique para enviar ao destino</p>
          {templates.map((t, i) => {
            const st = TPL_STATUS[t.status] || { label: t.status || "—", color: SLATE };
            return (
              <div key={i} className="flex items-center gap-2 text-xs bg-dash-subtle border border-dash-border rounded-[12px] px-3 py-2">
                <span className="font-medium text-dash-ink">{t.name}</span>
                <span className="text-dash-faint">· {t.language}</span>
                <DashBadge color={st.color} dot={false}>{t.status}</DashBadge>
                <button onClick={() => sendNamed(t)} disabled={sending || t.status !== "APPROVED"}
                  className="ml-auto font-semibold hover:underline disabled:opacity-40 disabled:no-underline"
                  style={{ color: GREEN }}>enviar →</button>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-[11px] text-dash-faint mt-3">Use um template aprovado para testar a entrega real. Texto livre só chega depois que o cliente responde (janela de 24h).</p>
    </section>
  );
}

/* ════════════════════ EMBEDDED SIGNUP (onboarding 1 clique) ════════════════════ */
const FB_APP_ID = process.env.NEXT_PUBLIC_FB_APP_ID;
const FB_CONFIG_ID = process.env.NEXT_PUBLIC_FB_CONFIG_ID;
const FB_SOLUTION_ID = process.env.NEXT_PUBLIC_YCLOUD_SOLUTION_ID;

function YCloudEmbeddedSignup({ onConnected }) {
  const [status, setStatus] = useState(null); // { ok, text }
  const [loading, setLoading] = useState(false);
  const sessionData = useRef(null);

  useEffect(() => {
    if (!FB_APP_ID || typeof window === "undefined") return;
    if (!window.FB) {
      window.fbAsyncInit = function () { window.FB.init({ appId: FB_APP_ID, version: "v22.0" }); };
      const s = document.createElement("script");
      s.src = "https://connect.facebook.net/en_US/sdk.js";
      s.async = true; s.defer = true; s.crossOrigin = "anonymous";
      document.body.appendChild(s);
    }
    const onMsg = (event) => {
      if (!String(event.origin || "").endsWith("facebook.com")) return;
      try {
        const data = JSON.parse(event.data);
        if (data.type === "WA_EMBEDDED_SIGNUP" && data.event === "FINISH") {
          sessionData.current = data.data; // { phone_number_id, waba_id }
        }
      } catch {}
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, []);

  function connect() {
    setStatus(null);
    if (!window.FB) { setStatus({ ok: false, text: "SDK do Facebook ainda carregando, tente de novo." }); return; }
    sessionData.current = null;
    window.FB.login(() => finish(), {
      config_id: FB_CONFIG_ID,
      response_type: "code",
      override_default_response_type: true,
      extras: {
        setup: FB_SOLUTION_ID ? { solutionID: FB_SOLUTION_ID } : {},
        sessionInfoVersion: "3",
      },
    });
  }

  async function finish() {
    const sd = sessionData.current;
    if (!sd?.waba_id || !sd?.phone_number_id) {
      setStatus({ ok: false, text: "Onboarding cancelado ou não concluído." });
      return;
    }
    setLoading(true);
    try {
      const r = await api("/api/ycloud/embedded-signup", { method: "POST", body: { wabaId: sd.waba_id, phoneNumberId: sd.phone_number_id } });
      setStatus({ ok: true, text: `Número +${r.phone} conectado! 🎉` });
      onConnected?.();
    } catch (e) {
      setStatus({ ok: false, text: e.message || "Falha ao concluir o onboarding." });
    } finally { setLoading(false); }
  }

  return (
    <section className="dash-card !p-5">
      <div className="flex items-center gap-2 mb-1.5">
        <span style={dashHeaderIconStyle(EMERALD)}><Zap width={16} height={16} /></span>
        <h3 className="m-0 text-sm font-semibold text-dash-ink">Conectar número oficial (1 clique)</h3>
        <DashBadge color={EMERALD} dot={false}>novo</DashBadge>
      </div>
      <p className="text-[12.5px] text-dash-faint mb-4">Conecte sua conta WhatsApp Business pela Meta sem copiar tokens. O número fica pronto pra usar no Wayvo.</p>
      {!FB_APP_ID ? (
        <div className="rounded-[13px] px-4 py-3 text-xs leading-relaxed"
          style={{ background: `${AMBER}0f`, border: `1px solid ${AMBER}33`, color: AMBER }}>
          Embedded Signup ainda não configurado no servidor (faltam as variáveis NEXT_PUBLIC_FB_APP_ID / FB_CONFIG_ID / YCLOUD_SOLUTION_ID).
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <DashButton onClick={connect} loading={loading}>
            {loading ? "Conectando..." : "Conectar com a Meta →"}
          </DashButton>
          {status && <span className="text-xs font-medium" style={{ color: status.ok ? GREEN : RED }}>{status.text}</span>}
        </div>
      )}
    </section>
  );
}

/* ════════════════════ NÚMEROS YCLOUD ════════════════════ */
function YCloudNumbersCard() {
  const [list, setList] = useState([]);
  const [limit, setLimit] = useState(1);
  const [phone, setPhone] = useState("");
  const [label, setLabel] = useState("");
  const [err, setErr] = useState("");

  const load = useCallback(() => {
    api("/api/ycloud/numbers").then(d => {
      const arr = Array.isArray(d) ? d : (d?.numbers || []);
      setList(arr);
      if (d?.limit != null) setLimit(d.limit);
    }).catch(() => {});
  }, []);
  useEffect(() => { load(); }, [load]);

  async function add() {
    setErr("");
    if (!phone.trim()) { setErr("Informe o número."); return; }
    try {
      await api("/api/ycloud/numbers", { method: "POST", body: { phone: phone.trim(), label: label.trim() || undefined } });
      setPhone(""); setLabel(""); load();
    } catch (e) { setErr(e.message || "Falha ao cadastrar"); }
  }
  async function remove(id) {
    try { await api(`/api/ycloud/numbers/${id}`, { method: "DELETE" }); load(); } catch {}
  }

  return (
    <section className="dash-card !p-5">
      <div className="flex items-center gap-2 mb-1.5">
        <span style={dashHeaderIconStyle(SLATE)}><Building2 width={16} height={16} /></span>
        <h3 className="m-0 text-sm font-semibold text-dash-ink">Números YCloud (oficial)</h3>
        <span className="ml-auto font-mono text-[11px] text-dash-faint bg-dash-subtle border border-dash-border rounded-full px-2.5 py-0.5">
          {list.length}/{limit} usado(s)
        </span>
      </div>
      <p className="text-[12.5px] text-dash-faint mb-4">Cadastre o número da empresa para receber mensagens dele aqui no Wayvo. Use só dígitos com DDI (ex: 15559850060). Seu plano permite {limit} número(s) oficial(is).</p>

      <div className="flex flex-wrap gap-2 mb-3">
        <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Número (ex: 15559850060)" className="!w-auto flex-1 min-w-[180px]" />
        <Input value={label} onChange={e => setLabel(e.target.value)} placeholder="Apelido (opcional)" className="!w-auto flex-1 min-w-[140px]" />
        <DashButton onClick={add}>Cadastrar</DashButton>
      </div>
      {err && <p className="text-xs mb-2" style={{ color: RED }}>{err}</p>}

      {list.length > 0 ? (
        <div className="space-y-1.5">
          {list.map(n => (
            <div key={n.id} className="flex items-center gap-2 text-xs bg-dash-subtle border border-dash-border rounded-[12px] px-3 py-2">
              <span className="font-medium text-dash-ink">+{n.phone}</span>
              {n.label && <span className="text-dash-faint">· {n.label}</span>}
              <button onClick={() => remove(n.id)} className="ml-auto text-dash-faint hover:text-dash-red transition-colors">remover</button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-dash-faint2">Nenhum número cadastrado ainda.</p>
      )}
    </section>
  );
}

/* ════════════════════ PÁGINA PRINCIPAL ════════════════════ */
export default function CanalOficialPage() {
  /* config */
  const [config, setConfig]     = useState(null);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [err, setErr]           = useState("");
  const [ok, setOk]             = useState("");

  const [phoneNumberId, setPhoneNumberId]       = useState("");
  const [businessAccountId, setBusinessAccountId] = useState("");
  const [accessToken, setAccessToken]           = useState("");
  const [verifyToken, setVerifyToken]           = useState("");
  const [appSecret, setAppSecret]               = useState("");

  /* Meta data */
  const [templates, setTemplates]   = useState(null);
  const [account, setAccount]       = useState(null);   // WABA account
  const [quality, setQuality]       = useState(null);   // quality + tier
  const [verify, setVerify]         = useState(null);   // phone verify
  const [logs, setLogs]             = useState(null);
  const [lastSync, setLastSync]     = useState(null);
  const [syncing, setSyncing]       = useState(false);

  /* UI */
  const [connMode, setConnMode]   = useState("meta");   // 'meta' | 'ycloud' — integrações independentes
  const [tplQ, setTplQ]           = useState("");
  const [tplCat, setTplCat]       = useState("");
  const [tplStatus, setTplStatus] = useState("");
  const [mainTab, setMainTab]     = useState("templates"); // 'templates' | 'logs'
  const [modalOpen, setModalOpen] = useState(false);
  const [verifyBlocker, setVerifyBlocker] = useState(false);
  const [testingConn, setTestingConn] = useState(false);
  const [copied, setCopied]           = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
  const [openGuide, setOpenGuide]     = useState(false);

  /* disconnect confirm */
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);

  /* test send */
  const [testTo, setTestTo]           = useState("");
  const [testTemplate, setTestTemplate] = useState("");
  const [testVars, setTestVars]         = useState("");
  const [testing, setTesting]           = useState(false);
  const [testMsg, setTestMsg]           = useState(null);

  /* costs */
  const [estCountry, setEstCountry]   = useState("BR");
  const [estCat, setEstCat]           = useState("MARKETING");
  const [estVolumeDay, setEstVolumeDay] = useState(100);

  /* ── loaders ── */
  const loadConfig = useCallback(async () => {
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
  }, []);

  useEffect(() => { loadConfig(); }, [loadConfig]);

  const loadTemplates = useCallback(() => {
    if (!config?.has_token || !config?.business_account_id) return;
    api("/api/wpp-cloud/templates")
      .then((t) => { setTemplates(Array.isArray(t) ? t : []); })
      .catch(() => setTemplates([]));
  }, [config]);

  const loadAccount = useCallback(() => {
    if (!config?.has_token || !config?.business_account_id) return;
    api("/api/wpp-cloud/account")
      .then(setAccount)
      .catch((e) => setAccount({ _error: e.message || "Erro ao consultar conta Meta" }));
  }, [config]);

  const loadQuality = useCallback(() => {
    if (!config?.has_token) return;
    api("/api/wpp-cloud/quality")
      .then(setQuality)
      .catch((e) => setQuality({ _error: e.message || "Erro ao consultar qualidade" }));
  }, [config]);

  const loadLogs = useCallback(() => {
    api("/api/wpp-cloud/logs").then(setLogs).catch(() => setLogs([]));
  }, []);

  useEffect(() => {
    if (!config) return;
    loadTemplates();
    loadAccount();
    loadQuality();
    loadLogs();
  }, [config, loadTemplates, loadAccount, loadQuality, loadLogs]);

  /* ── Sync global paralelo ── */
  async function syncAll() {
    if (syncing || !config) return;
    setSyncing(true);
    try {
      const r = await api("/api/wpp-cloud/sync", { method: "POST" });
      if (r.verify)    setVerify({ ok: true, ...r.verify });
      if (r.account)   setAccount(r.account);
      if (r.templates) setTemplates(r.templates);
      if (r.quality)   setQuality(r.quality);
      setLastSync(new Date(r.synced_at || Date.now()));
      loadLogs();
    } catch (e) {
      console.error("sync error", e);
    } finally { setSyncing(false); }
  }

  /* ── save config ── */
  async function save(e) {
    e?.preventDefault();
    setErr(""); setOk(""); setSaving(true);
    try {
      if (!phoneNumberId.trim()) return setErr("Phone Number ID é obrigatório");
      if (!verifyToken.trim())   return setErr("Webhook Verify Token é obrigatório");
      const body = {
        phone_number_id: phoneNumberId.trim(),
        business_account_id: businessAccountId.trim() || null,
        webhook_verify_token: verifyToken.trim(),
        app_secret: appSecret.trim() || null,
      };
      if (accessToken.trim()) {
        const tk = accessToken.trim();
        if (/\s/.test(tk) || /;|create\s+table|alter\s+table|select\s|<[a-z]/i.test(tk) || tk.length > 800) {
          return setErr("Isso não parece um Access Token da Meta. Cole apenas o token do System User (EAAxxxxxx…), sem espaços.");
        }
        body.access_token = tk;
      } else if (!config?.has_token) {
        return setErr("Access Token é obrigatório na primeira configuração");
      } else {
        return setErr("Cole o Access Token novamente para atualizar (oculto por segurança)");
      }
      const result = await api("/api/wpp-cloud/config", { method: "POST", body });
      setOk(result?.warning
        ? "Credenciais salvas. Aviso: não foi possível validar o número com a Meta — verifique se o System User tem acesso à conta WABA."
        : "Credenciais validadas e salvas com sucesso.");
      setAccessToken(""); setAppSecret("");
      loadConfig();
    } catch (e) { setErr(e.message); } finally { setSaving(false); }
  }

  async function testConnection() {
    setTestingConn(true); setVerify(null);
    try {
      const r = await api("/api/wpp-cloud/verify");
      setVerify(r);
    } catch (e) { setVerify({ ok: false, error: e.message }); }
    finally { setTestingConn(false); }
  }

  async function sendTest() {
    setTestMsg(null); setTesting(true);
    try {
      const variables = testVars.split(",").map((v) => v.trim()).filter(Boolean);
      // Cada template só existe no idioma em que foi aprovado (ex: hello_world é en_US,
      // não pt_BR) — manda o idioma real do template escolhido, não o default do backend.
      const language = templates?.find((t) => t.name === testTemplate)?.language;
      const r = await api("/api/wpp-cloud/test", {
        method: "POST",
        body: { to: testTo.trim(), template: testTemplate, language, variables },
      });
      setTestMsg({ ok: true, text: `Enviado · ID ${r.messages?.[0]?.id || "—"}` });
    } catch (e) {
      setTestMsg({ ok: false, text: e.message || "Falha no envio" });
    } finally { setTesting(false); }
  }

  async function disconnect() {
    try {
      await api("/api/wpp-cloud/config", { method: "DELETE" });
      setConfig(null); setTemplates(null); setVerify(null); setAccount(null); setQuality(null);
      setPhoneNumberId(""); setBusinessAccountId(""); setVerifyToken("");
      setConfirmDisconnect(false);
      setOk("Configuração removida.");
    } catch (e) { setErr(e.message); setConfirmDisconnect(false); }
  }

  function handleNewTemplate() {
    if (account && account.verification_status !== "verified") {
      setVerifyBlocker(true);
    } else {
      setModalOpen(true);
    }
  }

  const copyWebhook = () => {
    navigator.clipboard?.writeText(WEBHOOK_URL).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); });
  };
  const copyVerifyToken = () => {
    if (!verifyToken.trim()) return;
    navigator.clipboard?.writeText(verifyToken.trim()).then(() => { setCopiedToken(true); setTimeout(() => setCopiedToken(false), 1500); });
  };

  /* ── computed ── */
  const connected = !!config;
  const verStatus = account?.verification_status;
  const verInfo   = VERIFICATION[verStatus] || { label: "—", color: FAINT };
  const qualInfo  = QUALITY[quality?.quality_rating || "UNKNOWN"];
  const tplApproved  = templates ? templates.filter(t => t.status === "APPROVED").length  : null;
  const tplPending   = templates ? templates.filter(t => t.status === "PENDING").length   : null;
  const tplRejected  = templates ? templates.filter(t => t.status === "REJECTED").length  : null;

  const statusCards = [
    {
      icon: Plug, label: "API Oficial",
      value: connected ? "Conectada" : "Não configurada",
      tint: connected ? GREEN : AMBER,
      sub: config?.verified_name || (connected ? "Sistema User ativo" : "configure abaixo"),
      tooltip: "Status da conexão com a API Cloud da Meta",
    },
    {
      icon: KeyRound, label: "Token de acesso",
      value: config?.has_token ? "Configurado" : "Ausente",
      tint: config?.has_token ? GREEN : RED,
      sub: config?.has_token ? "System User permanente" : "obrigatório",
      tooltip: "Access Token do System User — nunca expira se configurado como permanente",
    },
    {
      icon: Webhook, label: "Webhook",
      value: config?.webhook_verify_token ? "Configurado" : "Pendente",
      tint: config?.webhook_verify_token ? BLUE : AMBER,
      sub: "verify token por tenant",
      tooltip: "Cada conta tem seu próprio verify token — seguro e isolado",
    },
    {
      icon: LayoutTemplate, label: "Templates",
      value: templates == null ? "—" : `${templates.length} total`,
      tint: VIOLET,
      sub: templates != null ? `${tplApproved} aprovados · ${tplPending} pendentes · ${tplRejected} rejeitados` : "sincronize para ver",
      tooltip: "Templates oficiais sincronizados da WABA",
    },
    {
      icon: Building2, label: "Conta Meta",
      value: account?._error ? "Sem permissão" : account ? verInfo.label : (config?.business_account_id ? "Carregando…" : "—"),
      tint: account?._error ? RED : verInfo.color,
      sub: account?._error ? "Token sem whatsapp_business_management" : (account?.name || "empresa vinculada"),
      tooltip: account?._error ? account._error : "Status de verificação empresarial da Meta",
    },
    {
      icon: Gauge, label: "Qualidade",
      value: quality?._error ? "Sem permissão" : quality ? qualInfo.label : "—",
      tint: quality?._error ? RED : qualInfo.color,
      sub: quality?._error ? "Token sem whatsapp_business_messaging" : (quality?.messaging_limit_tier ? (TIER_LABEL[quality.messaging_limit_tier] || quality.messaging_limit_tier) : "limite de conversas/dia"),
      tooltip: quality?._error ? quality._error : "Qualidade afeta limites de envio e entrega. Verde = sem restrições.",
    },
  ];

  const filteredTpls = useMemo(() => {
    let out = templates || [];
    if (tplCat)    out = out.filter((t) => t.category === tplCat);
    if (tplStatus) out = out.filter((t) => t.status === tplStatus);
    const q = tplQ.toLowerCase().trim();
    if (q) out = out.filter((t) => (t.name || "").toLowerCase().includes(q));
    return out;
  }, [templates, tplCat, tplStatus, tplQ]);

  const est = useMemo(() => {
    const country = COUNTRIES.find((c) => c.code === estCountry) || COUNTRIES[0];
    const per = (PRICE_BR[estCat] || 0) * country.mult;
    const day = per * Math.max(0, Number(estVolumeDay) || 0);
    return { per, day, month: day * 30, year: day * 365 };
  }, [estCountry, estCat, estVolumeDay]);

  /* ── loading ── */
  if (loading) return (
    <>
      <Topbar title="Canal Oficial" subtitle="Central operacional da API oficial do WhatsApp (Meta)" />
      <div className="page-x space-y-4">
        <Skel className="h-28 !rounded-[20px]" />
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => <Skel key={i} className="h-24 !rounded-[20px]" />)}
        </div>
      </div>
    </>
  );

  /* ── sync button para topbar ── */
  const syncBtn = connected ? (
    <DashButton variant="secondary" onClick={syncAll} disabled={syncing}>
      {syncing ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
      {syncing ? "Sincronizando…" : "Sincronizar Meta"}
    </DashButton>
  ) : null;

  const MODES = [
    { k: "meta",   label: "API Direta (Meta)", icon: ShieldCheck },
    { k: "ycloud", label: "YCloud (BSP)",      icon: Zap },
  ];

  return (
    <>
      <Topbar
        title="Canal Oficial"
        subtitle={lastSync ? `Última sync: ${fmtTime(lastSync)}` : "Central operacional da API oficial do WhatsApp (Meta)"}
        actions={syncBtn}
      />
      <div className="page-x space-y-6">

        {/* ── SELETOR DE INTEGRAÇÃO ── */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center gap-1 p-1 rounded-[14px] bg-dash-subtle border border-dash-border">
            {MODES.map(({ k, label, icon: Icon }) => {
              const active = connMode === k;
              return (
                <button
                  key={k}
                  onClick={() => setConnMode(k)}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-[11px] text-[13px] transition-all duration-150 ${
                    active
                      ? "bg-dash-card text-dash-ink font-semibold shadow-[0_1px_2px_rgba(10,16,32,.08)]"
                      : "text-dash-muted font-medium hover:text-dash-ink"
                  }`}
                >
                  <Icon className="size-3.5" style={active ? { color: EMERALD } : undefined} />
                  {label}
                </button>
              );
            })}
          </div>
          <p className="text-[12px] text-dash-faint">
            Dois caminhos técnicos independentes para o WhatsApp oficial — escolha um.
          </p>
        </div>

        {/* ══════════════ ABA: API DIRETA (META) ══════════════ */}
        {connMode === "meta" && (
        <div className="space-y-6">

        {/* ── HEALTH SCORE ── */}
        <HealthScore config={config} account={account} quality={quality} templates={templates} verify={verify} />

        {/* ── STATUS CARDS ── */}
        <section className="grid grid-cols-2 lg:grid-cols-6 gap-3">
          {statusCards.map((c, i) => <StatusCard key={i} {...c} />)}
        </section>

        <div className="grid lg:grid-cols-[1fr_360px] gap-6 items-start">
          <div className="space-y-6 min-w-0">

            {/* ── TABS: Templates | Logs ── */}
            <div className="flex items-center gap-1 border-b border-dash-border2">
              {[
                { k: "templates", label: "Templates", icon: LayoutTemplate },
                { k: "logs",      label: "Logs",      icon: FileText },
              ].map(({ k, label, icon: Icon }) => (
                <button
                  key={k}
                  onClick={() => { setMainTab(k); if (k === "logs") loadLogs(); }}
                  className={`relative flex items-center gap-1.5 px-4 py-2.5 text-[13px] transition-colors ${
                    mainTab === k ? "text-dash-ink font-semibold" : "text-dash-faint font-medium hover:text-dash-ink2"
                  }`}
                >
                  <Icon className="size-3.5" />
                  {label}
                  {mainTab === k && (
                    <motion.span layoutId="canal-tab" className="absolute left-2 right-2 -bottom-px h-0.5 rounded-full"
                      style={{ background: EMERALD }} />
                  )}
                </button>
              ))}
            </div>

            {/* ── TAB: TEMPLATES ── */}
            <AnimatePresence mode="wait">
              {mainTab === "templates" && (
                <motion.section key="tpl" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="dash-card">
                  <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
                    <div>
                      <h2 className="m-0 text-base font-semibold text-dash-ink">Templates oficiais</h2>
                      <p className="text-xs text-dash-faint mt-0.5">Sincronizados da sua conta WhatsApp Business (Meta)</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {templates != null && (
                        <div className="flex items-center gap-3 text-[11px] text-dash-muted">
                          <span className="flex items-center gap-1.5"><Dot color={GREEN} />{tplApproved} aprovados</span>
                          <span className="flex items-center gap-1.5"><Dot color={AMBER} />{tplPending} pendentes</span>
                          <span className="flex items-center gap-1.5"><Dot color={RED} />{tplRejected} rejeitados</span>
                        </div>
                      )}
                      <DashIconButton onClick={loadTemplates} title="Sincronizar templates">
                        <RefreshCw width={15} height={15} />
                      </DashIconButton>
                      <DashButton onClick={handleNewTemplate}>
                        <Plus className="size-4" /> Novo Template
                      </DashButton>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap mb-4">
                    <div className="relative flex-1 min-w-[180px]">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-dash-placeholder pointer-events-none" />
                      <input value={tplQ} onChange={(e) => setTplQ(e.target.value)} placeholder="Buscar template…"
                        className="dash-input !pl-9" />
                    </div>
                    <Select value={tplCat} onChange={(e) => setTplCat(e.target.value)} className="!w-auto">
                      <option value="">Categoria</option>
                      {CATEGORIES.map((c) => <option key={c} value={c}>{CAT_LABEL[c]}</option>)}
                    </Select>
                    <Select value={tplStatus} onChange={(e) => setTplStatus(e.target.value)} className="!w-auto">
                      <option value="">Status</option>
                      {Object.entries(TPL_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </Select>
                  </div>

                  {templates == null ? (
                    <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skel key={i} className="h-12" />)}</div>
                  ) : !config?.has_token ? (
                    <DashEmptyState
                      icon={LayoutTemplate} accent={EMERALD}
                      title="Sem credenciais Meta"
                      desc="Configure as credenciais Meta para sincronizar seus templates."
                    />
                  ) : filteredTpls.length === 0 ? (
                    <DashEmptyState
                      icon={LayoutTemplate} accent={EMERALD}
                      title="Nenhum template encontrado"
                      desc="Crie um template oficial e envie para aprovação da Meta."
                      cta={!tplQ && !tplCat && !tplStatus ? { label: "Criar primeiro template", icon: Plus, onClick: handleNewTemplate } : undefined}
                    />
                  ) : (
                    <div className="overflow-x-auto -mx-1">
                      <table className="w-full text-sm min-w-[620px]">
                        <thead>
                          <tr className="text-left">
                            <th className="dash-th">Nome</th>
                            <th className="dash-th">Categoria</th>
                            <th className="dash-th">Status</th>
                            <th className="dash-th">Qualidade</th>
                            <th className="dash-th">Idioma</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-dash-border2">
                          {filteredTpls.map((t) => {
                            const st = TPL_STATUS[t.status] || { label: t.status || "—", color: SLATE };
                            const ql = QUALITY[(t.quality_score?.score || "UNKNOWN").toUpperCase()] || QUALITY.UNKNOWN;
                            return (
                              <tr key={t.id || t.name} className="hover:bg-dash-subtle transition-colors">
                                <td className="px-4 py-3 font-medium text-dash-ink truncate max-w-[220px]">{t.name}</td>
                                <td className="px-4 py-3 text-dash-muted">{CAT_LABEL[t.category] || t.category || "—"}</td>
                                <td className="px-4 py-3">
                                  <DashBadge color={st.color}>{st.label}</DashBadge>
                                </td>
                                <td className="px-4 py-3">
                                  <span className="inline-flex items-center gap-1.5 text-[12px] font-medium" style={{ color: ql.color }}>
                                    <Dot color={ql.color} />{ql.label}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-dash-faint uppercase text-[12px]">{t.language || "—"}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </motion.section>
              )}

              {/* ── TAB: LOGS ── */}
              {mainTab === "logs" && (
                <motion.section key="logs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="dash-card">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="m-0 text-base font-semibold text-dash-ink flex items-center gap-2">
                        <FileText className="size-4" style={{ color: EMERALD }} /> Logs de eventos
                      </h2>
                      <p className="text-xs text-dash-faint mt-0.5">Histórico das ações do Canal Oficial</p>
                    </div>
                    <DashIconButton onClick={loadLogs} title="Recarregar logs">
                      <RefreshCw width={15} height={15} />
                    </DashIconButton>
                  </div>

                  {logs == null ? (
                    <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skel key={i} className="h-12" />)}</div>
                  ) : logs.length === 0 ? (
                    <DashEmptyState
                      icon={Clock} accent={SLATE}
                      title="Nenhum evento registrado"
                      desc="Ações como sincronizações e criação de templates aparecem aqui."
                    />
                  ) : (
                    <div className="space-y-1">
                      {logs.map((log) => {
                        const meta = LOG_LABELS[log.action] || { label: log.action, icon: Activity, color: SLATE };
                        const Icon = meta.icon;
                        const resColor = log.result === "ok" ? GREEN : RED;
                        return (
                          <div key={log.id}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-[13px] hover:bg-dash-subtle transition-colors">
                            <span className="size-7 rounded-[9px] flex items-center justify-center border shrink-0"
                              style={{ background: `${meta.color}14`, borderColor: `${meta.color}33` }}>
                              <Icon className="size-3.5" style={{ color: meta.color }} />
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-[13px] font-medium text-dash-ink">{meta.label}</span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                                  style={{ background: `${resColor}14`, color: resColor }}>
                                  {log.result === "ok" ? "✓ ok" : "✕ erro"}
                                </span>
                              </div>
                              {log.error_msg && <p className="text-[11px] truncate" style={{ color: RED }}>{log.error_msg}</p>}
                              {log.details && !log.error_msg && (
                                <p className="text-[11px] text-dash-faint truncate">
                                  {log.details.synced ? `Sincronizou: ${log.details.synced.join(", ")}` :
                                   log.details.name   ? `Template: ${log.details.name}` : JSON.stringify(log.details).slice(0, 80)}
                                </p>
                              )}
                            </div>
                            <span className="text-[10px] text-dash-faint2 shrink-0">{fmtTime(log.created_at)}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </motion.section>
              )}
            </AnimatePresence>

            {/* ── BANNER ── */}
            {!config && (
              <section className="rounded-[16px] px-5 py-4 flex gap-3"
                style={{ background: `${AMBER}0f`, border: `1px solid ${AMBER}33` }}>
                <AlertTriangle className="size-5 shrink-0 mt-0.5" style={{ color: AMBER }} />
                <div>
                  <p className="text-sm font-semibold m-0" style={{ color: AMBER }}>Configure aqui primeiro, depois vá ao Meta</p>
                  <p className="text-xs text-dash-muted leading-relaxed mt-1 m-0">
                    Preencha o formulário abaixo e clique em <strong className="text-dash-ink">Salvar e validar</strong>.
                    Só depois acesse o painel do Meta → WhatsApp → Configuração → Webhooks e cole a URL e o Verify Token.
                  </p>
                </div>
              </section>
            )}

            {/* ── CREDENCIAIS ── */}
            <section className="dash-card">
              <div className="flex items-center justify-between gap-3 flex-wrap mb-5">
                <div>
                  <h2 className="m-0 text-base font-semibold text-dash-ink flex items-center gap-2">
                    <KeyRound className="size-4" style={{ color: EMERALD }} /> Credenciais Meta
                  </h2>
                  <p className="text-xs text-dash-faint mt-0.5">Validadas com a Meta antes de salvar</p>
                </div>
                {config && (
                  <div className="flex items-center gap-2">
                    {config?.has_token && (
                      <DashButton variant="secondary" onClick={testConnection} disabled={testingConn}>
                        {testingConn ? <Loader2 className="size-4 animate-spin" /> : <Plug className="size-4" />} Testar conexão
                      </DashButton>
                    )}
                    {confirmDisconnect ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs" style={{ color: RED }}>Remover configuração?</span>
                        <DashButton variant="danger" onClick={disconnect} className="!px-3 !py-2 !text-xs">Sim</DashButton>
                        <DashButton variant="secondary" onClick={() => setConfirmDisconnect(false)} className="!px-3 !py-2 !text-xs">Não</DashButton>
                      </div>
                    ) : (
                      <DashButton variant="danger" onClick={() => setConfirmDisconnect(true)}>
                        <X className="size-4" /> Remover
                      </DashButton>
                    )}
                  </div>
                )}
              </div>

              {verify && (
                <div className="mb-4 text-sm rounded-[13px] px-4 py-3 font-medium"
                  style={verify.ok
                    ? { background: `${GREEN}0f`, border: `1px solid ${GREEN}33`, color: GREEN }
                    : { background: `${RED}0f`, border: `1px solid ${RED}33`, color: RED }}>
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
                  <Field label="Business Account ID (WABA)" hint="Necessário para templates e info da conta">
                    <Input value={businessAccountId} onChange={(e) => setBusinessAccountId(e.target.value)} placeholder="987654321098765" />
                  </Field>
                </div>
                <Field label="Access Token *" hint="Token do System User permanente — oculto após salvar">
                  <Input type="password" value={accessToken} onChange={(e) => setAccessToken(e.target.value)}
                    placeholder={config?.has_token ? "•••••••• (cole novamente para atualizar)" : "EAAxxxxxx…"} />
                </Field>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="Webhook Verify Token *" hint="Defina qualquer string — use este mesmo valor no painel do Meta">
                    <div className="flex gap-2">
                      <Input value={verifyToken} onChange={(e) => setVerifyToken(e.target.value)} placeholder="meu_token_secreto_123" required className="flex-1" />
                      <DashButton type="button" variant="secondary" onClick={copyVerifyToken} disabled={!verifyToken.trim()} className="!px-3 shrink-0">
                        {copiedToken ? <Check className="size-3.5" style={{ color: GREEN }} /> : <Copy className="size-3.5" />}
                        {copiedToken ? "Copiado" : "Copiar"}
                      </DashButton>
                    </div>
                  </Field>
                  <Field label="App Secret (opcional)" hint="Valida HMAC do webhook">
                    <Input type="password" value={appSecret} onChange={(e) => setAppSecret(e.target.value)}
                      placeholder={config?.has_app_secret ? "•••••••• (preencha p/ atualizar)" : "Do painel do app Meta"} />
                  </Field>
                </div>
                <Field label="URL do Webhook">
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs bg-dash-subtle border border-dash-input rounded-[13px] px-4 py-2.5 break-all font-mono"
                      style={{ color: EMERALD }}>{WEBHOOK_URL}</code>
                    <DashButton type="button" variant="secondary" onClick={copyWebhook} className="!px-3 shrink-0">
                      {copied ? <Check className="size-3.5" style={{ color: GREEN }} /> : <Copy className="size-3.5" />} {copied ? "Copiado" : "Copiar"}
                    </DashButton>
                  </div>
                </Field>
                {config?.webhook_verify_token && (
                  <div className="rounded-[13px] px-4 py-3 flex items-center justify-between gap-3 flex-wrap"
                    style={{ background: `${BLUE}0f`, border: `1px solid ${BLUE}33` }}>
                    <div>
                      <p className="text-[10px] text-dash-faint2 uppercase tracking-wider mb-0.5 font-semibold">Token salvo no banco (use este no Meta)</p>
                      <code className="text-[13px] font-bold font-mono" style={{ color: BLUE }}>{config.webhook_verify_token}</code>
                    </div>
                    <DashButton type="button" variant="secondary" className="!px-3 !py-1.5 !text-xs shrink-0"
                      onClick={() => { navigator.clipboard?.writeText(config.webhook_verify_token); setCopiedToken(true); setTimeout(() => setCopiedToken(false), 1500); }}>
                      {copiedToken ? <Check className="size-3.5" style={{ color: BLUE }} /> : <Copy className="size-3.5" />} {copiedToken ? "Copiado" : "Copiar"}
                    </DashButton>
                  </div>
                )}
                {err && <div className="text-sm rounded-[13px] px-4 py-3" style={{ color: RED, background: `${RED}0f`, border: `1px solid ${RED}29` }}>{err}</div>}
                {ok  && <div className="text-sm rounded-[13px] px-4 py-3" style={{ color: GREEN, background: `${GREEN}0f`, border: `1px solid ${GREEN}29` }}>{ok}</div>}
                <DashButton type="submit" loading={saving}>
                  {saving ? "Validando com a Meta…" : "Salvar e validar"}
                </DashButton>
              </form>
            </section>
          </div>

          {/* ── COLUNA DIREITA ── */}
          <div className="space-y-6">

            {/* CONTA META — detalhes */}
            {(account || config?.business_account_id) && (
              <section className="dash-card">
                <h2 className="m-0 text-base font-semibold text-dash-ink flex items-center gap-2 mb-4">
                  <Building2 className="size-4" style={{ color: EMERALD }} /> Conta Meta
                </h2>
                <div className="space-y-3">
                  {account ? (
                    <>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs text-dash-faint">Empresa</span>
                        <span className="text-xs font-semibold text-dash-ink">{account.name || "—"}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs text-dash-faint">Verificação</span>
                        <span className="text-xs font-semibold flex items-center gap-1.5" style={{ color: verInfo.color }}>
                          <Dot color={verInfo.color} />
                          {verInfo.label}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs text-dash-faint">WABA ID</span>
                        <code className="text-[11px] text-dash-muted font-mono">{account.id || config?.business_account_id}</code>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skel key={i} className="h-5" />)}</div>
                  )}
                  {quality && (
                    <div className="border-t border-dash-border2 pt-3">
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <span className="text-xs text-dash-faint">Qualidade</span>
                        <span className="text-xs font-semibold flex items-center gap-1.5" style={{ color: qualInfo.color }}>
                          <Dot color={qualInfo.color} /> {qualInfo.label}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs text-dash-faint">Limite diário</span>
                        <span className="text-xs font-semibold text-dash-ink">
                          {quality.messaging_limit_tier ? (TIER_LABEL[quality.messaging_limit_tier] || quality.messaging_limit_tier) : "—"}
                        </span>
                      </div>
                    </div>
                  )}
                  <DashButton variant="secondary" onClick={() => { loadAccount(); loadQuality(); }} className="w-full !text-xs mt-1">
                    <RefreshCw className="size-3.5" /> Atualizar status
                  </DashButton>
                </div>
              </section>
            )}

            {/* ESTIMATIVA DE CUSTOS — oculta do cliente final por enquanto (trocar para true p/ reexibir) */}
            {false && (
            <section className="dash-card">
              <h2 className="m-0 text-base font-semibold text-dash-ink flex items-center gap-2">
                <Wallet className="size-4" style={{ color: EMERALD }} /> Estimativa de custos
              </h2>
              <p className="text-xs text-dash-faint mt-0.5 mb-4">Projeção por volume diário de conversas</p>
              <div className="space-y-3">
                <Field label="País">
                  <Select value={estCountry} onChange={(e) => setEstCountry(e.target.value)}>
                    {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
                  </Select>
                </Field>
                <Field label="Categoria">
                  <Select value={estCat} onChange={(e) => setEstCat(e.target.value)}>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{CAT_LABEL[c]}</option>)}
                  </Select>
                </Field>
                <Field label="Volume diário (conversas)">
                  <Input type="number" min={0} value={estVolumeDay} onChange={(e) => setEstVolumeDay(e.target.value)} />
                </Field>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {[
                  ["Por conversa", brl(est.per)],
                  ["Custo/dia",    brl(est.day)],
                  ["Custo/mês",   brl(est.month)],
                  ["Custo/ano",   brl(est.year)],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-[13px] border border-dash-border bg-dash-subtle p-3">
                    <div className="text-[10px] text-dash-faint2 uppercase tracking-wide font-semibold">{k}</div>
                    <div className="text-base font-bold mt-0.5" style={{ color: GREEN }}>{v}</div>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-dash-faint2 mt-3 leading-relaxed">
                Estimativa baseada na tabela Meta vigente para {COUNTRIES.find(c => c.code === estCountry)?.label} (Marketing R$0,34 · Utility R$0,04). Preços podem variar — confirme em{" "}
                <a href="https://business.facebook.com/billing/payment-settings" target="_blank" rel="noreferrer" className="font-semibold hover:underline" style={{ color: GREEN }}>
                  business.facebook.com
                </a>.
              </p>
            </section>
            )}

            {/* DIAGNÓSTICO */}
            <section className="dash-card">
              <h2 className="m-0 text-base font-semibold text-dash-ink flex items-center gap-2">
                <Activity className="size-4" style={{ color: EMERALD }} /> Diagnóstico
              </h2>
              <div className="mt-4 space-y-2.5 text-sm">
                {[
                  ["API Meta",        verify ? (verify.ok ? "Operacional" : "Falha") : (config ? "Configurada" : "Não configurada"), verify ? (verify.ok ? GREEN : RED) : FAINT],
                  ["Conta WABA",      account ? verInfo.label : (config?.business_account_id ? "Sincronize" : "WABA ID pendente"), account ? verInfo.color : FAINT],
                  ["Qualidade",       quality ? qualInfo.label : "—", quality ? qualInfo.color : FAINT],
                  ["Limite diário",   quality?.messaging_limit_tier ? (TIER_LABEL[quality.messaging_limit_tier] || quality.messaging_limit_tier) : "—", FAINT],
                  ["Templates",       templates != null ? `${tplApproved} aprovados` : "—", templates != null && tplApproved > 0 ? GREEN : FAINT],
                  ["Webhook",         config?.webhook_verify_token ? "Configurado" : "Pendente", config?.webhook_verify_token ? BLUE : AMBER],
                  ["Última sync",     lastSync ? fmtTime(lastSync) : "Nunca", SLATE],
                ].map(([k, v, c]) => (
                  <div key={k} className="flex items-center justify-between gap-3">
                    <span className="text-dash-faint text-xs">{k}</span>
                    <span className="text-xs font-medium flex items-center gap-1.5" style={{ color: c }}>
                      <Dot color={c} />{v}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* ENVIAR TESTE */}
            {config?.has_token && (
              <section className="dash-card">
                <h2 className="m-0 text-base font-semibold text-dash-ink flex items-center gap-2">
                  <Plug className="size-4" style={{ color: EMERALD }} /> Enviar teste
                </h2>
                <p className="text-xs text-dash-faint mt-0.5 mb-4">Dispara um template aprovado para validar a operação</p>
                <div className="space-y-3">
                  <Field label="Número destino (com DDI)">
                    <Input value={testTo} onChange={(e) => setTestTo(e.target.value)} placeholder="5511987654321" />
                  </Field>
                  <Field label="Template aprovado">
                    <Select value={testTemplate} onChange={(e) => setTestTemplate(e.target.value)}>
                      <option value="">Selecione…</option>
                      {(templates || []).filter((t) => t.status === "APPROVED").map((t) => (
                        <option key={t.id || t.name} value={t.name}>{t.name} ({t.language})</option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Variáveis (vírgula)" hint="Ex: João, 20%">
                    <Input value={testVars} onChange={(e) => setTestVars(e.target.value)} placeholder="opcional" />
                  </Field>
                  {testMsg && (
                    <div className="text-sm rounded-[13px] px-4 py-2.5 font-medium"
                      style={testMsg.ok
                        ? { background: `${GREEN}0f`, border: `1px solid ${GREEN}33`, color: GREEN }
                        : { background: `${RED}0f`, border: `1px solid ${RED}33`, color: RED }}>
                      {testMsg.text}
                    </div>
                  )}
                  <DashButton onClick={sendTest} loading={testing} disabled={testing || !testTo || !testTemplate} className="w-full">
                    {testing ? "Enviando…" : "Enviar teste"}
                  </DashButton>
                </div>
              </section>
            )}

            {/* GUIA */}
            <section className="dash-card-flush">
              <button onClick={() => setOpenGuide((v) => !v)}
                className="w-full flex items-center justify-between px-6 py-4 text-left">
                <span className="text-sm font-semibold text-dash-ink">Guia de configuração</span>
                <ChevronDown className={`size-4 text-dash-faint transition-transform ${openGuide ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence>
                {openGuide && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden">
                    <div className="px-6 pb-6 space-y-3 border-t border-dash-border2 pt-4">
                      {STEPS.map((s) => (
                        <div key={s.n} className="flex gap-3">
                          <span className="size-6 rounded-full text-[11px] font-bold flex items-center justify-center shrink-0"
                            style={{ background: `${EMERALD}1a`, color: EMERALD }}>{s.n}</span>
                          <div>
                            <div className="text-[13px] font-medium text-dash-ink">{s.t}</div>
                            <div className="text-[11.5px] text-dash-faint leading-relaxed mt-0.5">{s.d}</div>
                          </div>
                        </div>
                      ))}
                      <a href="https://developers.facebook.com" target="_blank" rel="noopener noreferrer"
                        className="inline-block text-[12px] font-semibold hover:underline mt-1" style={{ color: GREEN }}>Abrir Meta for Developers →</a>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </section>
          </div>
        </div>
        </div>
        )}

        {/* ══════════════ ABA: YCLOUD (BSP) ══════════════ */}
        {connMode === "ycloud" && (
        <div className="space-y-6">
          <div className="rounded-[16px] px-5 py-4 flex gap-3"
            style={{ background: `${BLUE}0d`, border: `1px solid ${BLUE}2e` }}>
            <Zap className="size-5 shrink-0 mt-0.5" style={{ color: BLUE }} />
            <p className="text-[12.5px] text-dash-muted leading-relaxed m-0">
              <strong className="text-dash-ink">YCloud é um provedor intermediário (BSP)</strong> que simplifica a conexão
              sem precisar copiar tokens da Meta manualmente. Use isso <strong className="text-dash-ink">OU</strong> a API
              Direta (Meta) — não as duas ao mesmo tempo, a menos que saiba o que está fazendo.
            </p>
          </div>

          {/* ── EMBEDDED SIGNUP ── */}
          <YCloudEmbeddedSignup />

          {/* ── NÚMEROS YCLOUD ── */}
          <YCloudNumbersCard />

          {/* ── TESTE YCLOUD ── */}
          <YCloudTestCard />
        </div>
        )}
      </div>

      {/* ── MODAIS ── */}
      <VerificationModal
        open={verifyBlocker}
        verificationStatus={account?.verification_status}
        onClose={() => setVerifyBlocker(false)}
        onContinue={() => { setVerifyBlocker(false); setModalOpen(true); }}
      />
      <CreateTemplateModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={() => { setModalOpen(false); loadTemplates(); loadLogs(); }}
      />
    </>
  );
}

/* ════════════════ MODAL: CRIAR TEMPLATE ════════════════ */
function CreateTemplateModal({ open, onClose, onCreated }) {
  const [name, setName]         = useState("");
  const [category, setCategory] = useState("MARKETING");
  const [language, setLanguage] = useState("pt_BR");
  const [header, setHeader]     = useState("");
  const [body, setBody]         = useState("");
  const [footer, setFooter]     = useState("");
  const [btn, setBtn]           = useState("");
  const [busy, setBusy]         = useState(false);
  const [err, setErr]           = useState("");
  const [done, setDone]         = useState(false);

  async function submit() {
    setErr("");
    const safeName = name.trim().toLowerCase().replace(/[^a-z0-9_]/g, "_");
    if (!safeName)    return setErr("Informe um nome para o template");
    if (!body.trim()) return setErr("O corpo da mensagem é obrigatório");
    const components = [];
    if (header.trim()) components.push({ type: "HEADER", format: "TEXT", text: header.trim() });
    components.push({ type: "BODY", text: body.trim() });
    if (footer.trim()) components.push({ type: "FOOTER", text: footer.trim() });
    if (btn.trim())    components.push({ type: "BUTTONS", buttons: [{ type: "QUICK_REPLY", text: btn.trim() }] });
    setBusy(true);
    try {
      await api("/api/wpp-cloud/templates", {
        method: "POST",
        body: { name: safeName, language, category, components },
      });
      setDone(true);
      setTimeout(onCreated, 1200);
    } catch (e) {
      const msg = e.message || "Falha ao enviar para a Meta";
      // Toast amigável se for erro de verificação
      if (/verification/i.test(msg)) {
        setErr("A Meta exige verificação empresarial para criar templates. Complete a verificação em business.facebook.com.");
      } else {
        setErr(msg);
      }
    } finally { setBusy(false); }
  }

  const renderVars = (txt) =>
    String(txt || "").split(/(\{\{\d+\}\})/g).map((p, i) =>
      /^\{\{\d+\}\}$/.test(p)
        ? <span key={i} className="font-semibold" style={{ color: EMERALD }}>{p}</span>
        : <span key={i}>{p}</span>
    );

  return (
    <DashModal
      open={open}
      onClose={onClose}
      size="lg"
      title="Criar template oficial"
      subtitle="A Meta analisa o template após o envio (geralmente minutos a 24h)."
      footer={
        <>
          <DashButton variant="secondary" onClick={onClose}>Cancelar</DashButton>
          <DashButton onClick={submit} loading={busy} disabled={busy || done}>
            {done ? "Enviado ✓" : busy ? "Enviando para a Meta…" : "Enviar para aprovação Meta"}
          </DashButton>
        </>
      }
    >
      <div className="grid md:grid-cols-2 gap-5">
        <div className="space-y-4">
          <Field label="Nome do template" hint="Só minúsculas, números e _ (ex: boas_vindas)">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="boas_vindas" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Categoria">
              <Select value={category} onChange={(e) => setCategory(e.target.value)}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{CAT_LABEL[c]}</option>)}
              </Select>
            </Field>
            <Field label="Idioma">
              <Select value={language} onChange={(e) => setLanguage(e.target.value)}>
                {["pt_BR", "en_US", "es_ES"].map((l) => <option key={l} value={l}>{l}</option>)}
              </Select>
            </Field>
          </div>
          <Field label="Cabeçalho (opcional)">
            <Input value={header} onChange={(e) => setHeader(e.target.value)} placeholder="Ex: Oferta especial 🎉" />
          </Field>
          <Field label="Corpo da mensagem *" hint="Use {{1}}, {{2}} para variáveis">
            <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4}
              placeholder="Olá {{1}}! Temos uma condição especial pra você: {{2}} de desconto."
              className="dash-input resize-none" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Rodapé (opcional)">
              <Input value={footer} onChange={(e) => setFooter(e.target.value)} placeholder="Responda PARAR para sair" />
            </Field>
            <Field label="Botão CTA (opcional)">
              <Input value={btn} onChange={(e) => setBtn(e.target.value)} placeholder="Quero saber mais" />
            </Field>
          </div>
          {err && <div className="text-sm rounded-[13px] px-4 py-3" style={{ color: RED, background: `${RED}0f`, border: `1px solid ${RED}29` }}>{err}</div>}
        </div>

        {/* Pré-visualização */}
        <div className="rounded-[16px] border border-dash-border bg-dash-subtle p-5 flex flex-col">
          <div className="dash-section-label !mb-3">Pré-visualização</div>
          <div className="flex-1 flex items-start">
            <div className="max-w-[92%] rounded-[14px] rounded-tl-sm bg-white border border-dash-border px-3.5 py-2.5 shadow-[0_1px_3px_rgba(10,16,32,.07)]">
              {header && <div className="text-[13px] font-bold mb-1 text-dash-ink">{renderVars(header)}</div>}
              <div className="text-[13px] leading-snug whitespace-pre-wrap break-words text-dash-ink2">
                {body ? renderVars(body) : <span className="text-dash-placeholder italic">Corpo da mensagem aparece aqui…</span>}
              </div>
              {footer && <div className="text-[11px] text-dash-faint mt-1.5">{footer}</div>}
              <div className="text-[9px] text-dash-faint2 text-right mt-1">agora</div>
              {btn && (
                <div className="mt-2 -mx-3.5 -mb-2.5 border-t border-dash-border2 pt-2 text-center text-[12px] font-semibold" style={{ color: BLUE }}>
                  {btn}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashModal>
  );
}

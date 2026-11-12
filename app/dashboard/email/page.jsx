"use client";
import { useEffect, useState } from "react";
import { Mail, ListChecks, Rocket } from "lucide-react";
import Topbar from "../../../components/dashboard/Topbar";
import { api } from "../../../lib/api";
import {
  DashButton, DashBadge, DashEmptyState,
} from "../../../components/dashboard/DashUI";
import { DASH_ACCENT, dashHeaderIconStyle } from "../../../components/dashboard/dashTheme";

const ACCENT = DASH_ACCENT.purple || "#8b5cf6";

const STATUS = {
  pending:   { label: "Pendente",  color: DASH_ACCENT.amber },
  scheduled: { label: "Agendado",  color: DASH_ACCENT.amber },
  sending:   { label: "Enviando",  color: DASH_ACCENT.blue },
  completed: { label: "Concluído", color: DASH_ACCENT.green },
  failed:    { label: "Falhou",    color: DASH_ACCENT.red },
  paused:    { label: "Pausado",   color: DASH_ACCENT.amber },
  cancelled: { label: "Cancelado", color: DASH_ACCENT.red },
};

function DashField({ label, children, hint }) {
  return (
    <div>
      <label className="text-xs text-dash-faint2 uppercase tracking-wider font-semibold">{label}</label>
      <div className="mt-1.5">{children}</div>
      {hint && <div className="text-xs text-dash-faint mt-1">{hint}</div>}
    </div>
  );
}

export default function EmailPage() {
  const [balance, setBalance]   = useState(0);
  const [base, setBase]         = useState(0);
  const [paid, setPaid]         = useState(0);
  const [packages, setPackages] = useState([]);
  const [lists, setLists]       = useState([]);
  const [contacts, setContacts] = useState("");
  const [subject, setSubject]   = useState("");
  const [html, setHtml]         = useState("");
  const [title, setTitle]       = useState("");
  const [history, setHistory]   = useState([]);
  const [loading, setLoading]   = useState(false);
  const [err, setErr]           = useState("");
  const [ok, setOk]             = useState("");
  const [tab, setTab]           = useState("html"); // "html" | "preview"

  async function load() {
    try {
      const b = await api("/api/email/balance");
      setBalance(b.credits);
      setBase(b.base ?? 0);
      setPaid(b.paid ?? 0);
      setPackages(b.packages);
      const h = await api("/api/email/dispatches");
      setHistory(h);
      const ls = await api("/api/lists").catch(() => []);
      setLists(Array.isArray(ls) ? ls : []);
    } catch (e) { setErr(e.message); }
  }
  useEffect(() => { load(); }, []);

  function importList(listId) {
    const list = lists.find((l) => l.id === listId);
    if (!list) return;
    const cs = Array.isArray(list.contacts) ? list.contacts : [];
    const lines = cs.map((c) => {
      const email = String(c.EMAIL || c.email || c.Email || "").trim();
      const name  = c.NOME || c.name || c.nome || c.Nome || "";
      return email ? `${email}${name ? "|" + name : ""}` : null;
    }).filter(Boolean);
    setContacts(lines.join("\n"));
  }

  async function buy(packageId) {
    setErr(""); setOk("");
    try {
      const r = await api("/api/email/purchase", { method: "POST", body: { packageId } });
      window.location.href = r.url;
    } catch (e) { setErr(e.message); }
  }

  function parseContacts() {
    return contacts
      .split(/[\n,;]+/)
      .map((line) => {
        const parts = line.trim().split(/[\t|]/);
        const email = (parts[0] || "").trim();
        const name  = (parts[1] || "").trim();
        return email.includes("@") ? { email, name } : null;
      })
      .filter(Boolean);
  }

  async function dispatch() {
    setErr(""); setOk("");
    const list = parseContacts();
    if (!list.length) return setErr("Adicione pelo menos um e-mail");
    if (!subject.trim()) return setErr("Preencha o assunto");
    if (!html.trim()) return setErr("Escreva o corpo do e-mail");
    if (list.length > balance) return setErr(`Saldo insuficiente: ${balance} créditos, precisa ${list.length}`);
    if (!confirm(`Enviar para ${list.length} contato(s)?`)) return;

    setLoading(true);
    try {
      await api("/api/email/bulk", {
        method: "POST",
        body: { contacts: list, subject, html, title, delaySeconds: 0.5 }
      });
      setOk(`Disparo iniciado para ${list.length} contatos`);
      setContacts(""); setSubject(""); setHtml(""); setTitle("");
      setTimeout(load, 2000);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  const list = parseContacts();

  return (
    <>
      <Topbar
        title="E-mail Marketing"
        subtitle="Dispare e-mails em massa para sua lista"
        actions={
          <div className="flex items-center gap-3 rounded-xl border border-dash-border bg-white px-4 py-2">
            <span style={dashHeaderIconStyle(ACCENT)}>
              <Mail width={16} height={16} />
            </span>
            <div>
              <div className="text-[10px] text-dash-faint uppercase tracking-wider">Saldo total</div>
              <div className="text-sm font-bold text-dash-ink leading-tight">
                {balance.toLocaleString("pt-BR")} <span className="text-xs text-dash-muted font-normal">e-mails</span>
              </div>
              <div className="text-[10px] text-dash-faint mt-0.5">{base.toLocaleString("pt-BR")} base · {paid.toLocaleString("pt-BR")} comprados</div>
            </div>
          </div>
        }
      />

      <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-6 pb-16">

        {/* Pacotes */}
        <section>
          <div className="dash-section-label">Comprar créditos</div>
          <div className="grid sm:grid-cols-3 gap-4">
            {packages.map((p) => (
              <div key={p.id} className="dash-card flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-dash-ink">{p.credits.toLocaleString("pt-BR")}</div>
                  <div className="text-xs text-dash-faint mt-0.5">e-mails</div>
                  <div className="text-dash-faint text-sm mt-1">
                    R$ {(p.amountCents / 100).toFixed(2).replace(".", ",")}
                    <span className="text-xs ml-1">· R$ {(p.amountCents / p.credits / 100).toFixed(4).replace(".", ",")} cada</span>
                  </div>
                </div>
                <DashButton onClick={() => buy(p.id)}>Comprar</DashButton>
              </div>
            ))}
          </div>
        </section>

        {/* Disparo */}
        <section>
          <div className="dash-section-label">Novo disparo</div>
          <div className="dash-card space-y-4">
            <DashField label="Título da campanha (interno)">
              <input value={title} onChange={(e) => setTitle(e.target.value)} className="dash-input" placeholder="Ex: Promoção novembro" />
            </DashField>

            {lists.length > 0 && (
              <DashField label="Importar de uma lista" hint="Puxa e-mail + nome da lista para o campo abaixo.">
                <select onChange={(e) => { if (e.target.value) importList(e.target.value); e.target.value = ""; }}
                  defaultValue="" className="dash-input text-sm">
                  <option value="">Selecione uma lista…</option>
                  {lists.map((l) => (
                    <option key={l.id} value={l.id}>{l.name} ({(l.contacts?.length ?? l.total ?? 0)} contatos)</option>
                  ))}
                </select>
              </DashField>
            )}

            <DashField label={<>Contatos — 1 por linha (<code>email|nome</code>)</>}>
              <textarea value={contacts} onChange={(e) => setContacts(e.target.value)} rows={5}
                className="dash-input font-mono text-sm"
                placeholder={"joao@email.com|João\nmaria@email.com|Maria"} />
              <div className="text-xs text-dash-faint mt-1">→ {list.length} contato(s) válido(s)</div>
            </DashField>

            <DashField label="Assunto">
              <input value={subject} onChange={(e) => setSubject(e.target.value)} className="dash-input"
                placeholder="Ex: Oferta especial para {nome}!" />
            </DashField>

            <DashField label="Corpo do e-mail (HTML)" hint="Variáveis disponíveis: {nome} {email}">
              <div className="flex gap-2 mb-2">
                <button onClick={() => setTab("html")}
                  className={`text-xs px-3 py-1 rounded-lg border ${tab === "html" ? "border-dash-border2 bg-dash-bg2 font-semibold text-dash-ink" : "border-transparent text-dash-faint"}`}>
                  HTML
                </button>
                <button onClick={() => setTab("preview")}
                  className={`text-xs px-3 py-1 rounded-lg border ${tab === "preview" ? "border-dash-border2 bg-dash-bg2 font-semibold text-dash-ink" : "border-transparent text-dash-faint"}`}>
                  Preview
                </button>
              </div>
              {tab === "html" ? (
                <textarea value={html} onChange={(e) => setHtml(e.target.value)} rows={10}
                  className="dash-input font-mono text-sm"
                  placeholder={"<h1>Olá {nome}!</h1>\n<p>Confira nossa oferta especial...</p>"} />
              ) : (
                <div className="border border-dash-border rounded-xl p-4 min-h-[200px] bg-white overflow-auto">
                  {html ? (
                    <iframe srcDoc={html} className="w-full min-h-[200px] border-0" title="preview" sandbox="allow-same-origin" />
                  ) : (
                    <div className="text-dash-faint text-sm">Escreva o HTML para ver o preview.</div>
                  )}
                </div>
              )}
            </DashField>

            {err && <div className="text-sm text-dash-red bg-dash-red/10 border border-dash-red/20 rounded-xl px-4 py-3">{err}</div>}
            {ok && <div className="text-sm rounded-xl px-4 py-3 border" style={{ color: DASH_ACCENT.green, background: `${DASH_ACCENT.green}0f`, borderColor: `${DASH_ACCENT.green}33` }}>{ok}</div>}

            <DashButton onClick={dispatch} disabled={loading || !list.length || !subject.trim() || !html.trim()} loading={loading} className="w-full sm:w-auto">
              <Rocket className="size-4" />
              {loading ? "Enviando..." : `Disparar para ${list.length} contato${list.length !== 1 ? "s" : ""}`}
            </DashButton>
          </div>
        </section>

        {/* Histórico */}
        <section>
          <div className="dash-section-label">Histórico</div>
          {!history.length ? (
            <DashEmptyState icon={ListChecks} accent={ACCENT} title="Nenhum disparo ainda" desc="Seus disparos de e-mail aparecerão aqui." />
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {history.slice().reverse().map((d) => {
                const total  = d.total || 0;
                const sent   = d.sent || 0;
                const failed = d.failed || 0;
                const pct    = total ? Math.round(((sent + failed) / total) * 100) : 0;
                const st     = STATUS[d.status] || { label: d.status || "—", color: DASH_ACCENT.slate };
                return (
                  <div key={d.id} className="dash-card !p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-sm font-medium truncate text-dash-ink">{d.title || "—"}</div>
                      <DashBadge color={st.color} className="shrink-0">{st.label}</DashBadge>
                    </div>
                    <div className="text-[11px] text-dash-faint mt-0.5 truncate">{d.subject}</div>
                    <div className="text-[11px] text-dash-faint mt-1">{new Date(d.created_at).toLocaleString("pt-BR")} · {total} contatos</div>
                    <div className="mt-3 h-1.5 rounded-full bg-dash-border2 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: ACCENT }} />
                    </div>
                    <div className="flex gap-3 mt-2 text-[11px]">
                      <span style={{ color: DASH_ACCENT.green }}>{sent} enviados</span>
                      <span style={{ color: DASH_ACCENT.red }}>{failed} falhas</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </>
  );
}

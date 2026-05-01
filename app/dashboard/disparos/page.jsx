"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Topbar from "../../../components/dashboard/Topbar";
import { Field, Input, Textarea, Select, Button } from "../../../components/ui/Field";
import { api } from "../../../lib/api";

function fmtDate(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
  } catch { return "—"; }
}

const STATUS = {
  pending: { label: "Pendente", cls: "bg-yellow-500/15 text-yellow-300 border-yellow-500/30" },
  scheduled: { label: "⏰ Agendado", cls: "bg-yellow-500/15 text-yellow-300 border-yellow-500/30" },
  sending: { label: "Enviando...", cls: "bg-accent-blue/15 text-accent-blue border-accent-blue/30" },
  completed: { label: "Concluído", cls: "bg-primary/15 text-primary border-primary/30" },
  failed: { label: "Falhou", cls: "bg-red-500/15 text-red-300 border-red-500/30" },
};

export default function DisparosPage() {
  const [wpp, setWpp] = useState(null);
  const [lists, setLists] = useState([]);
  const [leads, setLeads] = useState([]);
  const [dispatches, setDispatches] = useState([]);
  const [usage, setUsage] = useState(null);
  const [messages, setMessages] = useState([{ id: Date.now(), text: "" }]);
  const [listSel, setListSel] = useState("");
  const [contacts, setContacts] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [delay, setDelay] = useState(3);
  const [pauseEvery, setPauseEvery] = useState(25);
  const [pauseDuration, setPauseDuration] = useState(5);
  const [schedule, setSchedule] = useState("");
  const [err, setErr] = useState("");
  const [sending, setSending] = useState(false);
  const textareaRefs = useRef({});

  async function loadAll() {
    const [w, ls, lds, ds, u] = await Promise.all([
      api("/api/whatsapp/status").catch(() => null),
      api("/api/lists").catch(() => []),
      api("/api/leads").catch(() => []),
      api("/api/dispatches").catch(() => []),
      api("/api/usage").catch(() => null),
    ]);
    setWpp(w);
    setLists(Array.isArray(ls) ? ls : ls?.data || []);
    setLeads(Array.isArray(lds) ? lds : lds?.data || []);
    setDispatches(Array.isArray(ds) ? ds : ds?.data || []);
    setUsage(u);
  }
  useEffect(() => { loadAll(); }, []);

  useEffect(() => {
    (async () => {
      if (!listSel) { setContacts([]); setSelected(new Set()); return; }
      if (listSel === "leads") {
        const arr = leads.map(l => ({ phone: l.phone, name: l.name, _leadId: l.id }));
        setContacts(arr);
        setSelected(new Set(arr.map(c => c.phone)));
      } else if (listSel.startsWith("list:")) {
        const id = listSel.replace("list:", "");
        try {
          const list = await api(`/api/lists/${id}`);
          const arr = (list.contacts || []).map(c => ({
            phone: c.NUMERO || c.numero || c.phone || "",
            name: c.NOME || c.nome || c.name || "",
          }));
          setContacts(arr);
          setSelected(new Set(arr.map(c => c.phone)));
        } catch { setContacts([]); }
      }
    })();
  }, [listSel, leads]);

  function addMessage() {
    setMessages(m => [...m, { id: Date.now(), text: "" }]);
  }
  function removeMessage(id) {
    setMessages(m => m.length <= 1 ? m : m.filter(x => x.id !== id));
  }
  function updateMessage(id, text) {
    setMessages(m => m.map(x => x.id === id ? { ...x, text } : x));
  }
  function insertVar(id, variable) {
    const ta = textareaRefs.current[id];
    if (!ta) return;
    const start = ta.selectionStart, end = ta.selectionEnd;
    const v = ta.value;
    const next = v.slice(0, start) + variable + v.slice(end);
    updateMessage(id, next);
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(start + variable.length, start + variable.length);
    }, 0);
  }
  function toggle(phone) {
    setSelected(s => {
      const next = new Set(s);
      next.has(phone) ? next.delete(phone) : next.add(phone);
      return next;
    });
  }
  function selectAll() { setSelected(new Set(contacts.map(c => c.phone))); }
  function deselectAll() { setSelected(new Set()); }

  async function sendDispatch() {
    setErr("");
    const msgs = messages.map(m => m.text.trim()).filter(Boolean);
    if (!msgs.length) { setErr("Digite pelo menos uma mensagem"); return; }
    if (!wpp || wpp.status !== "connected") { setErr("Conecte o WhatsApp em Conexões antes de disparar"); return; }
    const phonesArr = contacts.filter(c => selected.has(c.phone));
    if (!phonesArr.length) { setErr("Selecione pelo menos um contato"); return; }

    const phonesWithMsg = phonesArr.map((p, i) => ({
      phone: p.phone,
      name: p.name || "",
      text: msgs[i % msgs.length]
        .replace(/\{nome\}/gi, p.name || "")
        .replace(/\{name\}/gi, p.name || "")
        .replace(/\{numero\}/gi, p.phone || ""),
    }));

    setSending(true);
    try {
      const isLeads = listSel === "leads";
      if (isLeads && msgs.length === 1) {
        const msg = await api("/api/messages", {
          method: "POST",
          body: { title: `Disparo ${new Date().toLocaleDateString("pt-BR")}`, content: msgs[0], tags: [] },
        });
        const contactIds = phonesArr.map(p => p._leadId).filter(Boolean);
        await api("/api/dispatches", {
          method: "POST",
          body: {
            messageId: msg.id,
            contactIds,
            useWhatsapp: true,
            scheduledAt: schedule ? new Date(schedule).toISOString() : undefined,
          },
        });
      } else {
        await api("/api/whatsapp/bulk", {
          method: "POST",
          body: {
            phones: phonesWithMsg,
            message: msgs[0],
            multiMessage: true,
            delay: parseInt(delay) || 3,
            pauseEvery: parseInt(pauseEvery) || 0,
            pauseDuration: parseInt(pauseDuration) || 5,
            scheduledAt: schedule ? new Date(schedule).toISOString() : undefined,
          },
        });
      }
      setSchedule("");
      setMessages([{ id: Date.now(), text: "" }]);
      loadAll();
    } catch (e) {
      setErr(e.message || "Erro no disparo");
    } finally {
      setSending(false);
    }
  }

  const isPro = usage?.plan === "pro";
  const used = usage?.dispatches?.used ?? 0;
  const limit = usage?.dispatches?.limit ?? 3;
  const wppConnected = wpp?.status === "connected";

  return (
    <>
      <Topbar title="Disparos" subtitle="Enviar mensagens em massa para seus contatos" />
      <div className="p-6 lg:p-8 grid lg:grid-cols-[2fr_1fr] gap-6">
        <div className="card p-6 space-y-5">
          <h3 className="font-semibold">🚀 Novo Disparo</h3>

          {!isPro && (
            <div className="text-xs px-3 py-2 rounded-lg bg-white/[0.03] border border-white/10 text-ink-300">
              📊 Disparos este mês: <strong className={used >= limit ? "text-red-400" : "text-ink-100"}>{used}/{limit}</strong>
              {used >= limit && <Link href="/dashboard/minha-conta" className="ml-3 text-primary font-semibold">Upgrade →</Link>}
            </div>
          )}

          {!wppConnected && (
            <div className="text-sm px-4 py-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-300">
              ⚠️ Nenhuma conexão ativa — <Link href="/dashboard/conexoes" className="underline">conecte em Conexões</Link>
            </div>
          )}

          <Field label="Conexão (número de saída)">
            <Select value={wppConnected ? "wpp" : ""} disabled>
              <option value="">{wppConnected ? `📱 WhatsApp Conectado${wpp.phone ? " — +" + wpp.phone : ""}` : "— Sem conexão —"}</option>
              {wppConnected && <option value="wpp">📱 WhatsApp Conectado{wpp.phone ? ` — +${wpp.phone}` : ""}</option>}
            </Select>
          </Field>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-ink-100">
                Mensagens <span className="text-xs text-ink-500 font-normal">(cada número recebe 1 em sequência)</span>
              </label>
              <button type="button" onClick={addMessage} className="text-xs text-primary hover:underline">+ Adicionar Mensagem</button>
            </div>
            <div className="space-y-3">
              {messages.map((m, i) => (
                <div key={m.id} className="rounded-xl border border-white/10 bg-bg/40 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="size-5 rounded-full bg-primary text-bg text-[10px] font-bold flex items-center justify-center">{i + 1}</span>
                      <span className="text-xs font-semibold text-ink-300 uppercase tracking-wide">Mensagem {i + 1}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => insertVar(m.id, "{nome}")} className="text-xs px-2 py-1 rounded bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20">+ {"{nome}"}</button>
                      <button type="button" onClick={() => insertVar(m.id, "{numero}")} className="text-xs px-2 py-1 rounded bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20">+ {"{numero}"}</button>
                      {messages.length > 1 && (
                        <button type="button" onClick={() => removeMessage(m.id)} className="text-xs px-2 py-1 rounded bg-red-500/10 border border-red-500/20 text-red-300 hover:bg-red-500/20">✕ Remover</button>
                      )}
                    </div>
                  </div>
                  <textarea
                    ref={(el) => { textareaRefs.current[m.id] = el; }}
                    value={m.text}
                    onChange={(e) => updateMessage(m.id, e.target.value)}
                    placeholder={`Digite a mensagem ${i + 1} aqui...`}
                    rows={4}
                    className="w-full rounded-lg bg-bg/60 border border-white/10 px-3 py-2 text-sm text-ink-100 placeholder:text-ink-500 outline-none focus:border-primary/60 resize-y"
                  />
                </div>
              ))}
            </div>
            <div className="text-xs text-ink-500 mt-2">💡 Nº1 vai pro contato 1, Nº2 pro contato 2... evita padrão e reduz risco de banimento</div>
          </div>

          <Field label="Lista de Contatos">
            <Select value={listSel} onChange={(e) => setListSel(e.target.value)}>
              <option value="">— Selecione uma lista —</option>
              <option value="leads">👥 Leads do sistema ({leads.length})</option>
              {lists.map(l => (
                <option key={l.id} value={`list:${l.id}`}>📋 {l.name} ({l.total || l.contacts_count || 0} contatos)</option>
              ))}
            </Select>
          </Field>

          {contacts.length > 0 && (
            <div className="rounded-xl border border-white/10 p-3">
              <div className="flex items-center gap-3 text-xs mb-2">
                <button onClick={selectAll} className="text-primary font-medium">Selecionar todos</button>
                <span className="text-ink-500">|</span>
                <button onClick={deselectAll} className="text-ink-300">Desmarcar todos</button>
                <span className="ml-auto text-ink-500">{selected.size} selecionados</span>
              </div>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {contacts.map((c) => (
                  <label key={c.phone} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-white/[0.04] cursor-pointer text-sm">
                    <input
                      type="checkbox"
                      checked={selected.has(c.phone)}
                      onChange={() => toggle(c.phone)}
                      className="accent-primary"
                    />
                    <span className="flex-1 truncate">{c.name || "—"}</span>
                    <span className="text-xs text-ink-500 font-mono">{c.phone}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-xl border border-white/10 bg-bg/40 p-4 space-y-3">
            <div className="text-xs font-semibold text-ink-300 uppercase tracking-wide">⏱️ Configurações de envio</div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Delay entre msgs (seg)" hint="Recomendado: 3–10 seg">
                <Input type="number" min={1} max={60} value={delay} onChange={(e) => setDelay(e.target.value)} />
              </Field>
              <Field label="Pausar a cada X msgs" hint="0 = sem pausa">
                <Input type="number" min={0} max={1000} value={pauseEvery} onChange={(e) => setPauseEvery(e.target.value)} />
              </Field>
            </div>
            {parseInt(pauseEvery) > 0 && (
              <Field label="Duração da pausa (minutos)">
                <Input type="number" min={1} max={60} value={pauseDuration} onChange={(e) => setPauseDuration(e.target.value)} />
              </Field>
            )}
          </div>

          <Field label="⏰ Agendar envio (opcional)" hint="Deixe em branco para disparar imediatamente">
            <Input type="datetime-local" value={schedule} onChange={(e) => setSchedule(e.target.value)} />
          </Field>

          {err && <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{err}</div>}

          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => { setMessages([{ id: Date.now(), text: "" }]); setListSel(""); setSchedule(""); setErr(""); }}>Cancelar</Button>
            <Button onClick={sendDispatch} loading={sending} className="flex-1">🚀 Disparar Mensagens</Button>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Histórico de Disparos</h3>
            <button onClick={loadAll} className="text-xs text-ink-300 hover:text-primary">🔄</button>
          </div>
          {dispatches.length === 0 ? (
            <p className="text-sm text-ink-500 text-center py-6">Nenhum disparo realizado</p>
          ) : (
            <div className="space-y-3">
              {dispatches.slice().reverse().map((d) => {
                const total = d.total || d.recipients_count || 0;
                const sent = d.sent || 0;
                const failed = d.failed || 0;
                const pct = total ? Math.round(((sent + failed) / total) * 100) : 0;
                const s = STATUS[d.status] || { label: d.status || "—", cls: "bg-white/5 text-ink-300 border-white/10" };
                return (
                  <div key={d.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-sm font-medium truncate">{d.message_title || d.messageTitle || "Disparo"}</div>
                      <span className={`shrink-0 inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border ${s.cls}`}>{s.label}</span>
                    </div>
                    <div className="text-[11px] text-ink-500 mt-1">{fmtDate(d.created_at || d.createdAt)} · {total} contatos</div>
                    <div className="mt-2 h-1 rounded-full bg-white/[0.06] overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="flex gap-3 mt-1.5 text-[11px] text-ink-300">
                      <span>✅ {sent}</span>
                      <span>❌ {failed}</span>
                      <span className="ml-auto">{pct}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

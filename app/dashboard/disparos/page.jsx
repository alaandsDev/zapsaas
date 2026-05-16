"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Topbar from "../../../components/dashboard/Topbar";
import Modal from "../../../components/dashboard/Modal";
import EmptyState from "../../../components/dashboard/EmptyState";
import { Field, Input, Textarea, Select, Button } from "../../../components/ui/Field";
import { api } from "../../../lib/api";

export default function Disparos() {
  const [list, setList] = useState([]);
  const [lists, setLists] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [d, l, m] = await Promise.all([
        api("/api/dispatches").catch(() => []),
        api("/api/lists").catch(() => []),
        api("/api/messages").catch(() => []),
      ]);
      setList(Array.isArray(d) ? d : d?.data || []);
      setLists(Array.isArray(l) ? l : l?.data || []);
      setMessages(Array.isArray(m) ? m : m?.data || []);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  return (
    <>
      <Topbar
        title="Disparos"
        subtitle="Envie sua mensagem para centenas de contatos"
        actions={<Button onClick={() => setOpen(true)}>+ Novo disparo</Button>}
      />
      <div className="p-6 lg:p-8 space-y-6">
        {!loading && list.length > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Disparos", value: list.length, tint: "#00FF88" },
              { label: "Concluídos", value: list.filter((d) => d.status === "completed").length, tint: "#22D3EE" },
              { label: "Em andamento", value: list.filter((d) => ["sending", "pending"].includes(d.status)).length, tint: "#FBBF24" },
              { label: "Destinatários", value: list.reduce((a, d) => a + (d.recipients_count ?? d.total ?? 0), 0), tint: "#7C3AED" },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass p-4"
              >
                <div className="text-[11px] uppercase tracking-wide text-ink-300">{s.label}</div>
                <div className="text-2xl font-bold mt-1.5" style={{ color: s.tint }}>
                  {s.value.toLocaleString("pt-BR")}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {loading ? (
          <div className="glass overflow-hidden">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-white/[0.04] animate-pulse">
                <div className="h-3 flex-1 bg-white/10 rounded" />
                <div className="h-3 w-16 bg-white/10 rounded" />
                <div className="h-5 w-20 bg-white/10 rounded-full" />
                <div className="h-3 w-24 bg-white/10 rounded" />
              </div>
            ))}
          </div>
        ) : list.length === 0 ? (
          <EmptyState
            icon="⚡"
            title="Nenhum disparo ainda"
            desc="Crie seu primeiro disparo e veja as vendas chegando em minutos."
            action={<Button onClick={() => setOpen(true)}>Criar primeiro disparo</Button>}
          />
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass overflow-hidden"
          >
            <table className="w-full">
              <thead className="bg-white/[0.02] border-b border-white/[0.06]">
                <tr className="text-left text-xs uppercase tracking-wider text-ink-500">
                  <th className="px-5 py-3.5 font-medium">Mensagem</th>
                  <th className="px-5 py-3.5 font-medium">Destinatários</th>
                  <th className="px-5 py-3.5 font-medium">Status</th>
                  <th className="px-5 py-3.5 font-medium">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {list.map((d, i) => (
                  <motion.tr
                    key={d.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: Math.min(i * 0.03, 0.4) }}
                    className="group hover:bg-white/[0.03] transition-colors"
                  >
                    <td className="px-5 py-4 text-sm max-w-md truncate group-hover:text-primary transition-colors">{d.message || d.message_preview || "—"}</td>
                    <td className="px-5 py-4 text-sm text-ink-300">{d.recipients_count ?? d.total ?? "—"}</td>
                    <td className="px-5 py-4 text-sm">
                      <Badge status={d.status} />
                    </td>
                    <td className="px-5 py-4 text-sm text-ink-500">{fmtDate(d.created_at)}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        )}
      </div>
      <NewDispatchModal open={open} onClose={() => setOpen(false)} lists={lists} messages={messages} onCreated={load} />
    </>
  );
}

function Badge({ status }) {
  const map = {
    completed: { label: "Concluído", cls: "bg-primary/15 text-primary border-primary/30" },
    sending: { label: "Enviando", cls: "bg-accent-blue/15 text-accent-blue border-accent-blue/30" },
    pending: { label: "Pendente", cls: "bg-yellow-500/15 text-yellow-300 border-yellow-500/30" },
    failed: { label: "Falhou", cls: "bg-red-500/15 text-red-300 border-red-500/30" },
  };
  const s = map[status] || { label: status || "—", cls: "bg-white/5 text-ink-300 border-white/10" };
  return <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border ${s.cls}`}>{s.label}</span>;
}

function fmtDate(d) {
  if (!d) return "—";
  try { return new Date(d).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }); } catch { return d; }
}

function NewDispatchModal({ open, onClose, lists, messages, onCreated }) {
  const [listId, setListId] = useState("");
  const [messageId, setMessageId] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      const body = { list_id: listId };
      if (messageId) body.message_id = messageId;
      else body.message = customMessage;
      await api("/api/dispatches", { method: "POST", body });
      onCreated?.();
      onClose();
      setListId(""); setMessageId(""); setCustomMessage("");
    } catch (e) {
      setErr(e.message || "Falha ao criar disparo");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Novo disparo">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Lista de contatos">
          <Select required value={listId} onChange={(e) => setListId(e.target.value)}>
            <option value="">Selecione uma lista</option>
            {lists.map((l) => <option key={l.id} value={l.id}>{l.name} {l.contacts_count ? `(${l.contacts_count})` : ""}</option>)}
          </Select>
        </Field>
        <Field label="Mensagem salva (opcional)">
          <Select value={messageId} onChange={(e) => setMessageId(e.target.value)}>
            <option value="">Escrever nova mensagem</option>
            {messages.map((m) => <option key={m.id} value={m.id}>{m.title || m.name || (m.content || "").slice(0, 40)}</option>)}
          </Select>
        </Field>
        {!messageId && (
          <Field label="Mensagem" hint="Use {{nome}} para personalizar com o nome do contato">
            <Textarea required={!messageId} value={customMessage} onChange={(e) => setCustomMessage(e.target.value)} placeholder="Olá {{nome}}, temos uma oferta especial pra você..." />
          </Field>
        )}
        {err && <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{err}</div>}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" loading={loading}>Disparar</Button>
        </div>
      </form>
    </Modal>
  );
}

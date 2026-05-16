"use client";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import Topbar from "../../../components/dashboard/Topbar";
import Modal from "../../../components/dashboard/Modal";
import EmptyState from "../../../components/dashboard/EmptyState";
import { Field, Input, Textarea, Button } from "../../../components/ui/Field";
import { api } from "../../../lib/api";

export default function Contatos() {
  const [leads, setLeads] = useState([]);
  const [lists, setLists] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [openLead, setOpenLead] = useState(false);
  const [openList, setOpenList] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [l, ls] = await Promise.all([
        api("/api/leads").catch(() => []),
        api("/api/lists").catch(() => []),
      ]);
      setLeads(Array.isArray(l) ? l : l?.data || []);
      setLists(Array.isArray(ls) ? ls : ls?.data || []);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const term = q.toLowerCase().trim();
    if (!term) return leads;
    return leads.filter((l) =>
      [l.name, l.phone, l.email, l.tag].filter(Boolean).join(" ").toLowerCase().includes(term)
    );
  }, [q, leads]);

  async function delLead(id) {
    if (!confirm("Remover este contato?")) return;
    await api(`/api/leads/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <>
      <Topbar
        title="Contatos"
        subtitle={`${leads.length} contatos · ${lists.length} listas`}
        actions={
          <>
            <Button variant="ghost" onClick={() => setOpenList(true)}>+ Lista</Button>
            <Button onClick={() => setOpenLead(true)}>+ Contato</Button>
          </>
        }
      />
      <div className="p-6 lg:p-8 space-y-6">
        {lists.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {lists.map((l) => (
              <motion.span
                key={l.id}
                whileHover={{ y: -2 }}
                className="glass px-3.5 py-1.5 text-sm flex items-center gap-2"
              >
                <span className="size-1.5 rounded-full bg-primary" />
                <span className="font-medium">{l.name}</span>
                <span className="text-ink-500">{l.contacts_count || 0}</span>
              </motion.span>
            ))}
          </div>
        )}
        <Input placeholder="Buscar por nome, telefone, e-mail..." value={q} onChange={(e) => setQ(e.target.value)} />
        {loading ? (
          <div className="glass overflow-hidden">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-3.5 border-b border-white/[0.04] animate-pulse">
                <div className="h-3 w-40 bg-white/10 rounded" />
                <div className="h-3 w-28 bg-white/10 rounded" />
                <div className="h-5 w-16 bg-white/10 rounded-full ml-auto" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="👥"
            title={leads.length === 0 ? "Nenhum contato ainda" : "Nenhum contato encontrado"}
            desc={leads.length === 0 ? "Adicione contatos manualmente ou importe sua lista." : "Tente outro termo de busca."}
            action={leads.length === 0 && <Button onClick={() => setOpenLead(true)}>Adicionar primeiro contato</Button>}
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
                  <th className="px-5 py-3.5 font-medium">Nome</th>
                  <th className="px-5 py-3.5 font-medium">Telefone</th>
                  <th className="px-5 py-3.5 font-medium">Tag</th>
                  <th className="px-5 py-3.5 font-medium">Status</th>
                  <th className="px-5 py-3.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filtered.map((l, i) => (
                  <motion.tr
                    key={l.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: Math.min(i * 0.02, 0.4) }}
                    className="group hover:bg-white/[0.03] transition-colors"
                  >
                    <td className="px-5 py-3.5 text-sm font-medium group-hover:text-primary transition-colors">{l.name || "—"}</td>
                    <td className="px-5 py-3.5 text-sm text-ink-300">{l.phone || "—"}</td>
                    <td className="px-5 py-3.5 text-sm">{l.tag && <span className="inline-flex px-2.5 py-1 rounded-full text-xs bg-accent-purple/15 text-accent-purple border border-accent-purple/30">{l.tag}</span>}</td>
                    <td className="px-5 py-3.5 text-sm text-ink-300">{l.status || "Novo"}</td>
                    <td className="px-5 py-3.5 text-right">
                      <button onClick={() => delLead(l.id)} className="text-ink-500 hover:text-red-400 text-sm opacity-0 group-hover:opacity-100 transition-opacity">Remover</button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        )}
      </div>

      <NewLeadModal open={openLead} onClose={() => setOpenLead(false)} onCreated={load} />
      <NewListModal open={openList} onClose={() => setOpenList(false)} onCreated={load} />
    </>
  );
}

function NewLeadModal({ open, onClose, onCreated }) {
  const [form, setForm] = useState({ name: "", phone: "", email: "", tag: "" });
  const [err, setErr] = useState(""); const [loading, setLoading] = useState(false);
  async function submit(e) {
    e.preventDefault(); setErr(""); setLoading(true);
    try {
      await api("/api/leads", { method: "POST", body: form });
      onCreated?.(); onClose(); setForm({ name: "", phone: "", email: "", tag: "" });
    } catch (e) { setErr(e.message); } finally { setLoading(false); }
  }
  return (
    <Modal open={open} onClose={onClose} title="Novo contato">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Nome"><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
        <Field label="Telefone (com DDD)"><Input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="11999999999" /></Field>
        <Field label="E-mail"><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
        <Field label="Tag"><Input value={form.tag} onChange={(e) => setForm({ ...form, tag: e.target.value })} placeholder="cliente vip, lead-quente..." /></Field>
        {err && <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{err}</div>}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" loading={loading}>Adicionar</Button>
        </div>
      </form>
    </Modal>
  );
}

function NewListModal({ open, onClose, onCreated }) {
  const [name, setName] = useState(""); const [contacts, setContacts] = useState("");
  const [err, setErr] = useState(""); const [loading, setLoading] = useState(false);
  async function submit(e) {
    e.preventDefault(); setErr(""); setLoading(true);
    try {
      const items = contacts.split(/\r?\n/).map(l => l.trim()).filter(Boolean).map(line => {
        const [name, phone] = line.split(/[,;\t]/).map(s => s?.trim());
        return phone ? { name, phone } : { name: "", phone: name };
      });
      await api("/api/lists", { method: "POST", body: { name, contacts: items } });
      onCreated?.(); onClose(); setName(""); setContacts("");
    } catch (e) { setErr(e.message); } finally { setLoading(false); }
  }
  return (
    <Modal open={open} onClose={onClose} title="Nova lista de contatos" size="lg">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Nome da lista"><Input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Clientes VIP, Leads quentes..." /></Field>
        <Field label="Contatos" hint="Um por linha. Formato: Nome, Telefone">
          <Textarea
            value={contacts}
            onChange={(e) => setContacts(e.target.value)}
            placeholder={"Maria Silva, 11999999999\nJoão Santos, 21988887777"}
            className="min-h-[180px] font-mono text-sm"
          />
        </Field>
        {err && <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{err}</div>}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" loading={loading}>Criar lista</Button>
        </div>
      </form>
    </Modal>
  );
}

"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Topbar from "../../../components/dashboard/Topbar";
import Modal from "../../../components/dashboard/Modal";
import EmptyState from "../../../components/dashboard/EmptyState";
import { Field, Input, Select, Button } from "../../../components/ui/Field";
import { api } from "../../../lib/api";

const STATUS = {
  new: { label: "Novo", cls: "bg-primary/15 text-primary border-primary/30" },
  contacted: { label: "Contactado", cls: "bg-accent-blue/15 text-accent-blue border-accent-blue/30" },
  converted: { label: "Convertido", cls: "bg-yellow-500/15 text-yellow-300 border-yellow-500/30" },
};

function fmtDate(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" });
  } catch { return "—"; }
}

export default function LeadsPage() {
  const [leads, setLeads] = useState([]);
  const [lists, setLists] = useState([]);
  const [q, setQ] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [openLead, setOpenLead] = useState(false);
  const [openImport, setOpenImport] = useState(false);
  const [openListView, setOpenListView] = useState(null);
  const [editLead, setEditLead] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const [l, ls] = await Promise.all([
        api("/api/leads").catch(() => []),
        api("/api/lists").catch(() => []),
      ]);
      setLeads(Array.isArray(l) ? l : l?.data || []);
      setLists(Array.isArray(ls) ? ls : ls?.data || []);
    } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    let out = leads;
    const term = q.toLowerCase().trim();
    if (term) out = out.filter(l => [l.name, l.phone, l.interest].filter(Boolean).join(" ").toLowerCase().includes(term));
    if (filterStatus) out = out.filter(l => l.status === filterStatus);
    return out;
  }, [q, leads, filterStatus]);

  async function delLead(id) {
    if (!confirm("Remover este lead?")) return;
    await api(`/api/leads/${id}`, { method: "DELETE" });
    load();
  }

  async function delList(id, name) {
    if (!confirm(`Remover a lista "${name}"?`)) return;
    await api(`/api/lists/${id}`, { method: "DELETE" });
    load();
  }

  function exportCSV() {
    const rows = [["Nome", "Telefone", "Interesse", "Status", "Data"]];
    filtered.forEach(l => rows.push([l.name || "", l.phone || "", l.interest || "", l.status || "", l.createdAt || l.created_at || ""]));
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `leads_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <Topbar
        title="Leads"
        subtitle={`${leads.length} leads · ${lists.length} listas`}
        actions={
          <>
            <Button variant="ghost" onClick={() => setShowFilters(v => !v)}>Filtros</Button>
            <Button variant="ghost" onClick={exportCSV}>Exportar</Button>
            <Button variant="ghost" onClick={() => setOpenImport(true)}>Importar</Button>
            <Button onClick={() => setOpenLead(true)}>+ Novo Lead</Button>
          </>
        }
      />
      <div className="p-6 lg:p-8 space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[240px]">
            <Input placeholder="Buscar por nome, telefone, interesse..." value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          {showFilters && (
            <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="max-w-[200px]">
              <option value="">Todos os status</option>
              <option value="new">Novo</option>
              <option value="contacted">Contactado</option>
              <option value="converted">Convertido</option>
            </Select>
          )}
        </div>

        {lists.length > 0 && (
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Listas de Contatos</h3>
              <span className="text-xs text-ink-500">{lists.length} listas</span>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {lists.map((l) => (
                <div key={l.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-4 flex items-center gap-3">
                  <div className="size-10 rounded-lg bg-primary/15 flex items-center justify-center">📋</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{l.name}</div>
                    <div className="text-xs text-ink-500">{l.total || l.contacts_count || 0} contatos · {fmtDate(l.created_at)}</div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => setOpenListView(l)} className="text-ink-300 hover:text-primary px-2 py-1 text-xs">Ver</button>
                    <button onClick={() => delList(l.id, l.name)} className="text-ink-500 hover:text-red-400 px-2 py-1 text-xs">🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {loading ? (
          <div className="card p-12 flex justify-center"><div className="size-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="👥"
            title={leads.length === 0 ? "Nenhum lead ainda" : "Nenhum lead encontrado"}
            desc={leads.length === 0 ? "Adicione manualmente ou importe sua lista." : "Tente outros filtros."}
            action={leads.length === 0 && <Button onClick={() => setOpenLead(true)}>Adicionar primeiro lead</Button>}
          />
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full">
              <thead className="bg-white/[0.02] border-b border-white/[0.06]">
                <tr className="text-left text-xs uppercase tracking-wider text-ink-500">
                  <th className="px-5 py-3 font-medium">Nome</th>
                  <th className="px-5 py-3 font-medium">Telefone</th>
                  <th className="px-5 py-3 font-medium">Interesse</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Data</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filtered.map((l) => {
                  const s = STATUS[l.status] || { label: l.status || "—", cls: "bg-white/5 text-ink-300 border-white/10" };
                  return (
                    <tr key={l.id} className="hover:bg-white/[0.02]">
                      <td className="px-5 py-3.5 text-sm font-medium">{l.name || "—"}</td>
                      <td className="px-5 py-3.5 text-sm text-ink-300">{l.phone || "—"}</td>
                      <td className="px-5 py-3.5 text-sm text-ink-300">{l.interest || "—"}</td>
                      <td className="px-5 py-3.5"><span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border ${s.cls}`}>{s.label}</span></td>
                      <td className="px-5 py-3.5 text-sm text-ink-500">{fmtDate(l.createdAt || l.created_at)}</td>
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <button onClick={() => setEditLead(l)} className="text-ink-300 hover:text-primary text-sm mr-3">Editar</button>
                        <button onClick={() => delLead(l.id)} className="text-ink-500 hover:text-red-400 text-sm">Remover</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <LeadModal open={openLead} onClose={() => setOpenLead(false)} onSaved={load} />
      <LeadModal open={!!editLead} onClose={() => setEditLead(null)} initial={editLead} onSaved={load} />
      <ImportModal open={openImport} onClose={() => setOpenImport(false)} onSaved={load} />
      <ListViewModal list={openListView} onClose={() => setOpenListView(null)} />
    </>
  );
}

function LeadModal({ open, onClose, initial, onSaved }) {
  const [form, setForm] = useState({ name: "", phone: "", interest: "", status: "new" });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(initial ? {
        name: initial.name || "", phone: initial.phone || "",
        interest: initial.interest || "", status: initial.status || "new",
      } : { name: "", phone: "", interest: "", status: "new" });
      setErr("");
    }
  }, [open, initial]);

  async function submit(e) {
    e.preventDefault(); setErr(""); setLoading(true);
    try {
      if (initial?.id) {
        await api(`/api/leads/${initial.id}`, { method: "PATCH", body: form });
      } else {
        await api("/api/leads", { method: "POST", body: form });
      }
      onSaved?.(); onClose();
    } catch (e) { setErr(e.message); } finally { setLoading(false); }
  }

  return (
    <Modal open={open} onClose={onClose} title={initial ? "Editar Lead" : "Novo Lead"}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Nome *"><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
        <Field label="Telefone *"><Input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="11999999999" /></Field>
        <Field label="Interesse">
          <Select value={form.interest} onChange={(e) => setForm({ ...form, interest: e.target.value })}>
            <option value="">Selecione...</option>
            <option>Plano Básico</option>
            <option>Plano Pro</option>
            <option>Plano Enterprise</option>
            <option>Dúvidas gerais</option>
          </Select>
        </Field>
        <Field label="Status">
          <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option value="new">Novo</option>
            <option value="contacted">Contactado</option>
            <option value="converted">Convertido</option>
          </Select>
        </Field>
        {err && <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{err}</div>}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" loading={loading}>{initial ? "Salvar" : "Adicionar"}</Button>
        </div>
      </form>
    </Modal>
  );
}

function ImportModal({ open, onClose, onSaved }) {
  const [name, setName] = useState("");
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) { setName(""); setRows([]); setErr(""); setInfo(""); }
  }, [open]);

  async function readFile(file) {
    if (!file) return;
    setErr(""); setInfo("Lendo arquivo...");
    try {
      const ext = file.name.split(".").pop().toLowerCase();
      let parsed = [];
      if (ext === "csv") {
        const text = await file.text();
        const lines = text.split(/\r?\n/).filter(l => l.trim());
        if (!lines.length) throw new Error("Arquivo vazio");
        const headers = lines[0].split(/[,;]/).map(h => h.trim().replace(/"/g, "").toUpperCase());
        const ni = headers.findIndex(h => h.includes("NOME") || h.includes("NAME"));
        const pi = headers.findIndex(h => h.includes("NUMERO") || h.includes("NUMBER") || h.includes("TELEFONE") || h.includes("PHONE"));
        if (ni === -1 || pi === -1) throw new Error("Colunas NOME e NUMERO não encontradas");
        parsed = lines.slice(1).map(l => {
          const c = l.split(/[,;]/).map(x => x.trim().replace(/"/g, ""));
          return { NOME: c[ni] || "", NUMERO: (c[pi] || "").replace(/\D/g, "") };
        }).filter(r => r.NOME && r.NUMERO);
      } else {
        if (!window.XLSX) {
          await new Promise((res, rej) => {
            const s = document.createElement("script");
            s.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
            s.onload = res; s.onerror = rej;
            document.head.appendChild(s);
          });
        }
        const buf = await file.arrayBuffer();
        const wb = window.XLSX.read(buf, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const raw = window.XLSX.utils.sheet_to_json(ws, { header: 1 });
        if (!raw.length) throw new Error("Planilha vazia");
        const headers = raw[0].map(h => String(h || "").trim().toUpperCase());
        const ni = headers.findIndex(h => h.includes("NOME") || h.includes("NAME"));
        const pi = headers.findIndex(h => h.includes("NUMERO") || h.includes("NUMBER") || h.includes("TELEFONE") || h.includes("PHONE"));
        if (ni === -1 || pi === -1) throw new Error("Colunas NOME e NUMERO não encontradas");
        parsed = raw.slice(1).filter(r => r[ni] && r[pi]).map(r => ({
          NOME: String(r[ni] || "").trim(),
          NUMERO: String(r[pi] || "").replace(/\D/g, ""),
        }));
      }
      if (!parsed.length) throw new Error("Nenhum contato válido");
      setRows(parsed);
      setInfo(`${parsed.length} contatos lidos`);
      if (!name) setName(file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "));
    } catch (e) {
      setErr(e.message); setInfo("");
    }
  }

  async function save() {
    if (!name.trim()) { setErr("Digite um nome para a lista"); return; }
    if (!rows.length) { setErr("Importe um arquivo primeiro"); return; }
    setLoading(true); setErr("");
    try {
      await api("/api/lists", { method: "POST", body: { name: name.trim(), contacts: rows } });
      onSaved?.(); onClose();
    } catch (e) { setErr(e.message); } finally { setLoading(false); }
  }

  return (
    <Modal open={open} onClose={onClose} title="Importar Lista de Contatos" size="lg">
      <div className="space-y-4">
        <Field label="Nome da Lista">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Clientes Janeiro" />
        </Field>
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); readFile(e.dataTransfer.files?.[0]); }}
          className="rounded-xl border-2 border-dashed border-white/10 hover:border-primary/40 hover:bg-primary/[0.03] transition-all p-8 text-center cursor-pointer"
        >
          <div className="text-4xl mb-2">📂</div>
          <h4 className="font-semibold">Clique ou arraste o arquivo aqui</h4>
          <p className="text-xs text-ink-500 mt-1">Formato: Excel (.xlsx) ou CSV (.csv)</p>
          <p className="text-xs text-ink-500">Colunas obrigatórias: <strong>NOME</strong> e <strong>NUMERO</strong></p>
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={(e) => readFile(e.target.files?.[0])}
            className="hidden"
          />
        </div>
        {info && <div className="text-sm text-primary bg-primary/10 border border-primary/20 rounded-xl px-4 py-2">{info}</div>}
        {err && <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{err}</div>}
        {rows.length > 0 && (
          <div className="rounded-xl border border-white/10 max-h-48 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-white/[0.02] sticky top-0">
                <tr className="text-left text-xs text-ink-500">
                  <th className="px-3 py-2">Nome</th>
                  <th className="px-3 py-2">Número</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {rows.slice(0, 30).map((r, i) => (
                  <tr key={i}>
                    <td className="px-3 py-1.5">{r.NOME}</td>
                    <td className="px-3 py-1.5 font-mono text-xs">{r.NUMERO}</td>
                  </tr>
                ))}
                {rows.length > 30 && (
                  <tr><td colSpan={2} className="px-3 py-2 text-xs text-ink-500 italic">...e mais {rows.length - 30}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={save} loading={loading} disabled={!rows.length}>Salvar Lista</Button>
        </div>
      </div>
    </Modal>
  );
}

function ListViewModal({ list, onClose }) {
  const [data, setData] = useState(null);
  useEffect(() => {
    if (!list) { setData(null); return; }
    api(`/api/lists/${list.id}`).then(setData).catch(() => {});
  }, [list]);
  if (!list) return null;
  const contacts = data?.contacts || [];
  return (
    <Modal open={!!list} onClose={onClose} title={list.name} size="lg">
      <div className="text-xs text-ink-500 mb-3">{list.total || contacts.length} contatos · importado {fmtDate(list.created_at)}</div>
      <div className="rounded-xl border border-white/10 max-h-[50vh] overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="bg-white/[0.02] sticky top-0">
            <tr className="text-left text-xs text-ink-500">
              <th className="px-3 py-2">#</th>
              <th className="px-3 py-2">Nome</th>
              <th className="px-3 py-2">Número</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {contacts.map((c, i) => (
              <tr key={i}>
                <td className="px-3 py-1.5 text-ink-500">{i + 1}</td>
                <td className="px-3 py-1.5">{c.NOME || c.nome || c.name || ""}</td>
                <td className="px-3 py-1.5 font-mono text-xs text-ink-300">{c.NUMERO || c.numero || c.phone || ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Modal>
  );
}

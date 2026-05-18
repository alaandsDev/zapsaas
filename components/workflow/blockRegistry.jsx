"use client";
import { useState } from "react";

/* ─────────────────────────────────────────────
   SHARED UI PRIMITIVES
───────────────────────────────────────────── */
const cx = (...c) => c.filter(Boolean).join(" ");

const baseInput =
  "w-full bg-bg/60 border border-white/10 rounded-lg px-3 py-2 text-[13px] outline-none focus:border-primary/50 transition-colors placeholder:text-ink-600";

const baseSelect =
  "w-full bg-bg/60 border border-white/10 rounded-lg px-3 py-2 text-[13px] outline-none focus:border-primary/50 transition-colors appearance-none cursor-pointer";

function F({ label, hint, error, children }) {
  return (
    <div className="space-y-1">
      <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-400">
        {label}
      </label>
      {children}
      {hint && <p className="text-[11px] text-ink-600 leading-relaxed">{hint}</p>}
      {error && <p className="text-[11px] text-red-400 font-medium">{error}</p>}
    </div>
  );
}

function Inp({ ...p }) {
  return <input {...p} className={cx(baseInput, p.className)} />;
}
function Sel({ children, ...p }) {
  return (
    <div className="relative">
      <select {...p} className={cx(baseSelect, p.className)}>
        {children}
      </select>
      <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 size-3.5 text-ink-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6"/></svg>
    </div>
  );
}
function Txt({ ...p }) {
  return <textarea {...p} className={cx(baseInput, "resize-none", p.className)} />;
}
function Btn({ onClick, variant = "ghost", children, className }) {
  return (
    <button
      onClick={onClick}
      className={cx(
        "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-colors",
        variant === "ghost"
          ? "border border-white/10 text-ink-300 hover:bg-white/[0.06] hover:text-ink-100"
          : "bg-primary/15 border border-primary/30 text-primary hover:bg-primary/25",
        className
      )}
    >
      {children}
    </button>
  );
}
function Tag({ label, onRemove, color = "#00FFAE" }) {
  return (
    <span
      className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md border font-medium"
      style={{ background: `${color}15`, borderColor: `${color}35`, color }}
    >
      {label}
      {onRemove && (
        <button onClick={onRemove} className="opacity-60 hover:opacity-100 ml-0.5">✕</button>
      )}
    </span>
  );
}

const VARS = ["{nome}", "{numero}", "{email}", "{empresa}"];

/* ─────────────────────────────────────────────
   1. GATILHO
───────────────────────────────────────────── */
const TRIGGER_TYPES = [
  { value: "new_conversation", label: "Nova conversa" },
  { value: "new_message", label: "Nova mensagem recebida" },
  { value: "lead_created", label: "Lead criado" },
  { value: "tag_applied", label: "Tag aplicada" },
  { value: "campaign_replied", label: "Campanha respondida" },
];

function TriggerEditor({ data, onChange }) {
  const set = (p) => onChange({ ...data, ...p });
  return (
    <div className="space-y-4">
      <F label="Tipo de gatilho">
        <Sel value={data.triggerType || "new_conversation"} onChange={(e) => set({ triggerType: e.target.value })}>
          {TRIGGER_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </Sel>
      </F>
      {data.triggerType === "tag_applied" && (
        <F label="Tag específica (opcional)" hint="Vazio = qualquer tag">
          <Inp value={data.tagFilter || ""} onChange={(e) => set({ tagFilter: e.target.value })} placeholder="ex: Lead Quente" />
        </F>
      )}
      <F label="Descrição (opcional)">
        <Inp value={data.description || ""} onChange={(e) => set({ description: e.target.value })} placeholder="Descreva este gatilho…" />
      </F>
    </div>
  );
}
function TriggerPreview({ data }) {
  const type = TRIGGER_TYPES.find((t) => t.value === (data.triggerType || "new_conversation"));
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-[#00FF88]/20 bg-[#00FF88]/05">
      <span className="text-lg">▶</span>
      <div>
        <div className="text-[12px] font-semibold text-[#00FF88]">{type?.label || "Gatilho"}</div>
        {data.description && <div className="text-[11px] text-ink-400">{data.description}</div>}
      </div>
    </div>
  );
}
function triggerSummary(data) {
  const type = TRIGGER_TYPES.find((t) => t.value === (data.triggerType || "new_conversation"));
  return type?.label || "Gatilho";
}

/* ─────────────────────────────────────────────
   2. MENSAGEM
───────────────────────────────────────────── */
function MessageEditor({ data, onChange }) {
  const set = (p) => onChange({ ...data, ...p });
  const insertVar = (v) => set({ text: (data.text || "") + v });
  return (
    <div className="space-y-4">
      <F label="Texto da mensagem" hint="Use variáveis para personalizar">
        <Txt
          rows={5}
          value={data.text || ""}
          onChange={(e) => set({ text: e.target.value })}
          placeholder={"Olá {nome}! 👋 Como posso ajudar?"}
        />
      </F>
      <F label="Inserir variável">
        <div className="flex flex-wrap gap-1.5 mt-1">
          {VARS.map((v) => (
            <Btn key={v} variant="primary" onClick={() => insertVar(v)}>{v}</Btn>
          ))}
        </div>
      </F>
    </div>
  );
}
function MessagePreview({ data }) {
  return (
    <div className="max-w-[85%] rounded-xl rounded-tl-sm bg-[#202c33] px-3 py-2 shadow-md">
      <div className="text-[12px] leading-snug text-[#e9edef] whitespace-pre-wrap break-words">
        {data.text || <span className="text-ink-500 italic">Mensagem vazia</span>}
      </div>
      <div className="text-[9px] text-ink-500 text-right mt-0.5">agora</div>
    </div>
  );
}
function messageSummary(data) {
  return data.text ? data.text.slice(0, 45) + (data.text.length > 45 ? "…" : "") : "Mensagem vazia";
}

/* ─────────────────────────────────────────────
   3. IMAGEM
───────────────────────────────────────────── */
function ImageEditor({ data, onChange }) {
  const set = (p) => onChange({ ...data, ...p });
  return (
    <div className="space-y-4">
      <F label="URL da imagem" hint="Cole o link direto da imagem (JPG, PNG, WebP)">
        <Inp value={data.url || ""} onChange={(e) => set({ url: e.target.value })} placeholder="https://..." />
      </F>
      {data.url && (
        <div className="rounded-xl overflow-hidden border border-white/10">
          <img src={data.url} alt="preview" className="w-full object-cover max-h-40" onError={(e) => { e.target.style.display = "none"; }} />
        </div>
      )}
      <F label="Legenda (opcional)">
        <Inp value={data.caption || ""} onChange={(e) => set({ caption: e.target.value })} placeholder="Legenda da imagem…" />
      </F>
    </div>
  );
}
function ImagePreview({ data }) {
  return (
    <div className="max-w-[85%] rounded-xl overflow-hidden bg-[#202c33] shadow-md">
      {data.url ? (
        <img src={data.url} alt="img" className="w-full object-cover max-h-32" onError={() => {}} />
      ) : (
        <div className="h-24 flex items-center justify-center text-ink-500 text-[11px]">📷 Imagem não configurada</div>
      )}
      {data.caption && (
        <div className="px-3 py-1.5 text-[11px] text-[#e9edef]">{data.caption}</div>
      )}
      <div className="px-3 pb-1.5 text-[9px] text-ink-500 text-right">agora</div>
    </div>
  );
}
function imageSummary(data) {
  return data.url ? "📷 " + (data.caption || data.url.split("/").pop() || "Imagem") : "Imagem não configurada";
}

/* ─────────────────────────────────────────────
   4. ÁUDIO
───────────────────────────────────────────── */
function AudioEditor({ data, onChange }) {
  const set = (p) => onChange({ ...data, ...p });
  return (
    <div className="space-y-4">
      <F label="URL do áudio" hint="Suporta MP3, OGG, M4A, OPUS">
        <Inp value={data.url || ""} onChange={(e) => set({ url: e.target.value })} placeholder="https://..." />
      </F>
      <F label="Duração estimada (opcional)" hint="ex: 0:30">
        <Inp value={data.duration || ""} onChange={(e) => set({ duration: e.target.value })} placeholder="0:30" />
      </F>
    </div>
  );
}
function AudioPreview({ data }) {
  return (
    <div className="max-w-[85%] rounded-xl bg-[#202c33] px-3 py-2.5 flex items-center gap-3 shadow-md">
      <div className="size-8 rounded-full bg-[#A78BFA]/20 border border-[#A78BFA]/30 flex items-center justify-center shrink-0">
        <svg className="size-4 text-[#A78BFA]" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3v18m-4-14v10M4 9v6m12-12v18m4-14v10"/></svg>
      </div>
      <div className="flex-1 min-w-0">
        <div className="h-1 bg-white/10 rounded-full"><div className="h-full w-1/3 bg-[#A78BFA] rounded-full" /></div>
        <div className="text-[10px] text-ink-500 mt-1">{data.duration || "0:00"}</div>
      </div>
    </div>
  );
}
function audioSummary(data) {
  return data.url ? `🎙️ Áudio${data.duration ? " · " + data.duration : ""}` : "Áudio não configurado";
}

/* ─────────────────────────────────────────────
   5. VÍDEO
───────────────────────────────────────────── */
function VideoEditor({ data, onChange }) {
  const set = (p) => onChange({ ...data, ...p });
  return (
    <div className="space-y-4">
      <F label="URL do vídeo" hint="Suporta MP4, MOV, AVI">
        <Inp value={data.url || ""} onChange={(e) => set({ url: e.target.value })} placeholder="https://..." />
      </F>
      <F label="Legenda (opcional)">
        <Inp value={data.caption || ""} onChange={(e) => set({ caption: e.target.value })} placeholder="Legenda do vídeo…" />
      </F>
    </div>
  );
}
function VideoPreview({ data }) {
  return (
    <div className="max-w-[85%] rounded-xl bg-[#202c33] overflow-hidden shadow-md">
      <div className="h-20 bg-black/40 flex items-center justify-center">
        {data.url ? (
          <div className="size-10 rounded-full bg-[#FB7185]/20 border border-[#FB7185]/30 flex items-center justify-center">
            <svg className="size-5 text-[#FB7185]" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
          </div>
        ) : (
          <span className="text-ink-500 text-[11px]">🎬 Vídeo não configurado</span>
        )}
      </div>
      {data.caption && <div className="px-3 py-1.5 text-[11px] text-[#e9edef]">{data.caption}</div>}
      <div className="px-3 pb-1.5 text-[9px] text-ink-500 text-right">agora</div>
    </div>
  );
}
function videoSummary(data) {
  if (!data.url) return "Vídeo não configurado";
  const name = data.caption || data.url.split("/").pop() || "Vídeo";
  return "🎬 " + name;
}

/* ─────────────────────────────────────────────
   6. DELAY
───────────────────────────────────────────── */
const DELAY_UNITS = [
  { value: "minutes", label: "Minutos" },
  { value: "hours", label: "Horas" },
  { value: "days", label: "Dias" },
];
function DelayEditor({ data, onChange }) {
  const set = (p) => onChange({ ...data, ...p });
  return (
    <div className="space-y-4">
      <F label="Quantidade" hint="Quanto tempo aguardar antes do próximo bloco">
        <Inp
          type="number"
          min={1}
          value={data.amount || 1}
          onChange={(e) => set({ amount: parseInt(e.target.value) || 1 })}
        />
      </F>
      <F label="Unidade">
        <Sel value={data.unit || "minutes"} onChange={(e) => set({ unit: e.target.value })}>
          {DELAY_UNITS.map((u) => <option key={u.value} value={u.value}>{u.label}</option>)}
        </Sel>
      </F>
    </div>
  );
}
function DelayPreview({ data }) {
  const unit = DELAY_UNITS.find((u) => u.value === (data.unit || "minutes"))?.label || "Minutos";
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-[#FBBF24]/20 bg-[#FBBF24]/05 text-[#FBBF24]">
      <span className="text-lg">⏱</span>
      <span className="text-[12px] font-semibold">Aguardar {data.amount || 1} {unit.toLowerCase()}</span>
    </div>
  );
}
function delaySummary(data) {
  const unit = DELAY_UNITS.find((u) => u.value === (data.unit || "minutes"))?.label?.toLowerCase() || "minutos";
  return `⏱ Aguardar ${data.amount || 1} ${unit}`;
}

/* ─────────────────────────────────────────────
   7. CONDIÇÃO
───────────────────────────────────────────── */
const COND_FIELDS = [
  { value: "message_contains", label: "Mensagem contém" },
  { value: "tag_exists", label: "Tag existe" },
  { value: "lead_replied", label: "Lead respondeu" },
  { value: "lead_stage", label: "Etapa do lead" },
  { value: "lead_source", label: "Origem do lead" },
];
const COND_OPS = [
  { value: "equals", label: "É igual a" },
  { value: "contains", label: "Contém" },
  { value: "not_equals", label: "É diferente de" },
  { value: "exists", label: "Existe" },
  { value: "not_exists", label: "Não existe" },
];
function ConditionEditor({ data, onChange }) {
  const set = (p) => onChange({ ...data, ...p });
  const needsValue = !["exists", "not_exists"].includes(data.operator || "contains");
  return (
    <div className="space-y-4">
      <F label="Campo" hint="O que será avaliado">
        <Sel value={data.field || "message_contains"} onChange={(e) => set({ field: e.target.value })}>
          {COND_FIELDS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
        </Sel>
      </F>
      <F label="Operador">
        <Sel value={data.operator || "contains"} onChange={(e) => set({ operator: e.target.value })}>
          {COND_OPS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </Sel>
      </F>
      {needsValue && (
        <F label="Valor" hint="Case-insensitive">
          <Inp value={data.value || ""} onChange={(e) => set({ value: e.target.value })} placeholder="ex: sim, quero, 1…" />
        </F>
      )}
      <div className="grid grid-cols-2 gap-2 pt-1">
        <div className="rounded-lg border border-[#22C55E]/30 bg-[#22C55E]/05 px-3 py-2 text-center">
          <span className="text-[11px] font-bold text-[#22C55E]">✓ SIM</span>
          <p className="text-[10px] text-ink-500 mt-0.5">Saída verdadeira</p>
        </div>
        <div className="rounded-lg border border-red-500/30 bg-red-500/05 px-3 py-2 text-center">
          <span className="text-[11px] font-bold text-red-400">✕ NÃO</span>
          <p className="text-[10px] text-ink-500 mt-0.5">Saída falsa</p>
        </div>
      </div>
    </div>
  );
}
function ConditionPreview({ data }) {
  const field = COND_FIELDS.find((f) => f.value === (data.field || "message_contains"))?.label || "Campo";
  const op = COND_OPS.find((o) => o.value === (data.operator || "contains"))?.label?.toLowerCase() || "contém";
  return (
    <div className="px-3 py-2 rounded-xl border border-[#34D399]/20 bg-[#34D399]/05 space-y-1">
      <div className="text-[10px] text-ink-500 uppercase tracking-wider">Condição</div>
      <div className="text-[12px] text-ink-100">
        <span className="text-[#34D399] font-semibold">{field}</span>{" "}
        {op}{" "}
        {data.value && <span className="font-mono bg-white/5 px-1 rounded">{data.value}</span>}
      </div>
    </div>
  );
}
function conditionSummary(data) {
  const field = COND_FIELDS.find((f) => f.value === (data.field || "message_contains"))?.label || "Campo";
  return `Se ${field.toLowerCase()}${data.value ? ": " + data.value : ""}`;
}

/* ─────────────────────────────────────────────
   8. ESCOLHA
───────────────────────────────────────────── */
function ChoiceEditor({ data, onChange }) {
  const set = (p) => onChange({ ...data, ...p });
  const options = data.options || [""];

  const setOption = (i, v) => {
    const next = [...options];
    next[i] = v;
    set({ options: next });
  };
  const addOption = () => set({ options: [...options, ""] });
  const removeOption = (i) => set({ options: options.filter((_, j) => j !== i) });

  return (
    <div className="space-y-4">
      <F label="Texto da pergunta">
        <Txt rows={2} value={data.question || ""} onChange={(e) => set({ question: e.target.value })} placeholder="O que você precisa hoje?" />
      </F>
      <F label="Opções / botões" hint="Cada opção cria uma saída no canvas">
        <div className="space-y-2 mt-1">
          {options.map((opt, i) => (
            <div key={i} className="flex gap-2 items-center">
              <span className="text-[11px] text-ink-500 w-4 text-right">{i + 1}.</span>
              <Inp
                value={opt}
                onChange={(e) => setOption(i, e.target.value)}
                placeholder={`Opção ${i + 1}…`}
                className="flex-1"
              />
              {options.length > 1 && (
                <button onClick={() => removeOption(i)} className="text-red-400/60 hover:text-red-400 text-lg leading-none">✕</button>
              )}
            </div>
          ))}
          {options.length < 8 && (
            <Btn onClick={addOption} variant="ghost">+ Adicionar opção</Btn>
          )}
        </div>
      </F>
    </div>
  );
}
function ChoicePreview({ data }) {
  const options = data.options?.filter(Boolean) || [];
  return (
    <div className="max-w-[85%] rounded-xl bg-[#202c33] overflow-hidden shadow-md">
      {data.question && (
        <div className="px-3 pt-2.5 pb-1.5 text-[12px] text-[#e9edef]">{data.question}</div>
      )}
      {options.length > 0 && (
        <div className="border-t border-white/10 divide-y divide-white/10">
          {options.map((o, i) => (
            <div key={i} className="py-1.5 px-3 text-[11px] text-[#38BDF8] text-center">{o}</div>
          ))}
        </div>
      )}
      {options.length === 0 && (
        <div className="px-3 py-2 text-[11px] text-ink-500 italic">Nenhuma opção configurada</div>
      )}
    </div>
  );
}
function choiceSummary(data) {
  const n = data.options?.filter(Boolean).length || 0;
  return n > 0 ? `${n} opção${n !== 1 ? "ões" : ""} configurada${n !== 1 ? "s" : ""}` : "Sem opções";
}

/* ─────────────────────────────────────────────
   9. IA
───────────────────────────────────────────── */
const IA_GOALS = [
  { value: "qualify_lead", label: "Qualificar lead" },
  { value: "answer_question", label: "Responder dúvida" },
  { value: "classify_intent", label: "Classificar intenção" },
  { value: "summarize", label: "Resumir conversa" },
  { value: "suggest_offer", label: "Sugerir oferta" },
];
const IA_TONES = [
  { value: "professional", label: "Profissional" },
  { value: "friendly", label: "Amigável" },
  { value: "direct", label: "Direto" },
  { value: "consultive", label: "Consultivo" },
];
function IAEditor({ data, onChange }) {
  const set = (p) => onChange({ ...data, ...p });
  return (
    <div className="space-y-4">
      <F label="Instrução / prompt da IA" hint="Descreva o que a IA deve fazer neste passo">
        <Txt rows={4} value={data.prompt || ""} onChange={(e) => set({ prompt: e.target.value })} placeholder="Ex: Pergunte o objetivo do lead e responda com a melhor oferta disponível." />
      </F>
      <F label="Objetivo">
        <Sel value={data.goal || "qualify_lead"} onChange={(e) => set({ goal: e.target.value })}>
          {IA_GOALS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
        </Sel>
      </F>
      <F label="Tom de voz">
        <Sel value={data.tone || "friendly"} onChange={(e) => set({ tone: e.target.value })}>
          {IA_TONES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </Sel>
      </F>
    </div>
  );
}
function IAPreview({ data }) {
  const goal = IA_GOALS.find((g) => g.value === (data.goal || "qualify_lead"))?.label || "IA";
  return (
    <div className="space-y-1.5">
      <div className="max-w-[85%] rounded-xl bg-[#202c33] px-3 py-2 shadow-md">
        <div className="text-[10px] font-semibold text-[#7C3AED] mb-1">✨ Resposta IA · {goal}</div>
        <div className="text-[11px] text-ink-400 italic">
          {data.prompt ? data.prompt.slice(0, 80) + (data.prompt.length > 80 ? "…" : "") : "Prompt não configurado"}
        </div>
      </div>
    </div>
  );
}
function iaSummary(data) {
  const goal = IA_GOALS.find((g) => g.value === (data.goal || "qualify_lead"))?.label;
  return goal || "IA não configurada";
}

/* ─────────────────────────────────────────────
   10. TAG
───────────────────────────────────────────── */
const TAG_ACTIONS = [
  { value: "add", label: "Adicionar tag" },
  { value: "remove", label: "Remover tag" },
];
function TagEditor({ data, onChange }) {
  const set = (p) => onChange({ ...data, ...p });
  const [input, setInput] = useState("");

  const addTag = () => {
    const v = input.trim();
    if (!v) return;
    const current = data.tags || [];
    if (!current.includes(v)) set({ tags: [...current, v] });
    setInput("");
  };
  const removeTag = (t) => set({ tags: (data.tags || []).filter((x) => x !== t) });

  return (
    <div className="space-y-4">
      <F label="Ação">
        <Sel value={data.action || "add"} onChange={(e) => set({ action: e.target.value })}>
          {TAG_ACTIONS.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
        </Sel>
      </F>
      <F label="Tags" hint="Pressione Enter para adicionar">
        <div className="flex gap-2 mt-1">
          <Inp
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
            placeholder="ex: Lead Quente"
            className="flex-1"
          />
          <Btn onClick={addTag} variant="primary">+</Btn>
        </div>
        {(data.tags || []).length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {(data.tags || []).map((t) => (
              <Tag key={t} label={t} onRemove={() => removeTag(t)} color="#F59E0B" />
            ))}
          </div>
        )}
      </F>
    </div>
  );
}
function TagPreview({ data }) {
  const action = TAG_ACTIONS.find((a) => a.value === (data.action || "add"))?.label || "Adicionar tag";
  const tags = data.tags || [];
  return (
    <div className="flex items-start gap-2 px-3 py-2 rounded-xl border border-[#F59E0B]/20 bg-[#F59E0B]/05">
      <span className="text-base mt-0.5">🏷</span>
      <div>
        <div className="text-[11px] text-ink-400">{action}:</div>
        {tags.length > 0 ? (
          <div className="flex flex-wrap gap-1 mt-1">
            {tags.map((t) => <Tag key={t} label={t} color="#F59E0B" />)}
          </div>
        ) : (
          <div className="text-[11px] text-ink-500 italic">Nenhuma tag configurada</div>
        )}
      </div>
    </div>
  );
}
function tagSummary(data) {
  const action = data.action === "remove" ? "Remover" : "Adicionar";
  const tags = data.tags || [];
  return tags.length > 0 ? `${action}: ${tags.join(", ")}` : "Tag não configurada";
}

/* ─────────────────────────────────────────────
   11. REDIRECIONAR
───────────────────────────────────────────── */
const REDIRECT_DEST = [
  { value: "agent", label: "Atendente" },
  { value: "team", label: "Equipe" },
  { value: "queue", label: "Fila de atendimento" },
  { value: "number", label: "Número específico" },
];
function RedirectEditor({ data, onChange }) {
  const set = (p) => onChange({ ...data, ...p });
  const dest = REDIRECT_DEST.find((d) => d.value === (data.destType || "agent"));
  return (
    <div className="space-y-4">
      <F label="Destino">
        <Sel value={data.destType || "agent"} onChange={(e) => set({ destType: e.target.value })}>
          {REDIRECT_DEST.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
        </Sel>
      </F>
      <F label={`Nome/ID do ${dest?.label?.toLowerCase() || "destino"}`} hint="Informe o nome ou identificador">
        <Inp
          value={data.destValue || ""}
          onChange={(e) => set({ destValue: e.target.value })}
          placeholder={data.destType === "number" ? "5511999999999" : `Nome do ${dest?.label?.toLowerCase()}…`}
        />
      </F>
      <F label="Mensagem ao redirecionar (opcional)">
        <Txt rows={2} value={data.message || ""} onChange={(e) => set({ message: e.target.value })} placeholder="Transferindo para um atendente…" />
      </F>
    </div>
  );
}
function RedirectPreview({ data }) {
  const dest = REDIRECT_DEST.find((d) => d.value === (data.destType || "agent"))?.label || "Atendente";
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-[#F87171]/20 bg-[#F87171]/05">
      <span className="text-base">↪</span>
      <div>
        <div className="text-[11px] text-ink-400">Redirecionando para {dest.toLowerCase()}:</div>
        <div className="text-[12px] font-semibold text-[#F87171]">{data.destValue || "Não configurado"}</div>
        {data.message && <div className="text-[11px] text-ink-400 mt-0.5 italic">"{data.message}"</div>}
      </div>
    </div>
  );
}
function redirectSummary(data) {
  const dest = REDIRECT_DEST.find((d) => d.value === (data.destType || "agent"))?.label || "Atendente";
  return `↪ ${dest}: ${data.destValue || "Não configurado"}`;
}

/* ─────────────────────────────────────────────
   BLOCK REGISTRY
───────────────────────────────────────────── */
export const BLOCK_REGISTRY = {
  trigger: {
    label: "Gatilho",
    color: "#00FF88",
    defaultData: { triggerType: "new_conversation", description: "" },
    Editor: TriggerEditor,
    Preview: TriggerPreview,
    summary: triggerSummary,
    validate: (d) => null,
  },
  message: {
    label: "Mensagem",
    color: "#22D3EE",
    defaultData: { text: "" },
    Editor: MessageEditor,
    Preview: MessagePreview,
    summary: messageSummary,
    validate: (d) => (!d.text?.trim() ? "Texto da mensagem é obrigatório" : null),
  },
  image: {
    label: "Imagem",
    color: "#F472B6",
    defaultData: { url: "", caption: "" },
    Editor: ImageEditor,
    Preview: ImagePreview,
    summary: imageSummary,
    validate: (d) => (!d.url?.trim() ? "URL da imagem é obrigatória" : null),
  },
  audio: {
    label: "Áudio",
    color: "#A78BFA",
    defaultData: { url: "", duration: "" },
    Editor: AudioEditor,
    Preview: AudioPreview,
    summary: audioSummary,
    validate: (d) => (!d.url?.trim() ? "URL do áudio é obrigatória" : null),
  },
  video: {
    label: "Vídeo",
    color: "#FB7185",
    defaultData: { url: "", caption: "" },
    Editor: VideoEditor,
    Preview: VideoPreview,
    summary: videoSummary,
    validate: (d) => (!d.url?.trim() ? "URL do vídeo é obrigatória" : null),
  },
  delay: {
    label: "Delay",
    color: "#FBBF24",
    defaultData: { amount: 1, unit: "minutes" },
    Editor: DelayEditor,
    Preview: DelayPreview,
    summary: delaySummary,
    validate: (d) => (!d.amount || d.amount < 1 ? "Informe um tempo válido" : null),
  },
  condition: {
    label: "Condição",
    color: "#34D399",
    defaultData: { field: "message_contains", operator: "contains", value: "" },
    Editor: ConditionEditor,
    Preview: ConditionPreview,
    summary: conditionSummary,
    validate: (d) => {
      if (!["exists", "not_exists"].includes(d.operator) && !d.value?.trim())
        return "Informe o valor da condição";
      return null;
    },
  },
  choice: {
    label: "Escolha",
    color: "#38BDF8",
    defaultData: { question: "", options: ["", ""] },
    Editor: ChoiceEditor,
    Preview: ChoicePreview,
    summary: choiceSummary,
    validate: (d) => {
      const valid = (d.options || []).filter((o) => o.trim());
      if (valid.length < 2) return "Adicione pelo menos 2 opções";
      return null;
    },
  },
  ia: {
    label: "IA",
    color: "#7C3AED",
    defaultData: { prompt: "", goal: "qualify_lead", tone: "friendly" },
    Editor: IAEditor,
    Preview: IAPreview,
    summary: iaSummary,
    validate: (d) => (!d.prompt?.trim() ? "Instrução da IA é obrigatória" : null),
  },
  tag: {
    label: "Tag",
    color: "#F59E0B",
    defaultData: { action: "add", tags: [] },
    Editor: TagEditor,
    Preview: TagPreview,
    summary: tagSummary,
    validate: (d) => (!(d.tags || []).length ? "Adicione pelo menos uma tag" : null),
  },
  redirect: {
    label: "Redirecionar",
    color: "#F87171",
    defaultData: { destType: "agent", destValue: "", message: "" },
    Editor: RedirectEditor,
    Preview: RedirectPreview,
    summary: redirectSummary,
    validate: (d) => (!d.destValue?.trim() ? "Informe o destino do redirecionamento" : null),
  },
};

/* ─────────────────────────────────────────────
   BLOCK EDITOR PANEL (rendered in right rail)
───────────────────────────────────────────── */
export function BlockEditorPanel({ node, onChange, onDelete }) {
  if (!node) return (
    <div className="p-5 text-center space-y-2">
      <div className="text-3xl opacity-30">🔲</div>
      <p className="text-[12px] text-ink-500 leading-relaxed">
        Selecione um bloco no canvas para editar suas configurações.
      </p>
    </div>
  );

  const kind = node.data?.kind;
  const reg = BLOCK_REGISTRY[kind];
  if (!reg) return (
    <div className="p-5 text-[12px] text-ink-500">Bloco desconhecido: {kind}</div>
  );

  const { Editor, validate, color, label } = reg;
  const error = validate(node.data);
  const handleChange = (patch) => onChange({ ...node, data: { ...node.data, ...patch } });

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="size-2 rounded-full" style={{ background: color }} />
          <span className="text-[13px] font-bold text-ink-100">Editar · {label}</span>
        </div>
        {kind !== "trigger" && (
          <button
            onClick={onDelete}
            className="text-[11px] text-red-400/70 hover:text-red-400 hover:bg-red-500/10 px-2 py-1 rounded-lg transition-colors"
          >
            Remover
          </button>
        )}
      </div>

      {/* Separator */}
      <div className="h-px bg-white/[0.06]" />

      {/* Specific Editor */}
      <Editor data={node.data} onChange={handleChange} />

      {/* Validation feedback */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2">
          <span className="text-red-400 text-base">⚠</span>
          <span className="text-[12px] text-red-300">{error}</span>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   WHATSAPP PREVIEW (updated)
───────────────────────────────────────────── */
export function WorkflowWhatsappPreview({ nodes }) {
  const PREVIEW_KINDS = ["message", "image", "audio", "video", "ia", "choice", "tag", "redirect", "delay"];
  const previewNodes = nodes.filter((n) => PREVIEW_KINDS.includes(n.data?.kind));

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-[260px] rounded-[2rem] border border-white/10 bg-[#0b141a] overflow-hidden shadow-[0_30px_60px_-20px_rgba(0,0,0,0.8)]">
        {/* notch */}
        <div className="absolute left-1/2 -translate-x-1/2 top-1.5 w-16 h-3.5 bg-black rounded-full z-10" />
        {/* header */}
        <div className="flex items-center gap-2.5 px-4 pt-7 pb-3 bg-[#1f2c33]">
          <div className="size-7 rounded-full bg-gradient-to-br from-[#00FF88] to-[#7C3AED] flex items-center justify-center text-bg text-[10px] font-bold shrink-0">
            W
          </div>
          <div>
            <div className="text-[11.5px] font-semibold text-white">Wayvo Bot</div>
            <div className="text-[9px] text-emerald-400 flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" /> online
            </div>
          </div>
        </div>
        {/* messages */}
        <div
          className="h-[360px] overflow-y-auto px-3 py-3 space-y-2"
          style={{ backgroundColor: "#0b141a", backgroundImage: "radial-gradient(rgba(255,255,255,0.02) 1px,transparent 1px)", backgroundSize: "18px 18px" }}
        >
          {previewNodes.length === 0 ? (
            <div className="text-center text-[11px] text-ink-500 mt-20 leading-relaxed">
              Adicione blocos ao canvas<br />para ver o preview ao vivo
            </div>
          ) : (
            previewNodes.map((n) => {
              const reg = BLOCK_REGISTRY[n.data?.kind];
              if (!reg?.Preview) return null;
              return <reg.Preview key={n.id} data={n.data} />;
            })
          )}
        </div>
      </div>
      <p className="text-[10px] text-ink-500 mt-2">Preview ao vivo · WhatsApp</p>
    </div>
  );
}

/* ─────────────────────────────────────────────
   VALIDATE ALL NODES
───────────────────────────────────────────── */
export function validateWorkflow(nodes) {
  const errors = [];
  nodes.forEach((n) => {
    const reg = BLOCK_REGISTRY[n.data?.kind];
    if (!reg) return;
    const err = reg.validate(n.data);
    if (err) errors.push({ id: n.id, label: reg.label, error: err });
  });
  return errors;
}

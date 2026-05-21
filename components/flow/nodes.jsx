"use client";
import { Handle, Position } from "@xyflow/react";

/* ── Design tokens ── */
const NODE_META = {
  trigger:   { label: "Gatilho",    emoji: "▶", color: "#00FF88", bg: "rgba(0,255,136,0.08)",   border: "rgba(0,255,136,0.3)"   },
  message:   { label: "Mensagem",   emoji: "💬", color: "#3B82F6", bg: "rgba(59,130,246,0.08)",  border: "rgba(59,130,246,0.3)"  },
  delay:     { label: "Espera",     emoji: "⏱",  color: "#F59E0B", bg: "rgba(245,158,11,0.08)",  border: "rgba(245,158,11,0.3)"  },
  condition: { label: "Condição",   emoji: "🔀", color: "#7C3AED", bg: "rgba(124,58,237,0.08)",  border: "rgba(124,58,237,0.3)"  },
  action:    { label: "Ação",       emoji: "⚡", color: "#EC4899", bg: "rgba(236,72,153,0.08)",  border: "rgba(236,72,153,0.3)"  },
  tag:       { label: "Tag",        emoji: "🏷",  color: "#06B6D4", bg: "rgba(6,182,212,0.08)",   border: "rgba(6,182,212,0.3)"   },
  ai:        { label: "IA",         emoji: "🤖", color: "#A78BFA", bg: "rgba(167,139,250,0.08)", border: "rgba(167,139,250,0.3)" },
  webhook:   { label: "Webhook",    emoji: "🔗", color: "#F97316", bg: "rgba(249,115,22,0.08)",  border: "rgba(249,115,22,0.3)"  },
  input:     { label: "Input",      emoji: "✏️", color: "#22D3EE", bg: "rgba(34,211,238,0.08)",  border: "rgba(34,211,238,0.3)"  },
};

export { NODE_META };

const handleStyle = {
  width: 10,
  height: 10,
  borderWidth: 2,
  borderColor: "#0B1020",
  background: "#00FF88",
};

function NodeShell({ type, children, hasIn = true, hasOutTop = false, selected, extraHandles }) {
  const meta = NODE_META[type] || NODE_META.action;
  return (
    <div
      className="rounded-2xl min-w-[220px] max-w-[260px] backdrop-blur-sm transition-all duration-150"
      style={{
        background: `linear-gradient(135deg, ${meta.bg}, rgba(15,23,42,0.95))`,
        border: `1px solid ${selected ? meta.color : meta.border}`,
        boxShadow: selected
          ? `0 0 0 2px ${meta.color}30, 0 8px 32px -8px rgba(0,0,0,0.6)`
          : "0 4px 16px -4px rgba(0,0,0,0.5)",
      }}
    >
      {hasIn && <Handle type="target" position={Position.Top} style={handleStyle} />}
      {hasOutTop && <Handle type="source" position={Position.Top} style={{ ...handleStyle, background: meta.color }} />}

      {/* Header */}
      <div className="px-3.5 py-2.5 flex items-center gap-2 border-b" style={{ borderColor: meta.border }}>
        <span className="text-base leading-none">{meta.emoji}</span>
        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: meta.color }}>{meta.label}</span>
        <div className="ml-auto size-1.5 rounded-full" style={{ background: meta.color }} />
      </div>

      {/* Body */}
      <div className="p-3.5 text-sm">{children}</div>

      {extraHandles}

      {!extraHandles && <Handle type="source" position={Position.Bottom} style={{ ...handleStyle, background: meta.color }} />}
    </div>
  );
}

export function TriggerNode({ data, selected }) {
  return (
    <NodeShell type="trigger" hasIn={false} selected={selected}>
      <p className="text-ink-100 font-semibold text-sm">Cliente envia mensagem</p>
      {data.keywords?.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {data.keywords.map((k, i) => (
            <span key={i} className="text-[10px] px-1.5 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20 font-mono">{k}</span>
          ))}
        </div>
      )}
      {!data.keywords?.length && <p className="text-ink-500 text-xs mt-1">Qualquer mensagem</p>}
    </NodeShell>
  );
}

export function MessageNode({ data, selected }) {
  return (
    <NodeShell type="message" selected={selected}>
      <div className="flex items-center gap-1.5 mb-2">
        <span className="text-[10px] uppercase tracking-wider font-bold text-accent-blue/70">
          {data.kind === "image" ? "📷 Imagem" : data.kind === "audio" ? "🎵 Áudio" : "📝 Texto"}
        </span>
        {data.delay > 0 && (
          <span className="text-[10px] text-warning bg-warning/10 border border-warning/20 px-1.5 rounded-md ml-auto">⏱ {data.delay}s</span>
        )}
      </div>
      <p className="text-ink-100 text-xs leading-relaxed line-clamp-3">
        {data.text || <span className="text-ink-500 italic">Configure a mensagem…</span>}
      </p>
    </NodeShell>
  );
}

export function DelayNode({ data, selected }) {
  const v = data.value || 5;
  const u = { s: "segundos", m: "minutos", h: "horas" }[data.unit] || data.unit || "segundos";
  return (
    <NodeShell type="delay" selected={selected}>
      <div className="text-3xl font-black text-ink-100 leading-none">
        {v} <span className="text-sm font-normal text-ink-400">{u}</span>
      </div>
      <p className="text-xs text-ink-500 mt-1">de espera antes do próximo passo</p>
    </NodeShell>
  );
}

export function ConditionNode({ data, selected }) {
  const meta = NODE_META.condition;
  return (
    <div
      className="rounded-2xl min-w-[220px] max-w-[260px] backdrop-blur-sm transition-all duration-150"
      style={{
        background: `linear-gradient(135deg, ${meta.bg}, rgba(15,23,42,0.95))`,
        border: `1px solid ${selected ? meta.color : meta.border}`,
        boxShadow: selected ? `0 0 0 2px ${meta.color}30, 0 8px 32px -8px rgba(0,0,0,0.6)` : "0 4px 16px -4px rgba(0,0,0,0.5)",
      }}
    >
      <Handle type="target" position={Position.Top} style={handleStyle} />

      {/* Header */}
      <div className="px-3.5 py-2.5 flex items-center gap-2 border-b" style={{ borderColor: meta.border }}>
        <span className="text-base">🔀</span>
        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: meta.color }}>Condição</span>
      </div>

      {/* Body */}
      <div className="p-3.5">
        <p className="text-[10px] text-ink-500 uppercase tracking-wider mb-1">Se resposta {data.op === "equals" ? "for igual a" : "contiver"}:</p>
        <p className="text-ink-100 font-semibold text-sm break-words">{data.value || <span className="text-ink-500 italic">Configure a condição…</span>}</p>
      </div>

      {/* Outputs */}
      <div className="grid grid-cols-2 border-t" style={{ borderColor: meta.border }}>
        <div className="py-2.5 text-center text-xs font-bold text-success border-r" style={{ borderColor: meta.border }}>✓ SIM</div>
        <div className="py-2.5 text-center text-xs font-bold text-danger">✕ NÃO</div>
      </div>

      <Handle type="source" id="yes" position={Position.Bottom} style={{ ...handleStyle, left: "25%", background: "#22C55E" }} />
      <Handle type="source" id="no"  position={Position.Bottom} style={{ ...handleStyle, left: "75%", background: "#EF4444" }} />
    </div>
  );
}

export function ActionNode({ data, selected }) {
  return (
    <NodeShell type="action" selected={selected}>
      <p className="text-ink-100 font-semibold text-sm">{data.actionType || "Executar ação"}</p>
      {data.value && <p className="text-xs text-ink-400 mt-1 truncate">{data.value}</p>}
    </NodeShell>
  );
}

export function TagNode({ data, selected }) {
  return (
    <NodeShell type="tag" selected={selected}>
      <p className="text-[10px] text-ink-500 mb-1.5">
        {data.action === "remove" ? "Remover tag:" : "Adicionar tag:"}
      </p>
      {data.tag ? (
        <span className="text-xs px-2 py-1 rounded-lg bg-accent-cyan/15 text-accent-cyan border border-accent-cyan/30 font-semibold">
          🏷 {data.tag}
        </span>
      ) : (
        <span className="text-ink-500 text-xs italic">Configure a tag…</span>
      )}
    </NodeShell>
  );
}

export function AINode({ data, selected }) {
  return (
    <NodeShell type="ai" selected={selected}>
      <div className="flex items-center gap-1.5 mb-2">
        <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">Modelo</span>
        <span className="text-[10px] bg-purple-500/10 text-purple-300 border border-purple-500/20 px-1.5 py-0.5 rounded-md ml-auto">
          {data.model || "GPT-4o"}
        </span>
      </div>
      <p className="text-ink-100 text-xs leading-relaxed line-clamp-3">
        {data.prompt || <span className="text-ink-500 italic">Configure o prompt da IA…</span>}
      </p>
    </NodeShell>
  );
}

export function WebhookNode({ data, selected }) {
  return (
    <NodeShell type="webhook" selected={selected}>
      <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wider">{data.method || "POST"}</span>
      <p className="text-ink-100 text-xs mt-1 truncate font-mono">
        {data.url || <span className="text-ink-500 italic">https://…</span>}
      </p>
    </NodeShell>
  );
}

export function InputNode({ data, selected }) {
  return (
    <NodeShell type="input" selected={selected}>
      <p className="text-ink-300 text-xs mb-1.5">Pergunta ao usuário:</p>
      <p className="text-ink-100 text-sm font-medium line-clamp-2">
        {data.question || <span className="text-ink-500 italic">Configure a pergunta…</span>}
      </p>
      {data.variable && (
        <span className="mt-2 inline-block text-[10px] font-mono bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/20 px-1.5 py-0.5 rounded-md">
          → {data.variable}
        </span>
      )}
    </NodeShell>
  );
}

export const nodeTypes = {
  trigger:   TriggerNode,
  message:   MessageNode,
  delay:     DelayNode,
  condition: ConditionNode,
  action:    ActionNode,
  tag:       TagNode,
  ai:        AINode,
  webhook:   WebhookNode,
  input:     InputNode,
};

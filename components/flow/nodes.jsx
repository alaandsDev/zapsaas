"use client";
import { Handle, Position } from "@xyflow/react";

const baseNode = "rounded-xl border bg-bg2/95 backdrop-blur-sm shadow-lg min-w-[220px]";
const handleClass = "!w-3 !h-3 !border-2 !border-bg !bg-primary";

export const NODE_META = {
  trigger:   { label: "Gatilho",     icon: "▶", color: "from-primary to-primary/60",      border: "border-primary/40" },
  message:   { label: "Mensagem",    icon: "💬", color: "from-accent-blue to-blue-600",  border: "border-accent-blue/40" },
  delay:     { label: "Espera",      icon: "⏱", color: "from-yellow-500 to-yellow-600", border: "border-yellow-500/40" },
  condition: { label: "Condição",    icon: "❓", color: "from-purple-500 to-purple-600", border: "border-purple-500/40" },
  action:    { label: "Ação",        icon: "⚡", color: "from-pink-500 to-pink-600",    border: "border-pink-500/40" },
};

function NodeShell({ type, children, hasIn = true, hasOut = true, selected }) {
  const meta = NODE_META[type];
  return (
    <div className={`${baseNode} ${meta.border} ${selected ? "ring-2 ring-primary" : ""}`}>
      {hasIn && <Handle type="target" position={Position.Top} className={handleClass} />}
      <div className={`px-3 py-2 rounded-t-xl bg-gradient-to-r ${meta.color} text-bg font-semibold text-xs flex items-center gap-2`}>
        <span>{meta.icon}</span>
        <span className="uppercase tracking-wider">{meta.label}</span>
      </div>
      <div className="p-3 text-sm">{children}</div>
      {hasOut && <Handle type="source" position={Position.Bottom} className={handleClass} />}
    </div>
  );
}

export function TriggerNode({ data, selected }) {
  return (
    <NodeShell type="trigger" hasIn={false} selected={selected}>
      <div className="text-ink-100 font-medium">Cliente envia mensagem</div>
      {data.keywords?.length > 0 && (
        <div className="text-xs text-ink-400 mt-1">Palavras: {data.keywords.join(", ")}</div>
      )}
    </NodeShell>
  );
}

export function MessageNode({ data, selected }) {
  return (
    <NodeShell type="message" selected={selected}>
      <div className="text-xs text-ink-400 uppercase tracking-wider mb-1">{data.kind || "texto"}</div>
      <div className="text-ink-100 line-clamp-3">{data.text || "Configure a mensagem..."}</div>
      {data.delay > 0 && <div className="text-xs text-ink-400 mt-2">⏱ delay {data.delay}s</div>}
    </NodeShell>
  );
}

export function DelayNode({ data, selected }) {
  const v = data.value || 5;
  const u = data.unit || "s";
  return (
    <NodeShell type="delay" selected={selected}>
      <div className="text-2xl font-bold text-ink-100">{v} <span className="text-base text-ink-400">{u}</span></div>
      <div className="text-xs text-ink-400 mt-1">de espera</div>
    </NodeShell>
  );
}

export function ConditionNode({ data, selected }) {
  return (
    <div className={`${baseNode} ${NODE_META.condition.border} ${selected ? "ring-2 ring-primary" : ""}`}>
      <Handle type="target" position={Position.Top} className={handleClass} />
      <div className={`px-3 py-2 rounded-t-xl bg-gradient-to-r ${NODE_META.condition.color} text-bg font-semibold text-xs flex items-center gap-2`}>
        <span>{NODE_META.condition.icon}</span>
        <span className="uppercase tracking-wider">{NODE_META.condition.label}</span>
      </div>
      <div className="p-3 text-sm">
        <div className="text-xs text-ink-400">Se resposta {data.op === "equals" ? "for igual a" : "contém"}:</div>
        <div className="text-ink-100 font-medium mt-1 break-words">{data.value || "—"}</div>
      </div>
      <div className="grid grid-cols-2 border-t border-white/10">
        <div className="px-3 py-2 text-center text-xs text-primary border-r border-white/10">SIM ✓</div>
        <div className="px-3 py-2 text-center text-xs text-red-400">NÃO ✗</div>
      </div>
      <Handle type="source" id="yes" position={Position.Bottom} style={{ left: "25%" }} className={handleClass} />
      <Handle type="source" id="no" position={Position.Bottom} style={{ left: "75%" }} className="!w-3 !h-3 !border-2 !border-bg !bg-red-400" />
    </div>
  );
}

export function ActionNode({ data, selected }) {
  const labels = { add_tag: "Adicionar tag", end: "Finalizar fluxo", redirect: "Ir pra outro fluxo" };
  return (
    <NodeShell type="action" hasOut={data.kind !== "end"} selected={selected}>
      <div className="text-ink-100 font-medium">{labels[data.kind] || "Configure a ação"}</div>
      {data.value && <div className="text-xs text-ink-400 mt-1 truncate">{data.value}</div>}
    </NodeShell>
  );
}

export const nodeTypes = {
  trigger: TriggerNode,
  message: MessageNode,
  delay: DelayNode,
  condition: ConditionNode,
  action: ActionNode,
};

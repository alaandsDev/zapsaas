"use client";
import { NODE_META } from "./nodes";

const ITEMS = [
  { type: "message",   desc: "Envia texto, imagem ou áudio" },
  { type: "delay",     desc: "Espera antes do próximo passo" },
  { type: "condition", desc: "Bifurca o fluxo (sim/não)" },
  { type: "action",    desc: "Tag, finalizar ou redirecionar" },
];

export default function BlockSidebar() {
  function onDragStart(e, type) {
    e.dataTransfer.setData("application/zapflow-node", type);
    e.dataTransfer.effectAllowed = "move";
  }
  return (
    <div className="p-4 space-y-3">
      <div className="text-xs text-ink-400 uppercase tracking-wider mb-2">Arraste pro canvas</div>
      {ITEMS.map((it) => {
        const m = NODE_META[it.type];
        return (
          <div
            key={it.type}
            draggable
            onDragStart={(e) => onDragStart(e, it.type)}
            className={`card p-3 cursor-grab active:cursor-grabbing hover:border-primary/40 transition-colors ${m.border}`}
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">{m.icon}</span>
              <span className="font-semibold text-sm">{m.label}</span>
            </div>
            <p className="text-xs text-ink-400 mt-1">{it.desc}</p>
          </div>
        );
      })}
    </div>
  );
}

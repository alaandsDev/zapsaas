"use client";
import { NODE_META } from "./nodes";

const BLOCKS = [
  { type: "trigger",   desc: "Inicia o fluxo" },
  { type: "message",   desc: "Envia texto, imagem ou áudio" },
  { type: "delay",     desc: "Aguarda tempo definido" },
  { type: "condition", desc: "Ramifica por resposta" },
  { type: "input",     desc: "Coleta resposta do usuário" },
  { type: "tag",       desc: "Adiciona ou remove tag" },
  { type: "action",    desc: "Executa uma ação" },
  { type: "ai",        desc: "Processa com IA" },
  { type: "webhook",   desc: "Chama API externa" },
];

export default function BlockSidebar() {
  const onDragStart = (e, type) => {
    e.dataTransfer.setData("application/zapflow-node", type);
    e.dataTransfer.effectAllowed = "move";
  };

  return (
    <aside className="w-56 shrink-0 border-r border-ink-700/60 bg-bg/95 backdrop-blur-xl overflow-y-auto flex flex-col">
      <div className="p-4 border-b border-ink-700/60">
        <p className="text-[11px] font-bold text-ink-400 uppercase tracking-widest">Blocos</p>
        <p className="text-[10px] text-ink-600 mt-0.5">Arraste para o canvas</p>
      </div>
      <div className="p-3 space-y-1.5 flex-1">
        {BLOCKS.map(({ type, desc }) => {
          const meta = NODE_META[type];
          return (
            <div
              key={type}
              draggable
              onDragStart={(e) => onDragStart(e, type)}
              className="flex items-center gap-3 p-2.5 rounded-xl border cursor-grab active:cursor-grabbing hover:border-opacity-60 transition-all group select-none"
              style={{
                background: meta.bg,
                borderColor: meta.border,
              }}
            >
              <span className="text-lg leading-none">{meta.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold" style={{ color: meta.color }}>{meta.label}</p>
                <p className="text-[10px] text-ink-500 truncate">{desc}</p>
              </div>
            </div>
          );
        })}
      </div>
      <div className="p-3 border-t border-ink-700/60">
        <div className="p-3 rounded-xl bg-secondary/10 border border-secondary/20">
          <p className="text-[10px] font-bold text-secondary uppercase tracking-wider mb-1">💡 Dica</p>
          <p className="text-[10px] text-ink-400 leading-relaxed">Conecte os blocos arrastando de uma saída para uma entrada</p>
        </div>
      </div>
    </aside>
  );
}

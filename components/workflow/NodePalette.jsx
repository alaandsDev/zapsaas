"use client";
import { motion } from "framer-motion";
import { NODE_DEFS, NODE_GROUPS } from "./nodeTypes";

export default function NodePalette({ onAdd }) {
  return (
    <div className="w-60 shrink-0 glass m-3 mr-0 flex flex-col overflow-hidden">
      <div className="px-4 py-3.5 border-b border-white/[0.06]">
        <div className="text-sm font-semibold">Blocos</div>
        <div className="text-[11px] text-ink-500">Arraste para o canvas</div>
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
        {NODE_GROUPS.map((group) => (
          <div key={group}>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-ink-500 px-1 mb-1.5">
              {group}
            </div>
            <div className="space-y-1.5">
              {Object.entries(NODE_DEFS)
                .filter(([, d]) => d.group === group)
                .map(([kind, d]) => (
                  <motion.button
                    key={kind}
                    whileHover={{ x: 3 }}
                    whileTap={{ scale: 0.97 }}
                    draggable
                    onDragStart={(e) =>
                      e.dataTransfer.setData("application/zapflow-node", kind)
                    }
                    onClick={() => onAdd(kind)}
                    className="w-full group flex items-center gap-2.5 px-2.5 py-2 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/[0.12] transition-colors text-left"
                  >
                    <span
                      className="size-7 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-110"
                      style={{
                        background: `${d.color}1f`,
                        border: `1px solid ${d.color}44`,
                      }}
                    >
                      <svg
                        className="size-3.5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke={d.color}
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d={d.icon} />
                      </svg>
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[12.5px] font-medium text-ink-100 truncate">
                        {d.label}
                      </span>
                      <span className="block text-[10.5px] text-ink-500 truncate">
                        {d.desc}
                      </span>
                    </span>
                  </motion.button>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

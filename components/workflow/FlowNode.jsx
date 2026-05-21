"use client";
import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { motion } from "framer-motion";
import { NODE_DEFS } from "./nodeTypes";
import { BLOCK_META } from "./blockMeta";

function FlowNodeBase({ id, data, selected }) {
  const def = NODE_DEFS[data.kind] || NODE_DEFS.message;
  const reg = BLOCK_META[data.kind];
  const isTrigger = data.kind === "trigger";
  const isCondition = data.kind === "condition";
  const isChoice = data.kind === "choice";

  // Use registry summary for the body preview
  const summaryText = reg?.summary ? reg.summary(data) : (data.body || "");
  const hasError = reg?.validate ? !!reg.validate(data) : false;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 320, damping: 26 }}
      whileHover={{ y: -2 }}
      className="relative w-[224px] select-none"
    >
      {/* ambient glow */}
      <div
        className="absolute -inset-[6px] rounded-2xl blur-xl transition-opacity duration-300"
        style={{
          background: `radial-gradient(circle at 50% 0%, ${def.color}55, transparent 70%)`,
          opacity: selected ? 0.85 : 0.35,
        }}
      />

      <div
        className="relative rounded-2xl border bg-card/90 backdrop-blur-md overflow-hidden"
        style={{
          borderColor: selected ? def.color : hasError ? "rgba(239,68,68,0.4)" : "rgba(255,255,255,0.08)",
          boxShadow: selected
            ? `0 0 0 1px ${def.color}, 0 14px 40px -14px ${def.color}88`
            : "0 14px 36px -18px rgba(0,0,0,0.7)",
        }}
      >
        {/* color bar */}
        <div
          className="h-1 w-full"
          style={{ background: `linear-gradient(90deg, ${def.color}, transparent)` }}
        />

        {/* header */}
        <div className="flex items-center gap-3 px-3.5 py-3">
          <div
            className="size-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: `${def.color}1f`, border: `1px solid ${def.color}55` }}
          >
            <svg className="size-[18px]" viewBox="0 0 24 24" fill="none" stroke={def.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d={def.icon} />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-semibold text-ink-100 truncate">
              {reg?.label || def.label}
            </div>
            <div className="text-[11px] text-ink-500 truncate">{def.desc}</div>
          </div>
          {hasError && (
            <div className="size-4 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center shrink-0" title="Bloco incompleto">
              <span className="text-red-400 text-[9px] font-bold leading-none">!</span>
            </div>
          )}
        </div>

        {/* summary body */}
        {summaryText && (
          <div className="px-3.5 pb-3 -mt-1">
            <div className="text-[11.5px] leading-snug text-ink-300 bg-bg/50 border border-white/[0.06] rounded-lg px-2.5 py-2 line-clamp-2">
              {summaryText}
            </div>
          </div>
        )}

        {/* condition outputs */}
        {isCondition && (
          <div className="grid grid-cols-2 border-t border-white/[0.06] text-[10px] font-bold">
            <div className="py-2 text-center text-[#22C55E] border-r border-white/[0.06]">✓ SIM</div>
            <div className="py-2 text-center text-red-400">✕ NÃO</div>
          </div>
        )}

        {/* choice outputs */}
        {isChoice && (data.options || []).filter(Boolean).length > 0 && (
          <div className="border-t border-white/[0.06] divide-y divide-white/[0.04]">
            {(data.options || []).filter(Boolean).slice(0, 3).map((o, i) => (
              <div key={i} className="px-3 py-1.5 text-[10px] text-[#38BDF8] truncate">→ {o}</div>
            ))}
            {(data.options || []).filter(Boolean).length > 3 && (
              <div className="px-3 py-1 text-[10px] text-ink-500">+{(data.options || []).filter(Boolean).length - 3} mais</div>
            )}
          </div>
        )}
      </div>

      {/* handles */}
      {!isTrigger && (
        <Handle type="target" position={Position.Left} style={{ borderColor: `${def.color}aa` }} />
      )}
      {isCondition ? (
        <>
          <Handle type="source" id="yes" position={Position.Bottom} style={{ left: "30%", borderColor: "#22C55E", background: "#22C55E33" }} />
          <Handle type="source" id="no"  position={Position.Bottom} style={{ left: "70%", borderColor: "#EF4444", background: "#EF444433" }} />
        </>
      ) : (
        <Handle type="source" position={Position.Right} style={{ borderColor: `${def.color}aa` }} />
      )}
    </motion.div>
  );
}

export default memo(FlowNodeBase);

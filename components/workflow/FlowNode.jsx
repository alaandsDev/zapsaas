"use client";
import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { motion } from "framer-motion";
import { NODE_DEFS } from "./nodeTypes";

function FlowNodeBase({ id, data, selected }) {
  const def = NODE_DEFS[data.kind] || NODE_DEFS.message;
  const isTrigger = data.kind === "trigger";

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
        className="absolute -inset-[6px] rounded-2xl opacity-60 blur-xl transition-opacity duration-300"
        style={{
          background: `radial-gradient(circle at 50% 0%, ${def.color}55, transparent 70%)`,
          opacity: selected ? 0.95 : 0.4,
        }}
      />

      <div
        className="relative rounded-2xl border bg-card/90 backdrop-blur-md overflow-hidden"
        style={{
          borderColor: selected ? def.color : "rgba(255,255,255,0.08)",
          boxShadow: selected
            ? `0 0 0 1px ${def.color}, 0 14px 40px -14px ${def.color}88`
            : "0 14px 36px -18px rgba(0,0,0,0.7)",
        }}
      >
        <div
          className="h-1 w-full"
          style={{ background: `linear-gradient(90deg, ${def.color}, transparent)` }}
        />
        <div className="flex items-center gap-3 px-3.5 py-3">
          <div
            className="size-9 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: `${def.color}1f`,
              border: `1px solid ${def.color}55`,
            }}
          >
            <svg
              className="size-[18px]"
              viewBox="0 0 24 24"
              fill="none"
              stroke={def.color}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d={def.icon} />
            </svg>
          </div>
          <div className="min-w-0">
            <div className="text-[13px] font-semibold text-ink-100 truncate">
              {data.title || def.label}
            </div>
            <div className="text-[11px] text-ink-500 truncate">{def.desc}</div>
          </div>
        </div>
        {data.body && (
          <div className="px-3.5 pb-3 -mt-1">
            <div className="text-[11.5px] leading-snug text-ink-300 bg-bg/50 border border-white/[0.06] rounded-lg px-2.5 py-2 line-clamp-3">
              {data.body}
            </div>
          </div>
        )}
      </div>

      {!isTrigger && (
        <Handle
          type="target"
          position={Position.Left}
          style={{ borderColor: `${def.color}aa` }}
        />
      )}
      <Handle
        type="source"
        position={Position.Right}
        style={{ borderColor: `${def.color}aa` }}
      />
    </motion.div>
  );
}

export default memo(FlowNodeBase);

"use client";
// Pure metadata for each block type — no JSX, no hooks.
// Used by FlowNode (canvas) and blockRegistry (editors/previews).

export const BLOCK_META = {
  trigger: {
    label: "Gatilho",
    color: "#00FF88",
    defaultData: { triggerType: "new_conversation", description: "" },
    validate: () => null,
    summary: (d) => {
      const types = {
        new_conversation: "Nova conversa",
        new_message: "Nova mensagem recebida",
        lead_created: "Lead criado",
        tag_applied: "Tag aplicada",
        campaign_replied: "Campanha respondida",
      };
      return types[d.triggerType || "new_conversation"] || "Gatilho";
    },
  },
  message: {
    label: "Mensagem",
    color: "#22D3EE",
    defaultData: { text: "" },
    validate: (d) => (!d.text?.trim() ? "Texto da mensagem é obrigatório" : null),
    summary: (d) => d.text ? d.text.slice(0, 45) + (d.text.length > 45 ? "…" : "") : "Mensagem vazia",
  },
  image: {
    label: "Imagem",
    color: "#F472B6",
    defaultData: { url: "", caption: "" },
    validate: (d) => (!d.url?.trim() ? "Faça upload de uma imagem" : null),
    summary: (d) => d.url ? "📷 " + (d.caption || d.url.split("/").pop() || "Imagem") : "Imagem não configurada",
  },
  audio: {
    label: "Áudio",
    color: "#A78BFA",
    defaultData: { url: "", duration: "" },
    validate: (d) => (!d.url?.trim() ? "Faça upload de um áudio" : null),
    summary: (d) => d.url ? `🎙️ Áudio${d.duration ? " · " + d.duration : ""}` : "Áudio não configurado",
  },
  video: {
    label: "Vídeo",
    color: "#FB7185",
    defaultData: { url: "", caption: "" },
    validate: (d) => (!d.url?.trim() ? "Faça upload de um vídeo" : null),
    summary: (d) => d.url ? "🎬 " + (d.caption || d.url.split("/").pop() || "Vídeo") : "Vídeo não configurado",
  },
  delay: {
    label: "Delay",
    color: "#FBBF24",
    defaultData: { amount: 1, unit: "minutes" },
    validate: (d) => (!d.amount || d.amount < 1 ? "Informe um tempo válido" : null),
    summary: (d) => {
      const units = { minutes: "minutos", hours: "horas", days: "dias" };
      return `⏱ Aguardar ${d.amount || 1} ${units[d.unit || "minutes"] || "minutos"}`;
    },
  },
  condition: {
    label: "Condição",
    color: "#34D399",
    defaultData: { field: "message_contains", operator: "contains", value: "" },
    validate: (d) => (!["exists","not_exists"].includes(d.operator) && !d.value?.trim() ? "Informe o valor da condição" : null),
    summary: (d) => {
      const fields = { message_contains: "mensagem contém", tag_exists: "tag existe", lead_replied: "lead respondeu", lead_stage: "etapa do lead", lead_source: "origem" };
      const f = fields[d.field || "message_contains"] || "campo";
      return `Se ${f}${d.value ? ": " + d.value : ""}`;
    },
  },
  choice: {
    label: "Escolha",
    color: "#38BDF8",
    defaultData: { question: "", options: ["", ""] },
    validate: (d) => ((d.options || []).filter(o => o.trim()).length < 2 ? "Adicione pelo menos 2 opções" : null),
    summary: (d) => {
      const n = (d.options || []).filter(o => o.trim()).length;
      return n > 0 ? `${n} opção${n !== 1 ? "ões" : ""} configurada${n !== 1 ? "s" : ""}` : "Sem opções";
    },
  },
  ia: {
    label: "IA",
    color: "#7C3AED",
    defaultData: { prompt: "", goal: "qualify_lead", tone: "friendly" },
    validate: (d) => (!d.prompt?.trim() ? "Instrução da IA é obrigatória" : null),
    summary: (d) => {
      const goals = { qualify_lead: "Qualificar lead", answer_question: "Responder dúvida", classify_intent: "Classificar intenção", summarize: "Resumir conversa", suggest_offer: "Sugerir oferta" };
      return goals[d.goal || "qualify_lead"] || "IA";
    },
  },
  tag: {
    label: "Tag",
    color: "#F59E0B",
    defaultData: { action: "add", tags: [] },
    validate: (d) => (!(d.tags || []).length ? "Adicione pelo menos uma tag" : null),
    summary: (d) => {
      const action = d.action === "remove" ? "Remover" : "Adicionar";
      return (d.tags || []).length > 0 ? `${action}: ${d.tags.join(", ")}` : "Tag não configurada";
    },
  },
  webhook: {
    label: "Webhook",
    color: "#60A5FA",
    defaultData: { url: "", method: "POST", headers: "", bodyTemplate: "" },
    validate: (d) => {
      if (!d.url?.trim()) return "URL do webhook é obrigatória";
      try { new URL(d.url); } catch { return "URL inválida"; }
      return null;
    },
    summary: (d) => d.url ? `🔗 ${d.method || "POST"} ${d.url.replace(/^https?:\/\//, "").slice(0, 40)}` : "URL não configurada",
  },
  redirect: {
    label: "Redirecionar",
    color: "#F87171",
    defaultData: { destType: "agent", destValue: "", message: "" },
    validate: (d) => (!d.destValue?.trim() ? "Informe o destino do redirecionamento" : null),
    summary: (d) => {
      const dests = { agent: "Atendente", team: "Equipe", queue: "Fila", number: "Número" };
      return `↪ ${dests[d.destType || "agent"] || "Destino"}: ${d.destValue || "Não configurado"}`;
    },
  },
  goto: {
    label: "Ir para fluxo",
    color: "#2DD4BF",
    defaultData: { targetFlowId: "", targetFlowName: "" },
    validate: (d) => (!d.targetFlowId ? "Selecione o fluxo de destino" : null),
    summary: (d) => (d.targetFlowName ? `→ ${d.targetFlowName}` : "Fluxo de destino não definido"),
  },
};

export function validateWorkflow(nodes) {
  const errors = [];
  nodes.forEach((n) => {
    const meta = BLOCK_META[n.data?.kind];
    if (!meta) return;
    const err = meta.validate(n.data);
    if (err) errors.push({ id: n.id, label: meta.label, error: err });
  });
  return errors;
}

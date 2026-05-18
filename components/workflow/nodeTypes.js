// Node catalog for the Wayvo visual workflow builder.
// Each entry drives color, glow, icon and default content.

export const NODE_DEFS = {
  trigger: {
    label: "Gatilho",
    desc: "Inicia o fluxo",
    color: "#00FF88",
    icon: "M13 2L3 14h7l-1 8 10-12h-7l1-8z",
    group: "Início",
  },
  message: {
    label: "Mensagem",
    desc: "Envia texto no WhatsApp",
    color: "#22D3EE",
    icon: "M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z",
    group: "Conteúdo",
  },
  image: {
    label: "Imagem",
    desc: "Envia uma imagem",
    color: "#F472B6",
    icon: "M3 5h18v14H3zM3 16l5-5 4 4 3-3 6 6",
    group: "Conteúdo",
  },
  audio: {
    label: "Áudio",
    desc: "Envia mensagem de voz",
    color: "#A78BFA",
    icon: "M12 3v18m-4-14v10M4 9v6m12-12v18m4-14v10",
    group: "Conteúdo",
  },
  video: {
    label: "Vídeo",
    desc: "Envia um vídeo",
    color: "#FB7185",
    icon: "M3 5h13v14H3zM16 9l5-3v12l-5-3z",
    group: "Conteúdo",
  },
  delay: {
    label: "Delay",
    desc: "Aguarda um tempo",
    color: "#FBBF24",
    icon: "M12 8v4l3 2m6-2a9 9 0 11-18 0 9 9 0 0118 0z",
    group: "Lógica",
  },
  condition: {
    label: "Condição",
    desc: "Ramifica por regra",
    color: "#34D399",
    icon: "M6 3v6a3 3 0 003 3h6a3 3 0 013 3v6M6 3H4m2 0h2m10 18h-2m2 0h2",
    group: "Lógica",
  },
  choice: {
    label: "Escolha",
    desc: "Botões de opção",
    color: "#38BDF8",
    icon: "M9 11l3 3 8-8M4 12l3 3M4 6l3 3 2-2",
    group: "Lógica",
  },
  ia: {
    label: "IA",
    desc: "Resposta inteligente",
    color: "#7C3AED",
    icon: "M12 2a5 5 0 015 5c0 1.5 3 2.5 3 5a5 5 0 01-5 5h-1v3H8v-3H7a5 5 0 01-5-5c0-2.5 3-3.5 3-5a5 5 0 015-5z",
    group: "Inteligência",
  },
  tag: {
    label: "Tag",
    desc: "Marca o contato",
    color: "#F59E0B",
    icon: "M20 12l-8 8-9-9V3h8l9 9zM7 7h.01",
    group: "Ações",
  },
  webhook: {
    label: "Webhook",
    desc: "Dispara evento externo",
    color: "#60A5FA",
    icon: "M10 13a5 5 0 007 0l3-3a5 5 0 00-7-7l-1 1m-1 9a5 5 0 00-7 0l-3 3a5 5 0 007 7l1-1",
    group: "Integração",
  },
  api: {
    label: "API Request",
    desc: "Chama uma API",
    color: "#818CF8",
    icon: "M16 18l6-6-6-6M8 6l-6 6 6 6",
    group: "Integração",
  },
  redirect: {
    label: "Redirecionar",
    desc: "Encaminha para atendente",
    color: "#F87171",
    icon: "M5 12h14m-7-7l7 7-7 7",
    group: "Ações",
  },
  goto: {
    label: "Ir para fluxo",
    desc: "Encaminha para outro fluxo",
    color: "#2DD4BF",
    icon: "M4 12h12M12 6l6 6-6 6M4 6v12",
    group: "Ações",
  },
};

export const NODE_GROUPS = [...new Set(Object.values(NODE_DEFS).map((n) => n.group))];

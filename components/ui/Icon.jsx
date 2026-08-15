import {
  BellOff, Bot, Brain, Briefcase, CalendarCheck, CalendarClock, Check, CircleCheck,
  CircleX, Gem, GitBranch, Glasses, Headset, House, Mail, MessageSquareOff,
  MessagesSquare, Moon, PiggyBank, Repeat, Send, ShieldCheck, Smartphone, Sparkles,
  Table2, Target, TrendingDown, TrendingUp, UtensilsCrossed, Workflow, X, Zap,
} from "lucide-react";

// Ícones da landing. Nome semântico em vez do nome do desenho: o que muda no
// site é a ideia ("resposta instantânea"), não o traço escolhido pra ela.
// Mesma biblioteca do painel (lucide), pra landing e produto falarem igual.
const ICONS = {
  // Plataforma
  "ai-copilot": Brain,
  "ai-sparkle": Sparkles,
  crm: MessagesSquare,
  automation: Workflow,
  "workflow-builder": GitBranch,
  revenue: TrendingUp,
  analytics: TrendingUp,
  stability: ShieldCheck,

  // Antes do Wayvo
  "sem-resposta": MessageSquareOff,
  planilha: Table2,
  silencio: BellOff,
  repeticao: Repeat,
  "venda-perdida": TrendingDown,

  // Com o Wayvo
  instantaneo: Zap,
  disparo: Send,
  madrugada: Moon,
  bot: Bot,
  timing: Target,

  // Nichos
  oculos: Glasses,
  "segundo-par": Gem,
  "troca-lentes": CalendarClock,
  campanha: Target,
  agendamento: CalendarCheck,
  confirmacao: CircleCheck,
  reativacao: Repeat,
  "pre-venda": Briefcase,
  cardapio: UtensilsCrossed,
  recorrencia: Repeat,
  margem: PiggyBank,
  presente: Gem,
  imovel: House,
  nutricao: Smartphone,
  visita: CalendarCheck,

  // Interface
  sucesso: CircleCheck,
  erro: CircleX,
  email: Mail,
  suporte: Headset,
  check: Check,
  x: X,
};

export default function Icon({ name, className = "size-5", strokeWidth = 1.75 }) {
  const Glyph = ICONS[name];
  if (!Glyph) return null;
  return <Glyph className={className} strokeWidth={strokeWidth} aria-hidden="true" />;
}

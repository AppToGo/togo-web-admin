import type { ConversationControl } from "../../types";

/** Colores del badge de quién atiende (Bot · Esperando · En atención). */
export const CONTROL_BADGE: Record<ConversationControl, string> = {
  BOT: "bg-slate-200 text-slate-700",
  PENDING_HUMAN: "bg-amber-100 text-amber-800",
  HUMAN: "bg-emerald-100 text-emerald-800",
};

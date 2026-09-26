/**
 * Embudo conversacional del bot (plan bot natural, T20).
 *
 * Refleja a mano `src/metrics/dto/conversation-funnel-response.dto.ts` del
 * backend (`GET /businesses/:businessId/metrics/conversation-funnel`). Las
 * tasas van de 0 a 1 y son null cuando no hay denominador.
 */

export interface ConversationFunnelTurnCounts {
  turns: number;
  invalidSelection: number;
  unknown: number;
  outOfStep: number;
  promptTextMatched: number;
  promptTextUnmatched: number;
}

export interface ConversationFunnel {
  businessId: string;
  period: { from: string; to: string; timeZone: string };
  /** Señales por turno. Hay datos desde que se desplegó T20. */
  turns: {
    totals: ConversationFunnelTurnCounts;
    rates: {
      invalidSelection: number | null;
      unknown: number | null;
      outOfStep: number | null;
      promptTextMatched: number | null;
    };
    byState: Array<{ state: string } & ConversationFunnelTurnCounts>;
    byDay: Array<{ date: string } & ConversationFunnelTurnCounts>;
  };
  /** Sesiones de cliente iniciadas en el período. */
  sessions: {
    total: number;
    /** Por resultado; `OPEN` = abierta, `UNSET` = cerrada sin resultado. */
    byOutcome: Record<string, number>;
    abandonedByState: Array<{ state: string; sessions: number }>;
    handoffRequested: number;
    rates: {
      order: number | null;
      abandoned: number | null;
      handoff: number | null;
    };
  };
  /** Mensajes del cliente desde el inicio de la sesión hasta confirmar. */
  messagesToOrder: {
    orders: number;
    average: number | null;
    median: number | null;
    p90: number | null;
  };
}

/** Días completos en la zona horaria del negocio (`YYYY-MM-DD`). */
export interface GetConversationFunnelParams {
  dateFrom?: string;
  dateTo?: string;
}

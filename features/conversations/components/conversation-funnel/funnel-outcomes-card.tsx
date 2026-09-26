"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ConversationFunnel } from "../../types";
import { formatRate, ratio } from "./funnel-format";

/** Orden fijo: primero lo que cierra bien, al final lo que sigue abierto. */
const OUTCOME_ORDER = [
  "ORDER_PLACED",
  "ABANDONED",
  "SUPPORT",
  "NO_INTENT",
  "SPAM",
  "UNSET",
  "OPEN",
];

interface FunnelOutcomesCardProps {
  sessions: ConversationFunnel["sessions"];
}

/** Cuántas conversaciones terminaron de cada forma. */
export function FunnelOutcomesCard({ sessions }: FunnelOutcomesCardProps) {
  const t = useTranslations("conversations.funnel.outcomes");
  const rows = Object.entries(sessions.byOutcome).sort(
    ([a], [b]) => rank(a) - rank(b)
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <p className="text-sm text-slate-500">
          {t("subtitle", { total: sessions.total })}
        </p>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-slate-500">{t("empty")}</p>
        ) : (
          <dl className="divide-y divide-slate-100">
            {rows.map(([outcome, count]) => (
              <div
                key={outcome}
                className="flex items-center justify-between py-2 text-sm"
              >
                <dt className="text-slate-700">
                  {t.has(`labels.${outcome}`)
                    ? t(`labels.${outcome}`)
                    : outcome}
                </dt>
                <dd className="text-slate-500">
                  <span className="font-semibold text-slate-900">{count}</span>{" "}
                  · {formatRate(ratio(count, sessions.total))}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </CardContent>
    </Card>
  );
}

function rank(outcome: string): number {
  const index = OUTCOME_ORDER.indexOf(outcome);
  return index === -1 ? OUTCOME_ORDER.length : index;
}

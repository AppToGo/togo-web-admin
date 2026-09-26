"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { ConversationFunnel } from "../../types";
import { formatRate, ratio, useFunnelStateLabel } from "./funnel-format";

interface FunnelAbandonmentCardProps {
  sessions: ConversationFunnel["sessions"];
}

/** En qué paso quedaron las conversaciones abandonadas. */
export function FunnelAbandonmentCard({
  sessions,
}: FunnelAbandonmentCardProps) {
  const t = useTranslations("conversations.funnel.abandonment");
  const stateLabel = useFunnelStateLabel();
  const total = sessions.abandonedByState.reduce(
    (sum, row) => sum + row.sessions,
    0
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <p className="text-sm text-slate-500">{t("subtitle")}</p>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <p className="text-sm text-slate-500">{t("empty")}</p>
        ) : (
          <ul className="space-y-3">
            {sessions.abandonedByState.map((row) => {
              const share = ratio(row.sessions, total) ?? 0;
              return (
                <li key={row.state}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-700">
                      {stateLabel(row.state)}
                    </span>
                    <span className="text-slate-500">
                      {t("count", { count: row.sessions })} ·{" "}
                      {formatRate(share)}
                    </span>
                  </div>
                  <Progress
                    value={share * 100}
                    className="mt-1 [&>div]:bg-amber-400"
                    aria-label={stateLabel(row.state)}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

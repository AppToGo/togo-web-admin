"use client";

import { useTranslations } from "next-intl";
import { ClipboardCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { CardSkeleton } from "../loading/CardSkeleton";
import { DashboardCardHeader } from "../DashboardCardHeader";
import { useProductReviewsSummary } from "../../hooks/useProductReviews";
import type { SurveySummary } from "../../types/dashboard.types";

/**
 * Encuesta de satisfacción del pedido (flag PRODUCT_REVIEWS): promedio de
 * cada pregunta, qué parte de los clientes recomendaría el negocio y los
 * comentarios generales recientes. Usa la misma consulta que las
 * calificaciones de productos.
 */
export function SurveyCard() {
  const t = useTranslations("dashboard.survey");
  const { data, isLoading, isError } = useProductReviewsSummary();

  if (isLoading) return <CardSkeleton className="h-72" />;

  const survey = data?.survey;

  return (
    <Card variant="glass" className="flex flex-col">
      <DashboardCardHeader
        icon={ClipboardCheck}
        title={t("title")}
        subtitle={t("subtitle")}
      />
      <CardContent>
        {isError || !survey ? (
          <p className="text-sm text-slate-500">{t("error")}</p>
        ) : survey.total === 0 ? (
          <p className="text-sm text-slate-500">{t("empty")}</p>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Questions survey={survey} />
            <RecentComments survey={survey} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Stars({ value }: { value: number }) {
  return (
    <span className="text-amber-500" aria-hidden="true">
      {"★".repeat(Math.round(value))}
      <span className="text-slate-300">
        {"★".repeat(5 - Math.round(value))}
      </span>
    </span>
  );
}

function Questions({ survey }: { survey: SurveySummary }) {
  const t = useTranslations("dashboard.survey");
  const answered = survey.questions.filter((q) => q.answers > 0);

  return (
    <section>
      <p className="text-sm text-slate-500">
        {t("responses", { count: survey.total })}
      </p>
      {survey.recommendShare != null && (
        <p
          className="mb-3 text-2xl font-bold tabular-nums text-slate-900"
          title={t("recommendHint")}
        >
          {t("recommendShare", { percent: survey.recommendShare })}
        </p>
      )}
      <ul className="space-y-2.5">
        {/* Las de un tipo de pedido que el negocio no tiene quedan sin respuestas. */}
        {answered.map(({ question, average, answers }) => (
          <li key={question} className="text-sm">
            <QuestionRow
              label={t(`questions.${question}`)}
              average={average}
              answers={answers}
            />
            {question === "time" && survey.timeByType.length > 1 && (
              <ul className="mt-1.5 space-y-1.5 border-l border-slate-200 pl-3">
                {survey.timeByType.map((row) => (
                  <li key={row.deliveryType ?? "none"} className="text-xs">
                    <QuestionRow
                      label={t(`deliveryTypes.${row.deliveryType ?? "none"}`)}
                      average={row.average}
                      answers={row.answers}
                    />
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

function QuestionRow({
  label,
  average,
  answers,
}: {
  label: string;
  average: number | null;
  answers: number;
}) {
  const t = useTranslations("dashboard.survey");

  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <span className="truncate text-slate-800">{label}</span>
        <span className="shrink-0 tabular-nums text-slate-700">
          {average != null ? (
            <>
              <Stars value={average} />{" "}
              {average.toLocaleString("es-CO", {
                minimumFractionDigits: 1,
              })}
            </>
          ) : (
            "—"
          )}
        </span>
      </div>
      <div className="mt-1 flex items-center gap-2">
        <div className="h-1.5 flex-1 rounded-full bg-amber-100/70">
          <div
            className="h-1.5 rounded-full bg-amber-400"
            style={{ width: `${((average ?? 0) / 5) * 100}%` }}
          />
        </div>
        <span className="w-24 text-right text-xs text-slate-400">
          {t("answers", { count: answers })}
        </span>
      </div>
    </>
  );
}

function RecentComments({ survey }: { survey: SurveySummary }) {
  const t = useTranslations("dashboard.survey");

  return (
    <section>
      <h3 className="mb-1.5 text-sm font-semibold text-slate-700">
        {t("recent")}
      </h3>
      {survey.recent.length === 0 ? (
        <p className="text-sm text-slate-500">{t("noComments")}</p>
      ) : (
        <ul className="space-y-3">
          {survey.recent.map((item) => (
            <li key={item.id}>
              <p className="text-xs text-slate-500">
                <Stars value={item.overallRating} /> · #{item.orderNumber}
              </p>
              <p className="mt-0.5 text-sm text-slate-800">{item.comment}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

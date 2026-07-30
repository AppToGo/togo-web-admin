"use client";

import { Suspense, useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { MessageCircle, Store } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuthGuard } from "@/features/auth/hooks/useAuthGuard";
import {
  useHasBusiness,
  useIsSuperAdmin,
} from "@/features/auth/stores/auth.store";
import { useEffectiveBusinessId } from "@/features/business/stores/business.store";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useConversations,
  ConversationsTable,
  ConversationThread,
} from "@/features/conversations";
import type { ConversationOutcome } from "@/features/conversations";

/**
 * Outcomes que califican como "sin pedido" (§1.1 del plan Fase B, backend
 * `OUTCOMES_WITHOUT_ORDER`). `ORDER_PLACED` nunca aparece acá: el propósito
 * de esta página es exactamente lo contrario.
 */
const WITHOUT_ORDER_OUTCOMES: ConversationOutcome[] = [
  "ABANDONED",
  "SUPPORT",
  "NO_INTENT",
  "SPAM",
];

type OutcomeFilter = "ALL" | ConversationOutcome;

function ConversationsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-40" />
      </div>
      <div className="rounded-lg border border-slate-200">
        <div className="p-4">
          <Skeleton className="h-8 w-full" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="p-4 border-t border-slate-100">
            <Skeleton className="h-12 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ConversationsWithoutOrderPage() {
  const t = useTranslations("conversations");

  useAuthGuard();
  const hasBusiness = useHasBusiness();
  const isSuperAdmin = useIsSuperAdmin();
  const selectedBusinessId = useEffectiveBusinessId();

  const [page, setPage] = useState(1);
  const [outcomeFilter, setOutcomeFilter] = useState<OutcomeFilter>("ALL");
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    null
  );
  const limit = 10;

  const handleCloseDialog = useCallback(() => {
    setSelectedSessionId(null);
  }, []);

  // withoutOrder y outcome son mutuamente excluyentes en el backend (400 si
  // se combinan) — acá nunca se envían juntos: "ALL" usa withoutOrder=true
  // (los 4 outcomes de abajo), un outcome específico usa `outcome=[...]`
  // solo, sin withoutOrder. El dropdown nunca ofrece ORDER_PLACED.
  const { data: conversations, pagination, isLoading } = useConversations({
    page,
    limit,
    businessId: selectedBusinessId || undefined,
    ...(outcomeFilter === "ALL"
      ? { withoutOrder: true }
      : { outcome: [outcomeFilter] }),
  });

  if (!hasBusiness && !isSuperAdmin) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
          <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mb-4">
            <Store className="w-8 h-8 text-amber-500" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">
            {t("page.title")}
          </h2>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <MessageCircle className="h-6 w-6 text-indigo-600" />
              {t("page.title")}
            </h1>
            <p className="text-slate-500 mt-1 text-sm">{t("page.subtitle")}</p>
          </div>

          <Select
            value={outcomeFilter}
            onValueChange={(value) => {
              setOutcomeFilter(value as OutcomeFilter);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full lg:w-56">
              <SelectValue placeholder={t("filters.outcome")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{t("filters.allOutcomes")}</SelectItem>
              {WITHOUT_ORDER_OUTCOMES.map((outcome) => (
                <SelectItem key={outcome} value={outcome}>
                  {t(`outcome.${outcome}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Suspense fallback={<ConversationsLoading />}>
          <ConversationsTable
            data={conversations}
            isLoading={isLoading}
            onSelectConversation={setSelectedSessionId}
            pagination={pagination}
            onPageChange={setPage}
          />
        </Suspense>
      </div>

      <Dialog
        open={!!selectedSessionId}
        onOpenChange={(open) => !open && handleCloseDialog()}
      >
        <DialogContent className="bg-white/95 backdrop-blur-lg sm:max-w-xl p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-100">
            <DialogTitle className="text-lg font-semibold text-slate-900">
              {t("detail.title")}
            </DialogTitle>
          </DialogHeader>
          <div className="px-6 py-4">
            {selectedSessionId && (
              <ConversationThread sessionId={selectedSessionId} />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

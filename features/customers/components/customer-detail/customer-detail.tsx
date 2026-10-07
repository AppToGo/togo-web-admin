"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { useDebounce } from "@/hooks/shared/useDebounce";
import { useConversations, isWindowOpen } from "@/features/conversations";
import { useCustomer, useUpdateCustomer } from "../../hooks";
import { CustomerUnifiedLayout } from "./customer-unified-layout";
import { MAX_NOTES_LENGTH } from "../../constants";

const NOT_SYNCED = Symbol("not-synced");

interface CustomerDetailProps {
  customerId: string;
}

export function CustomerDetail({ customerId }: CustomerDetailProps) {
  const t = useTranslations("customers");
  const tc = useTranslations("common");
  const [notes, setNotes] = useState("");

  // Debounce notes para auto-save
  const debouncedNotes = useDebounce(notes, 1000);

  // Query
  const { data: customer, isLoading: isLoadingCustomer } =
    useCustomer(customerId);

  // Conversación más reciente del cliente: el acceso "Abrir conversación" solo
  // se ofrece con la ventana de 24 h abierta (fuera de ella WhatsApp no deja
  // escribir texto libre), y lleva al inbox — el número del negocio (API de
  // Meta) no se puede usar desde WhatsApp Web.
  const { data: latestConversations } = useConversations(
    { customerId, limit: 1 },
    !!customer
  );
  const latestConversation = latestConversations[0];
  const conversationHref =
    latestConversation &&
    latestConversation.status === "OPEN" &&
    isWindowOpen(latestConversation.windowExpiresAt)
      ? `/dashboard/inbox?session=${latestConversation.id}`
      : null;

  // Mutación
  const updateCustomer = useUpdateCustomer();

  // Último valor de notas confirmado (cargado o guardado).
  const savedNotesRef = useRef<string | null>(null);
  // Solo una edición real del usuario (vía onNotesChange) habilita el
  // auto-save. Comparar el valor con debounce contra el estado no alcanza:
  // el setNotes del init es asíncrono y el "" inicial previo a la carga se
  // confunde con una edición, haciendo PATCH al montar y borrando notas.
  const userEditedRef = useRef(false);

  // Guardar notas - memoizado para evitar recreaciones
  const handleSaveNotes = useCallback(async () => {
    if (!customer) return;

    try {
      await updateCustomer.mutateAsync({
        customerId,
        data: { notes: debouncedNotes.slice(0, MAX_NOTES_LENGTH) },
      });
      savedNotesRef.current = debouncedNotes;
      userEditedRef.current = false;
    } catch {
      // Error ya manejado en el hook
    }
  }, [customer, customerId, debouncedNotes, updateCustomer]);

  // Edición del usuario: única vía que habilita el auto-save.
  const handleNotesChange = useCallback((value: string) => {
    userEditedRef.current = true;
    setNotes(value);
  }, []);

  // Inicializa las notas con las del cliente (y las resincroniza si cambian
  // en el servidor). Ajuste de estado durante el render en vez de un efecto.
  const serverNotes = customer?.notes;
  // Centinela distinto de cualquier valor real: si el cliente ya viene del
  // caché al montar, el primer render igual sincroniza.
  const [syncedServerNotes, setSyncedServerNotes] = useState<
    typeof serverNotes | typeof NOT_SYNCED
  >(NOT_SYNCED);
  if (serverNotes !== syncedServerNotes) {
    setSyncedServerNotes(serverNotes);
    if (serverNotes !== undefined) setNotes(serverNotes || "");
  }
  // La referencia al valor confirmado se actualiza en un efecto (no se
  // escriben refs durante el render); corre antes que el auto-save de abajo.
  useEffect(() => {
    if (serverNotes !== undefined) savedNotesRef.current = serverNotes || "";
  }, [serverNotes]);

  // Auto-save notes when debounced value changes — solo tras edición real
  // y sin un guardado ya en vuelo.
  useEffect(() => {
    if (
      customer &&
      userEditedRef.current &&
      !updateCustomer.isPending &&
      debouncedNotes !== savedNotesRef.current
    ) {
      handleSaveNotes();
    }
  }, [debouncedNotes, customer, handleSaveNotes, updateCustomer.isPending]);

  // Loading skeleton
  if (isLoadingCustomer) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col">
        {/* Header skeleton */}
        <div className="grid grid-cols-6 gap-4 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10" />
              <div>
                <Skeleton className="h-6 w-48 mb-2" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
            <Skeleton className="h-10 w-32" />
          </div>
        </div>

        {/* Content skeleton */}
        <div className="flex-1 flex overflow-hidden gap-4">
          {/* Main skeleton */}
          <div className="flex-1 p-6 space-y-6">
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-28" />
              ))}
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <Skeleton className="xl:col-span-2 h-96" />
              <Skeleton className="h-96" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)]">
        <h2 className="text-xl font-semibold text-slate-900">
          {t("detail.notFound")}
        </h2>
        <Button asChild className="mt-4">
          <Link href="/dashboard/customers">{tc("buttons.back")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <CustomerUnifiedLayout
      customer={customer}
      customerId={customerId}
      notes={notes}
      onNotesChange={handleNotesChange}
      onNotesSave={handleSaveNotes}
      isSavingNotes={updateCustomer.isPending}
      conversationHref={conversationHref}
    />
  );
}

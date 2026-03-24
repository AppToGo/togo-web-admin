"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { useCustomer, useUpdateCustomer } from "../../hooks";
import { CustomerUnifiedLayout } from "./customer-unified-layout";
import { toast } from "sonner";

interface CustomerDetailProps {
  customerId: string;
}

const MAX_NOTES_LENGTH = 1000;

// Debounce helper
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
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

  // Mutación
  const updateCustomer = useUpdateCustomer();

  // Initialize notes from customer data
  useEffect(() => {
    if (customer?.notes !== undefined) {
      setNotes(customer.notes || "");
    }
  }, [customer?.notes]);

  // Auto-save notes when debounced value changes
  useEffect(() => {
    if (customer && debouncedNotes !== (customer.notes || "")) {
      handleSaveNotes();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedNotes, customer]);

  // Guardar notas
  const handleSaveNotes = async () => {
    if (!customer) return;
    
    try {
      await updateCustomer.mutateAsync({
        customerId,
        data: { notes: debouncedNotes.slice(0, MAX_NOTES_LENGTH) },
      });
    } catch {
      // Error ya manejado en el hook
    }
  };

  // Loading skeleton
  if (isLoadingCustomer) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col">
        {/* Header skeleton */}
        <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-4">
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
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar skeleton */}
          <div className="hidden lg:block w-80 border-r border-slate-200 bg-white p-6">
            <div className="flex flex-col items-center space-y-4">
              <Skeleton className="h-20 w-20 rounded-full" />
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>

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

  const whatsappLink = `https://wa.me/${customer.phoneNumber.replace(/\D/g, "")}`;

  return (
    <CustomerUnifiedLayout
      customer={customer}
      customerId={customerId}
      notes={notes}
      onNotesChange={setNotes}
      onNotesSave={handleSaveNotes}
      isSavingNotes={updateCustomer.isPending}
      whatsappLink={whatsappLink}
    />
  );
}

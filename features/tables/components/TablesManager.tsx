"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, Pencil, Trash2, Armchair, AlertTriangle } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Can } from "@/components/auth/Can";
import { useTables, useCreateTable, useUpdateTable, useRemoveTable } from "../hooks";
import type { RestaurantTable } from "../types";

interface TablesManagerProps {
  businessId: string;
  branchId: string;
}

interface TableFormState {
  name: string;
  capacity: string;
}

const EMPTY_FORM: TableFormState = { name: "", capacity: "" };

/**
 * Valida `capacity` en el cliente antes de enviar — el backend ya lo
 * exige entero positivo (`@IsInt() @Min(1)` en `CreateTableDto`), pero sin
 * este chequeo un valor no numérico o decimal ("abc", "2.5") solo se
 * detecta después del POST, como un 400 genérico sin contexto en la UI.
 * Devuelve `undefined` (campo vacío, válido) o `{ error }` si el texto no
 * es un entero positivo.
 */
function parseCapacity(raw: string): { value?: number; error?: string } {
  const trimmed = raw.trim();
  if (!trimmed) return {};
  const value = Number(trimmed);
  if (!Number.isInteger(value) || value < 1) {
    return { error: "invalid" };
  }
  return { value };
}

/**
 * Pedidos en mesa (docs/architecture/pedidos-en-mesa.md, Fase 1) — ABM de
 * mesas de una sede. Se monta dentro de la página de edición de sede
 * (`app/[locale]/dashboard/branches/[id]/page.tsx`).
 */
export function TablesManager({ businessId, branchId }: TablesManagerProps) {
  const t = useTranslations("tables");
  const { data: tables, isLoading, isError, refetch, isRefetching } = useTables(
    businessId,
    branchId
  );
  const createTable = useCreateTable(businessId, branchId);
  const updateTable = useUpdateTable(businessId, branchId);
  const removeTable = useRemoveTable(businessId, branchId);

  const [editing, setEditing] = useState<RestaurantTable | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState<TableFormState>(EMPTY_FORM);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setIsFormOpen(true);
  };

  const openEdit = (table: RestaurantTable) => {
    setEditing(table);
    setForm({ name: table.name, capacity: table.capacity ? String(table.capacity) : "" });
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditing(null);
    setForm(EMPTY_FORM);
  };

  const capacityResult = parseCapacity(form.capacity);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = form.name.trim();
    if (!name || capacityResult.error) return;
    const capacity = capacityResult.value;

    if (editing) {
      updateTable.mutate(
        { id: editing.id, data: { name, capacity } },
        { onSuccess: closeForm }
      );
    } else {
      createTable.mutate({ name, capacity }, { onSuccess: closeForm });
    }
  };

  const isSaving = createTable.isPending || updateTable.isPending;

  return (
    <Card variant="glass">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-base flex items-center gap-2">
            <Armchair className="w-4 h-4 text-indigo-500" />
            {t("title")}
          </CardTitle>
          <CardDescription className="mt-1">{t("description")}</CardDescription>
        </div>
        <Can permission="table.manage">
          <Button type="button" size="sm" onClick={openCreate}>
            <Plus className="w-4 h-4 mr-1" />
            {t("addTable")}
          </Button>
        </Can>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : isError ? (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>{t("loadError.title")}</AlertTitle>
            <AlertDescription className="flex items-center justify-between gap-4">
              <span>{t("loadError.description")}</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                isLoading={isRefetching}
              >
                {t("loadError.retry")}
              </Button>
            </AlertDescription>
          </Alert>
        ) : !tables || tables.length === 0 ? (
          <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-lg">
            <p className="text-sm font-medium">{t("noTables")}</p>
            <p className="text-xs mt-1">{t("noTablesDescription")}</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("fields.name")}</TableHead>
                <TableHead>{t("fields.code")}</TableHead>
                <TableHead>{t("fields.capacity")}</TableHead>
                <TableHead>{t("fields.status")}</TableHead>
                <Can permission="table.manage">
                  <TableHead className="text-right">{t("fields.actions")}</TableHead>
                </Can>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tables.map((table) => (
                <TableRow key={table.id}>
                  <TableCell className="font-medium">{table.name}</TableCell>
                  <TableCell className="text-slate-500 font-mono text-xs">
                    {table.code}
                  </TableCell>
                  <TableCell>{table.capacity ?? "—"}</TableCell>
                  <TableCell>
                    <Badge
                      variant={table.isActive ? "default" : "secondary"}
                      className={
                        table.isActive
                          ? "bg-green-100 text-green-700 hover:bg-green-100"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-100"
                      }
                    >
                      {table.isActive ? t("status.active") : t("status.inactive")}
                    </Badge>
                  </TableCell>
                  <Can permission="table.manage">
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(table)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-red-500 hover:text-red-700"
                          onClick={() => setPendingDeleteId(table.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </Can>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      {/* Create / edit dialog */}
      <Dialog open={isFormOpen} onOpenChange={(open) => !open && closeForm()}>
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editing ? t("editTable") : t("addTable")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="table-name">{t("fields.name")}</Label>
                <Input
                  id="table-name"
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder={t("placeholders.name")}
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="table-capacity">{t("fields.capacity")}</Label>
                <Input
                  id="table-capacity"
                  type="number"
                  min={1}
                  step={1}
                  value={form.capacity}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, capacity: e.target.value }))
                  }
                  placeholder={t("placeholders.capacity")}
                  error={capacityResult.error ? t("errors.invalidCapacity") : undefined}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeForm}>
                {t("cancel")}
              </Button>
              <Button
                type="submit"
                disabled={!form.name.trim() || !!capacityResult.error || isSaving}
                isLoading={isSaving}
              >
                {t("save")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog
        open={!!pendingDeleteId}
        onOpenChange={(open) => !open && setPendingDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteConfirm.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteConfirm.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                if (pendingDeleteId) removeTable.mutate(pendingDeleteId);
                setPendingDeleteId(null);
              }}
            >
              {t("deleteConfirm.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Eye, EyeOff, Info, MessageCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  useCreateWhatsAppAccount,
  useUpdateWhatsAppAccount,
  useDeleteWhatsAppAccount,
  useCreateWhatsAppRouting,
  useDeleteWhatsAppRouting,
} from "../hooks";
import type { WhatsAppAccount, WhatsAppRouting } from "../types";

const E164_REGEX = /^\+[1-9]\d{6,14}$/;

interface FormErrors {
  phoneNumber?: string;
  metaWabaId?: string;
  phoneNumberId?: string;
  accessToken?: string;
}

interface WhatsAppConnectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** null = AUTO_ASSIGN (business-level), string = DIRECT_TO_BRANCH */
  branchId: string | null;
  branchName?: string;
  /** null/undefined = CREATE mode, WhatsAppAccount = EDIT mode */
  account?: WhatsAppAccount | null;
  existingRouting?: WhatsAppRouting | null;
}

export function WhatsAppConnectDialog({
  open,
  onOpenChange,
  branchId,
  branchName,
  account,
  existingRouting,
}: WhatsAppConnectDialogProps) {
  const t = useTranslations("whatsapp");
  const tCommon = useTranslations("common");

  const isEditMode = !!account;

  const [phoneNumber, setPhoneNumber] = useState(account?.phoneNumber ?? "");
  const [metaWabaId, setMetaWabaId] = useState(account?.metaWabaId ?? "");
  const [phoneNumberId, setPhoneNumberId] = useState(
    account?.phoneNumberId ?? ""
  );
  const [accessToken, setAccessToken] = useState("");
  const [displayName, setDisplayName] = useState(account?.displayName ?? "");
  const [showToken, setShowToken] = useState(false);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);

  const createAccount = useCreateWhatsAppAccount();
  const updateAccount = useUpdateWhatsAppAccount();
  const deleteAccount = useDeleteWhatsAppAccount();
  const createRouting = useCreateWhatsAppRouting();
  const deleteRouting = useDeleteWhatsAppRouting();

  const isPending =
    createAccount.isPending ||
    updateAccount.isPending ||
    deleteAccount.isPending ||
    createRouting.isPending;

  const validate = useCallback((): boolean => {
    const errors: FormErrors = {};

    if (!isEditMode) {
      if (!phoneNumber.trim()) {
        errors.phoneNumber = t("accounts.validation.phoneRequired");
      } else if (!E164_REGEX.test(phoneNumber.trim())) {
        errors.phoneNumber = t("accounts.validation.phoneInvalid");
      }

      if (!metaWabaId.trim()) {
        errors.metaWabaId = t("accounts.validation.wabaIdRequired");
      }

      if (!phoneNumberId.trim()) {
        errors.phoneNumberId = t("accounts.validation.phoneNumberIdRequired");
      }

      if (!accessToken.trim()) {
        errors.accessToken = t("accounts.validation.accessTokenRequired");
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [isEditMode, phoneNumber, metaWabaId, phoneNumberId, accessToken, t]);

  const handleSubmit = useCallback(async () => {
    if (!validate()) return;

    if (isEditMode && account) {
      // EDIT mode: only update displayName and/or accessToken
      const hasChanges =
        displayName !== (account.displayName ?? "") ||
        accessToken.trim() !== "";

      if (!hasChanges) {
        onOpenChange(false);
        return;
      }

      await updateAccount.mutateAsync({
        id: account.id,
        data: {
          displayName: displayName || undefined,
          accessToken: accessToken.trim() || undefined,
        },
      });

      onOpenChange(false);
    } else {
      // CREATE mode: 1) create account, 2) create routing
      const newAccount = await createAccount.mutateAsync({
        phoneNumber: phoneNumber.trim(),
        metaWabaId: metaWabaId.trim(),
        phoneNumberId: phoneNumberId.trim(),
        accessToken: accessToken.trim(),
        displayName: displayName.trim() || undefined,
      });

      await createRouting.mutateAsync({
        whatsappAccountId: newAccount.id,
        branchId: branchId,
        strategy: branchId ? "DIRECT_TO_BRANCH" : "AUTO_ASSIGN",
      });

      onOpenChange(false);
    }
  }, [
    validate,
    isEditMode,
    account,
    displayName,
    accessToken,
    updateAccount,
    onOpenChange,
    createAccount,
    phoneNumber,
    metaWabaId,
    phoneNumberId,
    createRouting,
    branchId,
  ]);

  const handleDisconnect = useCallback(async () => {
    if (!account) return;

    // Delete routing first if it exists
    if (existingRouting) {
      await deleteRouting.mutateAsync(existingRouting.id);
    }

    // Then delete the account
    await deleteAccount.mutateAsync(account.id);

    setShowDisconnectConfirm(false);
    onOpenChange(false);
  }, [account, existingRouting, deleteRouting, deleteAccount, onOpenChange]);

  const dialogTitle = isEditMode
    ? t("accounts.editTitle")
    : branchId
      ? t("accounts.createTitle", { branchName: branchName ?? "" })
      : t("accounts.createTitleBusiness");

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-green-600" />
              {dialogTitle}
            </DialogTitle>
            {!isEditMode && (
              <DialogDescription>
                {branchId
                  ? t("routing.directBranch")
                  : t("routing.autoAssignDescription")}
              </DialogDescription>
            )}
          </DialogHeader>

          <div className="space-y-4 py-2 px-7">
            {/* Phone Number — read-only in edit mode */}
            <div className="space-y-1.5">
              <Label htmlFor="wa-phone">
                {t("accounts.fields.phoneNumber")}
                {!isEditMode && <span className="text-red-500 ml-1">*</span>}
              </Label>
              {isEditMode ? (
                <Input
                  id="wa-phone"
                  value={account?.phoneNumber ?? ""}
                  readOnly
                  disabled
                  className="bg-slate-50 font-mono"
                />
              ) : (
                <>
                  <Input
                    id="wa-phone"
                    value={phoneNumber}
                    onChange={(e) => {
                      setPhoneNumber(e.target.value);
                      setFormErrors((prev) => ({
                        ...prev,
                        phoneNumber: undefined,
                      }));
                    }}
                    placeholder={t("accounts.fields.phoneNumberPlaceholder")}
                  />
                  {formErrors.phoneNumber && (
                    <p className="text-xs text-red-500">
                      {formErrors.phoneNumber}
                    </p>
                  )}
                </>
              )}
            </div>

            {/* WABA ID — read-only in edit mode */}
            <div className="space-y-1.5">
              <Label htmlFor="wa-waba-id">
                {t("accounts.fields.metaWabaId")}
                {!isEditMode && <span className="text-red-500 ml-1">*</span>}
              </Label>
              {isEditMode ? (
                <Input
                  id="wa-waba-id"
                  value={account?.metaWabaId ?? ""}
                  readOnly
                  disabled
                  className="bg-slate-50 font-mono"
                />
              ) : (
                <>
                  <Input
                    id="wa-waba-id"
                    value={metaWabaId}
                    onChange={(e) => {
                      setMetaWabaId(e.target.value);
                      setFormErrors((prev) => ({
                        ...prev,
                        metaWabaId: undefined,
                      }));
                    }}
                    placeholder={t("accounts.fields.metaWabaIdPlaceholder")}
                  />
                  {formErrors.metaWabaId && (
                    <p className="text-xs text-red-500">
                      {formErrors.metaWabaId}
                    </p>
                  )}
                </>
              )}
            </div>

            {/* Phone Number ID — read-only in edit mode */}
            <div className="space-y-1.5">
              <Label htmlFor="wa-phone-id">
                {t("accounts.fields.phoneNumberId")}
                {!isEditMode && <span className="text-red-500 ml-1">*</span>}
              </Label>
              {isEditMode ? (
                <Input
                  id="wa-phone-id"
                  value={account?.phoneNumberId ?? ""}
                  readOnly
                  disabled
                  className="bg-slate-50 font-mono"
                />
              ) : (
                <>
                  <Input
                    id="wa-phone-id"
                    value={phoneNumberId}
                    onChange={(e) => {
                      setPhoneNumberId(e.target.value);
                      setFormErrors((prev) => ({
                        ...prev,
                        phoneNumberId: undefined,
                      }));
                    }}
                    placeholder={t("accounts.fields.phoneNumberIdPlaceholder")}
                  />
                  {formErrors.phoneNumberId && (
                    <p className="text-xs text-red-500">
                      {formErrors.phoneNumberId}
                    </p>
                  )}
                </>
              )}
            </div>

            {/* Access Token */}
            <div className="space-y-1.5">
              <Label htmlFor="wa-token">
                {isEditMode
                  ? t("accounts.fields.accessTokenEdit")
                  : t("accounts.fields.accessToken")}
                {!isEditMode && <span className="text-red-500 ml-1">*</span>}
              </Label>
              <div className="relative">
                <Input
                  id="wa-token"
                  type={showToken ? "text" : "password"}
                  value={accessToken}
                  onChange={(e) => {
                    setAccessToken(e.target.value);
                    setFormErrors((prev) => ({
                      ...prev,
                      accessToken: undefined,
                    }));
                  }}
                  placeholder={t("accounts.fields.accessTokenPlaceholder")}
                  className="pr-10 font-mono text-sm"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  onClick={() => setShowToken((v) => !v)}
                  tabIndex={-1}
                  aria-label={showToken ? "Ocultar token" : "Mostrar token"}
                >
                  {showToken ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {formErrors.accessToken && (
                <p className="text-xs text-red-500">{formErrors.accessToken}</p>
              )}
            </div>

            {/* Display Name */}
            <div className="space-y-1.5">
              <Label htmlFor="wa-display-name">
                {t("accounts.fields.displayName")}
              </Label>
              <Input
                id="wa-display-name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={t("accounts.fields.displayNamePlaceholder")}
              />
            </div>

            {/* Where to find data hint */}
            {!isEditMode && (
              <Alert className="bg-blue-50 border-blue-200">
                <Info className="w-4 h-4 text-blue-600" />
                <AlertDescription className="text-blue-700 text-xs">
                  <span className="font-medium">{t("accounts.where")}</span>{" "}
                  {t("accounts.whereHint")}
                </AlertDescription>
              </Alert>
            )}
          </div>

          <div className="flex items-center gap-2 p-7">
            {/* Disconnect button in edit mode */}
            {isEditMode && (
              <Button
                type="button"
                variant="outline"
                className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                onClick={() => setShowDisconnectConfirm(true)}
                disabled={isPending}
              >
                {t("accounts.disconnect")}
              </Button>
            )}

            <div className="flex-1" />

            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              {tCommon("buttons.cancel")}
            </Button>

            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isPending}
              isLoading={isPending}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isEditMode ? tCommon("buttons.save") : t("accounts.connect")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Disconnect confirmation dialog */}
      <AlertDialog
        open={showDisconnectConfirm}
        onOpenChange={setShowDisconnectConfirm}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("accounts.disconnectTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("accounts.disconnectDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon("buttons.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
              onClick={handleDisconnect}
            >
              {t("accounts.disconnect")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

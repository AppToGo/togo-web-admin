"use client";

/**
 * Send Notification Modal Component
 * Modal for sending notifications to a business
 */

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { NOTIFICATION_TYPES } from "../constants/payment-status";
import type { BusinessWithSubscription } from "../types/business-subscription.types";

interface SendNotificationModalProps {
  business: BusinessWithSubscription | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    type: "PAYMENT_REMINDER" | "OVERDUE_WARNING" | "GRACE_PERIOD_NOTICE" | "CUSTOM";
    subject: string;
    message: string;
    sendEmail?: boolean;
    sendInApp?: boolean;
  }) => void;
  isSubmitting?: boolean;
}

export function SendNotificationModal({
  business,
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
}: SendNotificationModalProps) {
  const t = useTranslations("admin-businesses");
  const [type, setType] = useState<string>("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sendEmail, setSendEmail] = useState(true);
  const [sendInApp, setSendInApp] = useState(true);

  // Auto-fill subject when type changes
  useEffect(() => {
    const selectedType = NOTIFICATION_TYPES.find((nt) => nt.value === type);
    if (selectedType && selectedType.defaultSubject) {
      setSubject(selectedType.defaultSubject);
    }
  }, [type]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      type: type as
        | "PAYMENT_REMINDER"
        | "OVERDUE_WARNING"
        | "GRACE_PERIOD_NOTICE"
        | "CUSTOM",
      subject,
      message,
      sendEmail,
      sendInApp,
    });
  };

  const handleClose = () => {
    setType("");
    setSubject("");
    setMessage("");
    setSendEmail(true);
    setSendInApp(true);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[550px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{t("modals.sendNotification.title")}</DialogTitle>
            <DialogDescription>
              {t("modals.sendNotification.description", {
                businessName: business?.name,
              })}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Notification Type */}
            <div className="grid gap-2">
              <Label htmlFor="type">
                {t("modals.sendNotification.type")} *
              </Label>
              <Select value={type} onValueChange={setType} required>
                <SelectTrigger>
                  <SelectValue
                    placeholder={t("modals.sendNotification.selectType")}
                  />
                </SelectTrigger>
                <SelectContent>
                  {NOTIFICATION_TYPES.map((nt) => (
                    <SelectItem key={nt.value} value={nt.value}>
                      {nt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Subject */}
            <div className="grid gap-2">
              <Label htmlFor="subject">
                {t("modals.sendNotification.subject")} *
              </Label>
              <Input
                id="subject"
                placeholder={t("modals.sendNotification.subjectPlaceholder")}
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
              />
            </div>

            {/* Message */}
            <div className="grid gap-2">
              <Label htmlFor="message">
                {t("modals.sendNotification.message")} *
              </Label>
              <Textarea
                id="message"
                placeholder={t("modals.sendNotification.messagePlaceholder")}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                required
              />
            </div>

            {/* Delivery Options */}
            <div className="space-y-3">
              <Label>{t("modals.sendNotification.deliveryOptions")}</Label>
              <div className="flex flex-col gap-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="sendEmail"
                    checked={sendEmail}
                    onCheckedChange={(checked) =>
                      setSendEmail(checked as boolean)
                    }
                  />
                  <label
                    htmlFor="sendEmail"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {t("modals.sendNotification.sendEmail")}
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="sendInApp"
                    checked={sendInApp}
                    onCheckedChange={(checked) =>
                      setSendInApp(checked as boolean)
                    }
                  />
                  <label
                    htmlFor="sendInApp"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {t("modals.sendNotification.sendInApp")}
                  </label>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              {t("modals.cancel")}
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              {t("modals.sendNotification.submit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

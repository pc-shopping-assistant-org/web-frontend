"use client";

import {Ban, Check, CheckCircle2, Loader2, Truck} from "lucide-react";
import {useTranslations} from "next-intl";
import {useMemo, useState} from "react";

import {Button} from "@/components/ui/button";
import {ErrorMessage} from "@/components/ui/error-message";
import {Label} from "@/components/ui/label";
import {Textarea} from "@/components/ui/textarea";
import {ORDER_STATUS_TRANSITIONS, OrderStatus} from "@/lib/domain/commerce-enums";
import {cn} from "@/lib/utils";

import {useAdvanceOrder, useCancelOrderAsAdmin} from "./queries";

const MAX_REASON_LENGTH = 500;

/**
 * Modern Quick-Action Buttons for Order Status Management:
 * - Highlights the single primary progressive next step (Confirm / Ship / Complete).
 * - Discrete, dedicated cancellation button with full reason modal.
 * - Loading indicator feedback during asynchronous status mutations.
 */
export function AdminOrderStatusControl({
  orderId,
  status,
  className,
  onError,
}: {
  orderId: string;
  status: string;
  className?: string;
  onError?: (error: unknown) => void;
}) {
  const t = useTranslations("admin");
  const advance = useAdvanceOrder();
  const cancel = useCancelOrderAsAdmin();
  const [showCancel, setShowCancel] = useState(false);
  const [reason, setReason] = useState("");

  const options = ORDER_STATUS_TRANSITIONS[status as OrderStatus] ?? [status];
  const nextStatus = options.find((opt) => opt !== status && opt !== OrderStatus.Cancelled);
  const canCancel = options.includes(OrderStatus.Cancelled) && status !== OrderStatus.Cancelled;
  const pending = advance.isPending || cancel.isPending;

  const nextActionConfig = useMemo(() => {
    if (!nextStatus) return null;

    if (nextStatus === OrderStatus.Confirmed) {
      return {
        label: t("orderActions.confirm"),
        icon: Check,
        className: "bg-primary text-primary-foreground hover:bg-primary/90",
      };
    }
    if (nextStatus === OrderStatus.Shipping) {
      return {
        label: t("orderActions.ship"),
        icon: Truck,
        className: "bg-primary text-primary-foreground hover:bg-primary/90",
      };
    }
    if (nextStatus === OrderStatus.Completed) {
      return {
        label: t("orderActions.complete"),
        icon: CheckCircle2,
        className: "bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500",
      };
    }

    return {
      label: t.has(`statusValues.${nextStatus}`) ? t(`statusValues.${nextStatus}`) : nextStatus,
      icon: Check,
      className: "bg-primary text-primary-foreground hover:bg-primary/90",
    };
  }, [nextStatus, t]);

  const handleAdvance = async (targetStatus: string) => {
    if (pending || !targetStatus) return;
    onError?.(null);
    try {
      await advance.mutateAsync({orderId, status: targetStatus});
    } catch (error: unknown) {
      onError?.(error);
    }
  };

  const handleOpenCancel = () => {
    setReason("");
    cancel.reset();
    setShowCancel(true);
  };

  const confirmCancel = async () => {
    try {
      await cancel.mutateAsync({orderId, reason: reason.trim()});
      setShowCancel(false);
    } catch {
      // dialog renders error
    }
  };

  if (!nextStatus && !canCancel) {
    return null;
  }

  const ActionIcon = nextActionConfig?.icon;

  return (
    <>
      <div className={cn("inline-flex flex-wrap items-center gap-1.5", className)}>
        {/* Primary progressive next status button */}
        {nextStatus && nextActionConfig ? (
          <Button
            type="button"
            size="sm"
            onClick={() => handleAdvance(nextStatus)}
            disabled={pending}
            className={cn(
              "h-8 gap-1.5 px-3 text-xs font-medium shadow-none transition-all active:scale-[0.98]",
              nextActionConfig.className,
            )}
          >
            {advance.isPending ? <Loader2 className="size-3.5 animate-spin" /> : ActionIcon ? <ActionIcon className="size-3.5" /> : null}
            <span>{nextActionConfig.label}</span>
          </Button>
        ) : null}

        {/* Dedicated cancellation action */}
        {canCancel ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleOpenCancel}
            disabled={pending}
            title={t("cancelOrder")}
            className="h-8 gap-1 px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
          >
            {cancel.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Ban className="size-3.5" />}
            <span>{t("orderActions.cancel")}</span>
          </Button>
        ) : null}
      </div>

      {advance.isError && !onError ? (
        <div className="mt-2 w-full">
          <ErrorMessage error={advance.error} />
        </div>
      ) : null}

      {/* Cancellation confirmation modal */}
      {showCancel ? (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !cancel.isPending) setShowCancel(false);
          }}
        >
          <form
            className="w-full max-w-md space-y-5 rounded-2xl border bg-card p-6 shadow-2xl"
            role="dialog"
            aria-modal="true"
            onSubmit={(event) => {
              event.preventDefault();
              void confirmCancel();
            }}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div>
              <p className="eyebrow">{t("orderDetail")}</p>
              <h2 className="mt-2 text-xl font-semibold">{t("cancelOrder")}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{t("cancelReasonPrompt")}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor={`cancel-reason-${orderId}`}>{t("reason")}</Label>
              <Textarea
                id={`cancel-reason-${orderId}`}
                value={reason}
                maxLength={MAX_REASON_LENGTH}
                onChange={(event) => setReason(event.target.value)}
                autoFocus
                placeholder={t("cancellationReason")}
              />
            </div>
            {cancel.isError ? <ErrorMessage error={cancel.error} /> : null}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowCancel(false)} disabled={cancel.isPending}>
                {t("back")}
              </Button>
              <Button type="submit" variant="destructive" disabled={cancel.isPending || !reason.trim()}>
                {t("confirmCancelOrder")}
              </Button>
            </div>
          </form>
        </div>
      ) : null}
    </>
  );
}

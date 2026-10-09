"use client";

import {useTranslations} from "next-intl";
import {useState} from "react";

import {Button} from "@/components/ui/button";
import {ErrorMessage} from "@/components/ui/error-message";
import {Label} from "@/components/ui/label";
import {Select} from "@/components/ui/select";
import {Textarea} from "@/components/ui/textarea";
import {ORDER_STATUS_TRANSITIONS, OrderStatus} from "@/lib/domain/commerce-enums";

import {useAdvanceOrder, useCancelOrderAsAdmin} from "./queries";

const MAX_REASON_LENGTH = 500;

/**
 * The steps the shop can take on an order: the select moves it on, and cancelling asks for the reason first.
 * {@code onError} takes over the refusal of a step, for a list whose row disappears when the order is refreshed.
 */
export function AdminOrderStatusControl({orderId, status, className, onError}: {orderId: string; status: string; className?: string; onError?: (error: unknown) => void}) {
  const t = useTranslations("admin");
  const advance = useAdvanceOrder();
  const cancel = useCancelOrderAsAdmin();
  const [showCancel, setShowCancel] = useState(false);
  const [reason, setReason] = useState("");
  const options = ORDER_STATUS_TRANSITIONS[status as OrderStatus] ?? [status];
  const pending = advance.isPending || cancel.isPending;

  function change(next: string) {
    if (!next || next === status) return;
    if (next === OrderStatus.Cancelled) {
      setReason("");
      cancel.reset();
      setShowCancel(true);
      return;
    }
    onError?.(null);
    advance.mutateAsync({orderId, status: next}).catch((error: unknown) => onError?.(error));
  }

  async function confirmCancel() {
    try {
      await cancel.mutateAsync({orderId, reason: reason.trim()});
      setShowCancel(false);
    } catch {
      // the dialog shows the refusal
    }
  }

  return <>
    <Select
      className={className ?? "h-9 w-52"}
      value={status}
      onChange={(event) => change(event.target.value)}
      disabled={pending || options.length < 2}
      aria-label={t("orderStatus")}
    >
      {options.map((option) => <option key={option} value={option}>{t.has(`statusValues.${option}`) ? t(`statusValues.${option}`) : option}</option>)}
    </Select>
    {advance.isError && !onError ? <div className="w-full"><ErrorMessage error={advance.error} /></div> : null}
    {showCancel ? <div
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
          />
        </div>
        {cancel.isError ? <ErrorMessage error={cancel.error} /> : null}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => setShowCancel(false)} disabled={cancel.isPending}>{t("back")}</Button>
          <Button type="submit" variant="destructive" disabled={cancel.isPending || !reason.trim()}>{t("confirmCancelOrder")}</Button>
        </div>
      </form>
    </div> : null}
  </>;
}

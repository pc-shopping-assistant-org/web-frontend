"use client";

import { useTranslations } from "next-intl";
import { useId, useState } from "react";

import { Button } from "@/components/ui/button";
import { ErrorMessage } from "@/components/ui/error-message";
import { Select } from "@/components/ui/select";
import {AccountStatus} from "@/lib/domain/account-enums";
import {DiscountStatus} from "@/lib/domain/commerce-enums";
import {ResourceStatus} from "@/lib/domain/catalog-enums";

const CONFIRMABLE_STATUSES = new Set<string>([
  AccountStatus.Inactive,
  AccountStatus.Locked,
  DiscountStatus.Disabled,
  ResourceStatus.Deleted,
]);

/**
 * Status mutations that disable or hide data always require an explicit
 * confirmation. Keeping this interaction in one component prevents list and
 * detail screens from drifting apart on destructive workflow rules.
 */
export function StatusSelect({
  currentStatus,
  options,
  onStatus,
  label,
  className = "h-9 w-36",
  disabled = false,
}: {
  currentStatus?: string;
  options: string[];
  onStatus: (status: string) => Promise<unknown> | unknown;
  label: string;
  className?: string;
  disabled?: boolean;
}) {
  const t = useTranslations("admin");
  const titleId = useId();
  const [nextStatus, setNextStatus] = useState<string | null>(null);
  const [error, setError] = useState<unknown>(null);
  const labelFor = (status: string) =>
    t.has(`statusValues.${status}`)
      ? t(`statusValues.${status}`)
      : status;

  async function confirmStatus() {
    if (!nextStatus) return;
    setError(null);
    try {
      await onStatus(nextStatus);
      setNextStatus(null);
    } catch (cause) {
      setError(cause);
    }
  }

  async function runStatus(status: string) {
    setError(null);
    try {
      await onStatus(status);
    } catch (cause) {
      setError(cause);
    }
  }

  function handleChange(status: string) {
    if (!status || status === currentStatus) return;
    setError(null);
    if (CONFIRMABLE_STATUSES.has(status)) {
      setNextStatus(status);
      return;
    }
    void runStatus(status);
  }

  return (
    <>
      <Select
        className={className}
        value={currentStatus ?? ""}
        onChange={(event) => handleChange(event.target.value)}
        disabled={disabled || Boolean(nextStatus)}
        aria-label={label}
      >
        {options.map((status) => (
          <option key={status} value={status}>
            {labelFor(status)}
          </option>
        ))}
      </Select>
      {error && !nextStatus ? (
        <div className="mt-2 max-w-xs">
          <ErrorMessage error={error} />
        </div>
      ) : null}
      {nextStatus ? (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setNextStatus(null);
          }}
        >
          <div
            className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-2xl"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby={titleId}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <h2 id={titleId} className="text-lg font-semibold">
              {t("confirmStatusChange")}
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {t("statusChangeDescription", {
                status: labelFor(nextStatus),
              })}
            </p>
            {error ? (
              <div className="mt-4">
                <ErrorMessage error={error} />
              </div>
            ) : null}
            <div className="mt-6 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setNextStatus(null)}
              >
                {t("cancel")}
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={() => void confirmStatus()}
              >
                {labelFor(nextStatus)}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

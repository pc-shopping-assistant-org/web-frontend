"use client";

import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useId, useState, type ComponentProps, type ReactNode } from "react";

import { ErrorMessage } from "@/components/ui/error-message";

import { Button } from "./button";

type ButtonProps = ComponentProps<typeof Button>;

/**
 * A keyboard-friendly confirmation action that keeps destructive mutations
 * out of native browser dialogs. It is intentionally generic so storefront
 * and admin flows share the same interaction and error handling.
 */
export function ConfirmAction({
  title,
  description,
  confirmLabel,
  cancelLabel,
  onConfirm,
  children,
  variant = "destructive",
  confirmVariant = "destructive",
  size = "default",
  className,
  ariaLabel,
  disabled = false,
}: {
  title: string;
  description?: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => Promise<unknown> | unknown;
  children: ReactNode;
  variant?: ButtonProps["variant"];
  confirmVariant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  className?: string;
  ariaLabel?: string;
  disabled?: boolean;
}) {
  const common = useTranslations("common");
  const titleId = useId();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !pending) setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, pending]);

  async function confirm() {
    setPending(true);
    setError(null);
    try {
      await onConfirm();
      setOpen(false);
    } catch (cause) {
      setError(cause);
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        className={className}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
      >
        {children}
      </Button>
      {open ? (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !pending) setOpen(false);
          }}
        >
          <div
            className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-2xl"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby={titleId}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id={titleId} className="text-lg font-semibold">
                  {title}
                </h2>
                {description ? (
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {description}
                  </p>
                ) : null}
              </div>
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                aria-label={cancelLabel}
                onClick={() => setOpen(false)}
                disabled={pending}
              >
                <X className="size-4" />
              </Button>
            </div>
            {error ? (
              <div className="mt-4">
                <ErrorMessage error={error} />
              </div>
            ) : null}
            <div className="mt-6 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={pending}
              >
                {cancelLabel}
              </Button>
              <Button
                type="button"
                variant={confirmVariant}
                onClick={() => void confirm()}
                disabled={pending}
              >
                {pending ? common("loading") : confirmLabel}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

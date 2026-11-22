"use client";

import {IconArrowsExchange, IconPlus, IconTrash} from "@tabler/icons-react";

import {Button} from "@/components/ui/button";
import {CheckVerdict, MAX_QUANTITY, type Slot} from "./contracts";
import type {BuilderCopy} from "./copy";
import type {Part} from "./models";
import {PartArt} from "./part-art";

export function SlotRow({
  slot,
  index,
  part,
  compatibilityCheck,
  quantity,
  onQuantityChange,
  onPick,
  onRemove,
  t,
  money,
}: {
  slot: Slot;
  index: number;
  part?: Part;
  compatibilityCheck?: {status: CheckVerdict; message?: string};
  quantity: number;
  onQuantityChange: (quantity: number) => void;
  onPick: () => void;
  onRemove: () => void;
  t: BuilderCopy;
  money: (value: number) => string;
}) {
  if (!part) {
    return (
      <article
        aria-label={`${index}. ${t.slots[slot]}`}
        className="flex flex-col justify-between gap-3 rounded-xl border border-dashed border-border bg-card/60 p-3 transition hover:border-primary/50 sm:flex-row sm:items-center"
      >
        <div className="flex items-center gap-3">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-lg border border-dashed bg-muted/30 p-1 opacity-70">
            <PartArt slot={slot} compact />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {index}. {t.slots[slot]}
            </span>
            <p className="mt-0.5 text-sm font-medium text-muted-foreground">{t.pleaseSelect}</p>
          </div>
        </div>
        <div className="flex justify-end pt-2 sm:pt-0">
          <Button
            type="button"
            aria-label={`${t.choose} ${t.slots[slot]}`}
            onClick={onPick}
            className="h-8 rounded-lg px-4 text-xs font-bold transition"
          >
            <IconPlus className="size-4" />
            <span>{t.choosePart}</span>
          </Button>
        </div>
      </article>
    );
  }

  const compatibilityLabel = compatibilityCheck
    ? compatibilityCheck.status === "COMPATIBLE"
      ? `✓ ${compatibilityCheck.message || t.allCompatible}`
      : compatibilityCheck.status === "INCOMPATIBLE"
        ? `⚠ ${compatibilityCheck.message || t.statuses.INCOMPATIBLE}`
        : compatibilityCheck.message || t.statuses.UNKNOWN
    : null;

  return (
    <article
      aria-label={`${index}. ${t.slots[slot]}`}
      className="flex flex-col justify-between gap-3 rounded-xl border bg-card p-3 transition hover:border-primary/40 sm:flex-row sm:items-center"
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="flex size-14 shrink-0 items-center justify-center rounded-lg border bg-white p-1">
          <PartArt slot={slot} compact fill imageUrl={part.imageUrl} alt={part.name} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="shrink-0 whitespace-nowrap text-xs font-bold uppercase tracking-wide text-muted-foreground">
              {index}. {t.slots[slot]}
            </span>
            {compatibilityCheck && compatibilityLabel && (
              <span
                title={compatibilityLabel}
                className={
                  compatibilityCheck.status === "COMPATIBLE"
                    ? "min-w-0 truncate whitespace-nowrap rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400"
                    : compatibilityCheck.status === "INCOMPATIBLE"
                      ? "min-w-0 truncate whitespace-nowrap rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] font-bold text-destructive"
                      : "min-w-0 truncate whitespace-nowrap rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
                }
              >
                {compatibilityLabel}
              </span>
            )}
          </div>
          <p className="mt-0.5 line-clamp-1 text-sm font-semibold text-foreground">{part.name}</p>
          <div className="mt-2 text-sm font-extrabold text-primary sm:hidden">{money(part.price * quantity)}</div>
        </div>
      </div>

      <div className="flex shrink-0 items-center justify-between gap-3 border-t pt-3 sm:border-t-0 sm:pt-0">
        <div className="hidden text-right sm:block">
          <div className="whitespace-nowrap text-sm font-extrabold text-primary">{money(part.price * quantity)}</div>
        </div>
        <div className="flex h-8 items-center overflow-hidden rounded-lg border bg-muted/20 text-xs font-semibold">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="h-8 w-7 rounded-none text-muted-foreground hover:text-foreground"
            disabled={quantity <= 1}
            aria-label={`${t.decreaseQuantity} ${t.slots[slot]}`}
            onClick={() => onQuantityChange(quantity - 1)}
          >
            -
          </Button>
          <span aria-live="polite" className="min-w-6 px-1.5 text-center font-bold text-foreground">
            {quantity}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="h-8 w-7 rounded-none text-muted-foreground hover:text-foreground"
            disabled={quantity >= MAX_QUANTITY}
            aria-label={`${t.increaseQuantity} ${t.slots[slot]}`}
            onClick={() => onQuantityChange(quantity + 1)}
          >
            +
          </Button>
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            aria-label={`${t.change} ${t.slots[slot]}`}
            onClick={onPick}
            className="h-8 rounded-lg px-2.5 text-xs font-semibold"
          >
            <IconArrowsExchange className="mr-1 size-4" />
            {t.change}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`${t.deleteSlot} ${t.slots[slot]}`}
            onClick={onRemove}
            className="size-8 rounded-lg text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
          >
            <IconTrash className="size-4" />
          </Button>
        </div>
      </div>
    </article>
  );
}

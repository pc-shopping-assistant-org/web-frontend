"use client";

import {
  IconAlertTriangle,
  IconCheck,
  IconChevronDown,
  IconChevronRight,
  IconDeviceDesktop,
  IconDeviceFloppy,
  IconInfoCircle,
  IconPencil,
  IconPlus,
  IconShare,
  IconShoppingCart,
  IconTrash,
} from "@tabler/icons-react";
import {useState} from "react";

import {Alert, AlertDescription} from "@/components/ui/alert";
import {Button} from "@/components/ui/button";
import {Collapsible, CollapsibleContent, CollapsibleTrigger} from "@/components/ui/collapsible";
import {Input} from "@/components/ui/input";
import {useAddToCart} from "@/features/cart/queries";
import {cn} from "@/lib/utils";
import {Link} from "@/i18n/navigation";
import {coreSlots, optionalSlots, slotGroups, type Selection, type Slot} from "./contracts";
import type {BuilderCopy} from "./copy";
import type {BuildQuote} from "./models";
import {PartArt} from "./part-art";

const VARIANT_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Props = {
  t: BuilderCopy;
  selection: Selection;
  quantities: Partial<Record<Slot, number>>;
  quote?: BuildQuote;
  ready: boolean;
  error: boolean;
  budget: number;
  notice: string;
  shareLink: string;
  money: (value: number) => string;
  onEdit: (slot: Slot) => void;
  onRemove: (slot: Slot) => void;
  onClear: () => void;
  onSave: () => void;
  onShare: () => void;
  onRetry: () => void;
};

export function SetupSummary({
  t,
  selection,
  quantities,
  quote,
  ready,
  error,
  budget,
  notice,
  shareLink,
  money,
  onEdit,
  onRemove,
  onClear,
  onSave,
  onShare,
  onRetry,
}: Props) {
  const addToCart = useAddToCart();
  const [cartResult, setCartResult] = useState<{added: number; total: number} | null>(null);
  const selectedSlots = Object.keys(selection) as Slot[];
  const quantityOf = (slot: Slot) => quantities[slot] ?? 1;
  const total = (quote?.parts ?? []).reduce((sum, part) => sum + part.price * quantityOf(part.slot), 0);
  const extrasTotal = (quote?.parts ?? [])
    .filter((part) => optionalSlots.includes(part.slot))
    .reduce((sum, part) => sum + part.price * quantityOf(part.slot), 0);
  const conflictCount = quote?.checks.filter((check) => check.status === "INCOMPATIBLE").length ?? 0;
  const unknownCount = quote?.checks.filter((check) => check.status === "UNKNOWN").length ?? 0;
  const missing = coreSlots.filter((slot) => !selection[slot]);

  /** Puts every chosen part with a catalog variant into the signed-in customer's cart; stops at the first one that fails. */
  async function addAllToCart() {
    const buyable = (quote?.parts ?? []).filter((part) => VARIANT_ID.test(part.id));
    let added = 0;
    setCartResult(null);
    for (const part of buyable) {
      try {
        await addToCart.mutateAsync({productVariantId: part.id, quantity: quantityOf(part.slot)});
        added += 1;
      } catch {
        break;
      }
    }
    setCartResult({added, total: buyable.length});
  }
  const coreSelectedCount = coreSlots.filter((slot) => selection[slot]).length;

  // Power draw as the AI service estimates it; the meter is hidden until the build has a CPU or GPU to size it by.
  const power = quote?.power ?? null;
  const capacity = power ? (power.psuWatts ?? power.recommendedPsuWatts) : 0;
  const loadPercentage = power && capacity > 0 ? Math.min(100, Math.round((power.estimatedWatts / capacity) * 100)) : 0;
  const overloaded = power?.sufficient === false || loadPercentage > 85;

  return (
    <aside
      id="build-summary"
      aria-label={t.summary}
      className="scroll-mt-5 flex flex-col overflow-hidden rounded-2xl border bg-background shadow-xs lg:sticky lg:top-5"
    >
      {/* Header with Visual Chassis Art & Price (Phong Vũ Style) */}
      <header className="border-b bg-muted/20 p-5 text-center">
        <div className="flex items-center justify-between">
          <div className="text-left">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">{t.summary}</h2>
            <p className="text-xs text-muted-foreground">
              {selectedSlots.length} {t.selectedItems}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            aria-label={t.clear}
            className="size-8 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            disabled={!selectedSlots.length}
            onClick={onClear}
          >
            <IconTrash className="size-4" />
          </Button>
        </div>

        {/* Chassis Art Box */}
        <div className="mx-auto my-3 flex size-16 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 sm:size-20">
          <IconDeviceDesktop className="size-8 text-primary sm:size-10" />
        </div>

        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
          <IconCheck className="size-3.5" />
          {coreSelectedCount}/8 {t.coreProgress}
        </span>

        <div className="mt-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t.total}</p>
          <p aria-live="polite" className="mt-0.5 text-3xl font-black tracking-tight text-foreground">
            {ready ? money(total) : t.updating}
          </p>
        </div>

        {budget > 0 && ready && (
          <p
            className={cn(
              "mt-1 text-xs font-medium",
              total > budget ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400",
            )}
          >
            {total > budget ? t.overBudget : t.withinBudget} · {money(Math.abs(budget - total))}
          </p>
        )}
      </header>

      {/* Body Section */}
      <div className="space-y-4 p-4 sm:p-5">
        {!selectedSlots.length ? (
          <div className="rounded-xl border border-dashed px-4 py-8 text-center text-muted-foreground">
            <IconPlus className="mx-auto mb-2 size-6" />
            <h3 className="font-semibold">{t.setupEmpty}</h3>
            <p className="mt-1 text-xs leading-5">{t.setupEmptyHint}</p>
          </div>
        ) : (
          <>
            {power && (
              <div className="space-y-2 rounded-xl border bg-muted/15 p-3.5 text-xs">
                <div className="flex items-center justify-between font-semibold">
                  <span className="text-muted-foreground">{t.estimatedLoad}:</span>
                  <span className="font-bold text-foreground">
                    {power.estimatedWatts}W / {capacity}W
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn("h-full rounded-full transition-all duration-300", overloaded ? "bg-amber-500" : "bg-primary")}
                    style={{width: `${loadPercentage}%`}}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  {power.psuWatts !== null && power.sufficient ? (
                    <>
                      <span>{t.safeHeadroom}:</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">+{Math.max(0, 100 - loadPercentage)}%</span>
                    </>
                  ) : (
                    <>
                      <span>{t.recommendedPsu}:</span>
                      <span className={cn("font-bold", overloaded ? "text-amber-600 dark:text-amber-400" : "text-foreground")}>
                        ≥ {power.recommendedPsuWatts}W
                      </span>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Compatibility status card */}
            <div className="space-y-1.5 rounded-xl border bg-muted/20 p-3.5 text-xs">
              <div className="flex items-center gap-2 font-bold">
                <span className={cn("size-2 rounded-full", conflictCount > 0 ? "bg-destructive" : "bg-emerald-500")} />
                <span className={conflictCount > 0 ? "text-destructive" : "text-foreground"}>
                  {conflictCount > 0 ? `${conflictCount} ${t.conflicts}` : `${t.compatibility}: ${t.allCompatible}`}
                </span>
              </div>
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                {conflictCount > 0
                  ? "Phát hiện linh kiện có thông số kỹ thuật không tương thích. Vui lòng thay đổi."
                  : "Các thông số Socket, RAM, Form-factor và chuẩn kết nối hoàn toàn đồng bộ."}
              </p>
            </div>

            {/* Selected Components List */}
            <div className="space-y-3">
              {slotGroups.map((group) => {
                const selected = group.slots.filter((slot) => selection[slot]);
                if (!selected.length) return null;
                return (
                  <section key={group.id} aria-label={t.groups[group.id]}>
                    <h3 className="mb-2 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      {t.groups[group.id]}
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold">{selected.length}</span>
                    </h3>
                    <div className="space-y-1.5">
                      {selected.map((slot) => {
                        const part = quote?.parts.find((part) => part.slot === slot);
                        return (
                          <div
                            key={slot}
                            className="flex items-center justify-between gap-2.5 rounded-xl border bg-card/60 p-2.5 transition hover:border-primary/30"
                          >
                            <div className="flex min-w-0 items-center gap-2.5">
                              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-muted/20">
                                <PartArt slot={slot} compact />
                              </div>
                              <div className="min-w-0">
                                <p className="truncate text-xs font-semibold text-foreground">{part?.name ?? t.updating}</p>
                                <p className="text-[11px] font-medium text-primary">
                                  {part
                                    ? `${money(part.price * quantityOf(slot))}${quantityOf(slot) > 1 ? ` · x${quantityOf(slot)}` : ""}`
                                    : "—"}
                                </p>
                              </div>
                            </div>
                            <div className="flex shrink-0 items-center gap-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                aria-label={`${t.replace} ${t.slots[slot]}`}
                                onClick={() => onEdit(slot)}
                                className="size-7 rounded-lg text-primary hover:bg-primary/10"
                              >
                                <IconPencil className="size-3.5" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                aria-label={`${t.remove} ${t.slots[slot]}`}
                                onClick={() => onRemove(slot)}
                                className="size-7 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                              >
                                <IconTrash className="size-3.5" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </div>

            {/* Quick add more / extras buttons */}
            <div className="flex flex-wrap gap-2 pt-1">
              <Button variant="outline" size="sm" className="h-8 text-xs font-semibold" onClick={() => onEdit(missing[0] ?? coreSlots[0])}>
                <IconPlus className="mr-1 size-3.5" />
                {t.addMore}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs font-semibold text-muted-foreground hover:text-foreground"
                onClick={() => onEdit(optionalSlots.find((slot) => !selection[slot]) ?? optionalSlots[0])}
              >
                {t.addExtras}
                <IconChevronRight className="ml-1 size-3.5" />
              </Button>
            </div>

            {/* Expandable compatibility rule checks details */}
            <Collapsible className="group rounded-xl border bg-muted/10 p-3 text-xs transition-colors">
              <CollapsibleTrigger className="flex w-full cursor-pointer items-center justify-between text-left font-semibold select-none">
                <div className="flex items-center gap-2">
                  {conflictCount ? (
                    <IconAlertTriangle className="size-4 shrink-0 text-destructive" />
                  ) : (
                    <IconInfoCircle className="size-4 shrink-0 text-muted-foreground" />
                  )}
                  <span>
                    {t.compatibility} ({quote?.checks.length ?? 0} tiêu chí)
                  </span>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <span className="text-[11px]">{unknownCount > 0 ? `${unknownCount} ${t.unknownChecks}` : ""}</span>
                  <IconChevronDown className="size-4 transition-transform duration-200 group-data-[open]:rotate-180" />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <ul className="mt-3 space-y-2.5 border-t pt-3">
                  {quote?.checks.map((check) => (
                    <li key={check.code} className="text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-foreground">{t.checks[check.code as keyof typeof t.checks] ?? check.code}</span>
                        <span
                          className={cn(
                            "shrink-0 font-medium",
                            check.status === "INCOMPATIBLE"
                              ? "text-destructive"
                              : check.status === "COMPATIBLE"
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-muted-foreground",
                          )}
                        >
                          {t.statuses[check.status]}
                        </span>
                      </div>
                      {check.message && <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">{check.message}</p>}
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-[11px] leading-5 text-muted-foreground">{t.limited}</p>
              </CollapsibleContent>
            </Collapsible>

            {/* Subtotal breakdown */}
            <dl className="space-y-1.5 border-t pt-3 text-xs">
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">{t.coreTotal}:</dt>
                <dd className="font-semibold text-foreground">{ready ? money(total - extrasTotal) : "—"}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">{t.accessoriesTotal}:</dt>
                <dd className="font-semibold text-foreground">{ready ? money(extrasTotal) : "—"}</dd>
              </div>
            </dl>
          </>
        )}

        {error && (
          <Alert variant="destructive" className="rounded-xl border-destructive/20 bg-destructive/5">
            <AlertDescription className="flex items-center justify-between gap-2 text-xs text-destructive">
              <span>{t.error}</span>
              <Button variant="ghost" size="sm" onClick={onRetry}>
                {t.retry}
              </Button>
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Action Buttons Footer (Phong Vũ style) */}
      <footer className="space-y-2.5 border-t bg-card/50 p-4 sm:p-5">
        {ready && selectedSlots.length > 0 ? (
          <Link
            href={`/assistant?build=${encodeURIComponent(JSON.stringify(selection))}`}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 font-bold text-sm text-primary-foreground shadow-xs transition hover:opacity-90"
          >
            {t.askAi}
          </Link>
        ) : (
          <Button variant="outline" className="h-11 w-full rounded-xl" disabled>
            {t.askAi}
          </Button>
        )}

        <Button
          type="button"
          className="h-11 w-full rounded-xl bg-emerald-600 text-sm font-bold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-50"
          disabled={!ready || !selectedSlots.length || addToCart.isPending}
          onClick={() => void addAllToCart()}
        >
          <IconShoppingCart className="mr-1.5 size-5" />
          {t.addAllToCart}
        </Button>

        {cartResult && (
          <div
            role="status"
            className={cn(
              "rounded-lg p-2.5 text-xs font-medium",
              cartResult.added === cartResult.total
                ? "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
                : "bg-destructive/10 text-destructive",
            )}
          >
            {cartResult.added === cartResult.total ? t.cartNotice : `${t.cartFailed} (${cartResult.added}/${cartResult.total})`}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 pt-1">
          <Button
            variant="outline"
            size="sm"
            className="h-9 rounded-lg text-xs font-semibold"
            disabled={!ready || !selectedSlots.length}
            onClick={onSave}
          >
            <IconDeviceFloppy className="mr-1 size-3.5" />
            {t.save}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-9 rounded-lg text-xs font-semibold"
            disabled={!ready || !selectedSlots.length}
            onClick={onShare}
          >
            <IconShare className="mr-1 size-3.5" />
            {t.share}
          </Button>
        </div>

        {notice && (
          <p role="status" className="rounded-lg bg-muted p-2.5 text-xs text-muted-foreground">
            {notice}
          </p>
        )}
        {shareLink && <Input aria-label={t.shareLabel} value={shareLink} readOnly onFocus={(event) => event.target.select()} />}
      </footer>
    </aside>
  );
}

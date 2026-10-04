import {IconAlertTriangle, IconInfoCircle, IconChevronRight, IconDeviceDesktop, IconDeviceFloppy, IconPencil, IconPlus, IconShare, IconTrash} from "@tabler/icons-react";

import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {cn} from "@/lib/utils";
import {Link} from "@/i18n/navigation";
import {coreSlots, optionalSlots, slotGroups, type Selection, type Slot} from "./contracts";
import type {BuilderCopy} from "./copy";
import type {BuildQuote} from "./models";
import {PartArt} from "./part-art";

type Props = {
  t: BuilderCopy;
  selection: Selection;
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

export function SetupSummary({t, selection, quote, ready, error, budget, notice, shareLink, money, onEdit, onRemove, onClear, onSave, onShare, onRetry}: Props) {
  const selectedSlots = Object.keys(selection) as Slot[];
  const total = quote?.total ?? 0;
  const extrasTotal = (quote?.parts ?? []).filter(part => optionalSlots.includes(part.slot)).reduce((sum, part) => sum + part.price, 0);
  const conflictCount = quote?.checks.filter(check => check.status === "INCOMPATIBLE").length ?? 0;
  const unknownCount = quote?.checks.filter(check => check.status === "UNKNOWN").length ?? 0;
  const missing = coreSlots.filter(slot => !selection[slot]);

  return (
    <aside id="build-summary" aria-label={t.summary} className="scroll-mt-5 overflow-hidden rounded-2xl border bg-background shadow-sm xl:sticky xl:top-5">
      <header className="border-b bg-slate-950 p-5 text-white">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-white/10"><IconDeviceDesktop className="size-6" /></span>
          <div className="flex-1"><h2 className="text-xl font-semibold">{t.summary}</h2><p className="mt-0.5 text-xs text-slate-400">{selectedSlots.length} {t.selectedItems}</p></div>
          <Button variant="ghost" size="icon" aria-label={t.clear} className="text-slate-400 hover:bg-white/10 hover:text-white" disabled={!selectedSlots.length} onClick={onClear}><IconTrash /></Button>
        </div>
        <p className="mt-5 text-xs text-slate-400">{t.total}</p>
        <p aria-live="polite" className="mt-1 text-3xl font-bold tracking-tight">{ready ? money(total) : t.updating}</p>
        {budget > 0 && ready && <p className={cn("mt-2 text-xs", total > budget ? "text-amber-300" : "text-emerald-300")}>{total > budget ? t.overBudget : t.withinBudget} · {money(Math.abs(budget - total))}</p>}
      </header>

      <div className="space-y-4 p-4 xl:max-h-[46vh] xl:overflow-y-auto">
        {!selectedSlots.length ? (
          <div className="rounded-xl border border-dashed px-5 py-8 text-center">
            <IconPlus className="mx-auto mb-3 size-7 text-muted-foreground" />
            <h3 className="font-semibold">{t.setupEmpty}</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{t.setupEmptyHint}</p>
          </div>
        ) : slotGroups.map(group => {
          const selected = group.slots.filter(slot => selection[slot]);
          if (!selected.length) return null;
          return (
            <section key={group.id} aria-label={t.groups[group.id]}>
              <h3 className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.groups[group.id]}<span className="rounded-full bg-muted px-2 py-0.5">{selected.length}</span></h3>
              <div className="space-y-2">
                {selected.map(slot => {
                  const part = quote?.parts.find(part => part.slot === slot);
                  return (
                    <div key={slot} className="flex items-start gap-3 rounded-xl border p-3">
                      <PartArt slot={slot} compact />
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] text-muted-foreground">{t.slots[slot]}</p>
                        <p className="mt-0.5 line-clamp-2 text-sm font-medium leading-5">{part?.name ?? t.updating}</p>
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <span className="text-sm font-semibold">{part ? money(part.price) : "—"}</span>
                          <div className="flex gap-1">
                            <button aria-label={`${t.replace} ${t.slots[slot]}`} onClick={() => onEdit(slot)} className="rounded-lg p-1.5 text-primary hover:bg-primary/10"><IconPencil className="size-4" /></button>
                            <button aria-label={`${t.remove} ${t.slots[slot]}`} onClick={() => onRemove(slot)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><IconTrash className="size-4" /></button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => onEdit(missing[0] ?? coreSlots[0])}><IconPlus />{t.addMore}</Button>
          <Button variant="ghost" onClick={() => onEdit(optionalSlots.find(slot => !selection[slot]) ?? optionalSlots[0])}>{t.addExtras}<IconChevronRight /></Button>
        </div>
      </div>

      <div className="space-y-4 border-t p-4">
        {selectedSlots.length > 0 && <details className="rounded-xl border bg-muted/20 p-3">
          <summary className="cursor-pointer text-sm font-medium">
            {conflictCount ? <IconAlertTriangle className="mr-2 inline size-4 text-destructive" /> : <IconInfoCircle className="mr-2 inline size-4 text-muted-foreground" />}
            {t.compatibility}
            <span className="mt-1 block pl-6 text-xs text-muted-foreground">{conflictCount > 0 ? `${conflictCount} ${t.conflicts}` : `${unknownCount} ${t.unknownChecks}`}</span>
          </summary>
          <ul className="mt-3 space-y-3">{quote?.checks.map(check => <li key={check.code} className="text-xs"><span className="block font-medium">{t.checks[check.code as keyof typeof t.checks] ?? check.code}</span><span className={cn("mt-1 block", check.status === "INCOMPATIBLE" ? "text-destructive" : check.status === "COMPATIBLE" ? "text-emerald-700" : "text-muted-foreground")}>{t.statuses[check.status]}</span></li>)}</ul>
          <p className="mt-3 text-xs leading-5 text-muted-foreground">{t.limited}</p>
        </details>}
        {error && <div role="alert" className="text-sm text-destructive">{t.error}<Button variant="ghost" onClick={onRetry}>{t.retry}</Button></div>}
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between gap-2"><dt className="text-muted-foreground">{t.coreTotal}</dt><dd className="font-medium">{ready ? money(total - extrasTotal) : "—"}</dd></div>
          <div className="flex justify-between gap-2"><dt className="text-muted-foreground">{t.accessoriesTotal}</dt><dd className="font-medium">{ready ? money(extrasTotal) : "—"}</dd></div>
        </dl>
        <p className="text-xs leading-5 text-muted-foreground">{t.exclusions}</p>
        {ready && selectedSlots.length > 0 ? <Link href={`/assistant?build=${encodeURIComponent(JSON.stringify(selection))}`} className="flex min-h-11 items-center justify-center rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-sm font-semibold text-primary transition hover:bg-primary/10">{t.askAi}</Link> : <Button variant="outline" className="h-11 w-full" disabled>{t.askAi}</Button>}
        <p className="text-xs leading-5 text-muted-foreground">{t.askAiHint}</p>
        <div className="grid grid-cols-2 gap-2">
          <Button className="h-11" disabled={!ready || !selectedSlots.length} onClick={onSave}><IconDeviceFloppy />{t.save}</Button>
          <Button variant="outline" className="h-11" disabled={!ready || !selectedSlots.length} onClick={onShare}><IconShare />{t.share}</Button>
        </div>
        <p className="text-xs leading-5 text-muted-foreground">{t.noCart}</p>
        {notice && <p role="status" className="rounded-lg bg-muted p-3 text-sm">{notice}</p>}
        {shareLink && <Input aria-label={t.shareLabel} value={shareLink} readOnly onFocus={event => event.target.select()} />}
      </div>
    </aside>
  );
}

import {IconCheck} from "@tabler/icons-react";

import {Button} from "@/components/ui/button";
import {cn} from "@/lib/utils";
import type {BuilderCopy} from "./copy";
import type {Part} from "./models";
import {PartDetails} from "./part-details";

export function PartCard({
  part,
  selected,
  status,
  t,
  money,
  onSelect,
}: {
  part: Part;
  selected: boolean;
  status?: "COMPATIBLE" | "INCOMPATIBLE" | "UNKNOWN";
  t: BuilderCopy;
  money: (value: number) => string;
  onSelect: () => void;
}) {
  return (
    <article
      className={cn(
        "group flex h-full flex-col justify-between rounded-2xl border bg-card p-4 transition-all duration-200 hover:border-primary/40 hover:shadow-xs",
        selected && "border-primary bg-primary/5 ring-1 ring-primary/20",
      )}
    >
      <div>
        <PartDetails part={part} compact selected={selected} t={t} money={money} onSelect={onSelect} />
        {status && (
          <div className="mt-2.5 flex min-h-6 items-center">
            {status === "COMPATIBLE" ? (
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                ✓ {t.statuses.COMPATIBLE}
              </span>
            ) : status === "INCOMPATIBLE" ? (
              <span className="inline-flex items-center gap-1 rounded-md bg-destructive/10 px-2 py-0.5 text-[11px] font-bold text-destructive">
                ⚠ {t.statuses.INCOMPATIBLE}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                {t.statuses.UNKNOWN}
              </span>
            )}
          </div>
        )}
      </div>
      <div className="mt-4 flex items-center justify-between gap-2 border-t pt-3">
        <div>
          <p className="text-base font-extrabold text-primary">{money(part.price)}</p>
        </div>
        <Button
          type="button"
          size="sm"
          aria-label={selected ? t.selected : t.select}
          className="h-8 rounded-lg px-4 text-xs font-bold shadow-2xs"
          variant={selected ? "secondary" : "default"}
          onClick={onSelect}
        >
          {selected && <IconCheck className="mr-1 size-3.5" />}
          {selected ? t.selected : t.choosePart}
        </Button>
      </div>
    </article>
  );
}

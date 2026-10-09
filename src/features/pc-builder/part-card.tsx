import {IconCheck, IconPlus} from "@tabler/icons-react";

import {Button} from "@/components/ui/button";
import {cn} from "@/lib/utils";
import type {BuilderCopy} from "./copy";
import type {Part} from "./models";
import {PartDetails} from "./part-details";

export function PartCard({part, selected, status, t, money, onSelect}: {part: Part; selected: boolean; status?: "COMPATIBLE" | "INCOMPATIBLE" | "UNKNOWN"; t: BuilderCopy; money: (value: number) => string; onSelect: () => void}) {
  return (
    <article className={cn("rounded-xl border p-3 transition hover:border-primary/40", selected && "border-primary bg-primary/5 ring-1 ring-primary/20")}>
      <PartDetails part={part} compact selected={selected} t={t} money={money} onSelect={onSelect} />
      {status && <p title={t.statuses[status]} className={cn("mt-2 truncate text-xs", status === "INCOMPATIBLE" ? "text-destructive" : status === "COMPATIBLE" ? "text-emerald-700" : "text-muted-foreground")}>{t.statuses[status]}</p>}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t pt-3">
        <p className="text-base font-bold text-primary">{money(part.price)}</p>
        <Button className="h-8 text-xs" variant={selected ? "secondary" : "default"} onClick={onSelect}>
          {selected ? <IconCheck /> : <IconPlus />}{selected ? t.selected : t.select}
        </Button>
      </div>
    </article>
  );
}

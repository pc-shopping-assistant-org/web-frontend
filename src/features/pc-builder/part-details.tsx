import {Dialog} from "@base-ui/react/dialog";
import {IconX} from "@tabler/icons-react";
import {useState} from "react";

import {Button} from "@/components/ui/button";
import type {BuilderCopy} from "./copy";
import type {Part} from "./models";
import {PartArt} from "./part-art";

export function PartDetails({part, compact = false, selected, t, money, onSelect}: {part: Part; compact?: boolean; selected: boolean; t: BuilderCopy; money: (value: number) => string; onSelect: () => void}) {
  const [open, setOpen] = useState(false);
  return <Dialog.Root open={open} onOpenChange={setOpen}>
    <div className={compact ? "flex items-start gap-3" : ""}>
      <Dialog.Trigger aria-label={`${t.details}: ${part.name}`} className={compact ? "flex size-16 shrink-0 items-center justify-center rounded-lg bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring" : "block w-full rounded-xl focus-visible:ring-2 focus-visible:ring-ring"}>
        <PartArt slot={part.slot} compact={compact} />
      </Dialog.Trigger>
      <div className={compact ? "min-w-0 flex-1" : "mt-3"}>
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{part.brand}</p>
        <h3 className={compact ? "mt-1 line-clamp-2 text-sm font-semibold leading-5" : "mt-1 min-h-12 text-base font-semibold leading-6"}>
          <Dialog.Trigger className="text-left hover:text-primary focus-visible:outline-2 focus-visible:outline-ring">{part.name}</Dialog.Trigger>
        </h3>
        <p className="mt-1 truncate text-xs text-muted-foreground">{compact ? Object.values(part.specs).slice(0, 2).join(" · ") : part.sku}</p>
      </div>
    </div>
    <Dialog.Portal>
      <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
      <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 max-h-[90dvh] w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border bg-background p-5 shadow-xl sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div><p className="text-xs font-semibold text-primary">{part.brand} · {t.slots[part.slot]}</p><Dialog.Title className="mt-1 text-xl font-semibold">{part.name}</Dialog.Title></div>
          <Dialog.Close aria-label={t.close} className="rounded-lg p-2 text-muted-foreground hover:bg-muted"><IconX className="size-5" /></Dialog.Close>
        </div>
        <Dialog.Description className="mt-2 text-xs text-muted-foreground">{t.notice}</Dialog.Description>
        <div className="my-5"><PartArt slot={part.slot} /></div>
        <p className="text-xs text-muted-foreground">{t.illustration}</p>
        <p className="mt-3 text-2xl font-bold text-primary">{money(part.price)}</p>
        <p className="mt-2 text-sm text-muted-foreground">SKU: <span>{part.sku}</span></p>
        <dl className="my-5 divide-y rounded-xl border px-4">
          {Object.entries(part.specs).map(([key, value]) => <div key={key} className="flex justify-between gap-4 py-3 text-sm"><dt className="text-muted-foreground">{t.specLabels[key as keyof typeof t.specLabels] ?? key.replaceAll("_", " ")}</dt><dd className="max-w-[65%] break-words text-right font-medium">{value}</dd></div>)}
        </dl>
        <Button className="h-11 w-full" onClick={() => {onSelect(); setOpen(false);}}>{selected ? t.selected : t.select}</Button>
      </Dialog.Popup>
    </Dialog.Portal>
  </Dialog.Root>;
}

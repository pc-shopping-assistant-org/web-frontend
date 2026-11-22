import {IconX} from "@tabler/icons-react";
import {useState} from "react";

import {Button} from "@/components/ui/button";
import {DialogClose, DialogContent, DialogDescription, DialogRoot, DialogTitle, DialogTrigger} from "@/components/ui/dialog";
import type {BuilderCopy} from "./copy";
import type {Part} from "./models";
import {PartArt} from "./part-art";

export function PartDetails({
  part,
  compact = false,
  selected,
  t,
  money,
  onSelect,
}: {
  part: Part;
  compact?: boolean;
  selected: boolean;
  t: BuilderCopy;
  money: (value: number) => string;
  onSelect: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <DialogRoot open={open} onOpenChange={setOpen}>
      <div className={compact ? "flex flex-col gap-3" : ""}>
        <DialogTrigger
          aria-label={`${t.details}: ${part.name}`}
          className={
            compact
              ? "flex h-36 w-full shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-white focus-visible:ring-2 focus-visible:ring-ring"
              : "block w-full rounded-xl focus-visible:ring-2 focus-visible:ring-ring"
          }
        >
          <PartArt slot={part.slot} compact={compact} fill={compact} imageUrl={part.imageUrl} alt={part.name} />
        </DialogTrigger>
        <div className={compact ? "min-w-0 flex-1" : "mt-3"}>
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{part.brand}</p>
          <h3 className={compact ? "mt-1 min-h-10 text-sm font-semibold leading-5" : "mt-1 min-h-12 text-base font-semibold leading-6"}>
            <DialogTrigger
              title={part.name}
              className={
                compact
                  ? "line-clamp-2 break-words text-left hover:text-primary focus-visible:outline-2 focus-visible:outline-ring"
                  : "text-left hover:text-primary focus-visible:outline-2 focus-visible:outline-ring"
              }
            >
              {part.name}
            </DialogTrigger>
          </h3>
          {!compact && (
            <p className="mt-1 truncate text-xs text-muted-foreground">
              {part.sku}
            </p>
          )}
        </div>
      </div>
      <DialogContent className="max-h-[90dvh] w-[calc(100%-2rem)] max-w-xl overflow-y-auto p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-primary">
              {part.brand} · {t.slots[part.slot]}
            </p>
            <DialogTitle className="mt-1 text-xl">{part.name}</DialogTitle>
          </div>
          <DialogClose aria-label={t.close} className="rounded-lg p-2 text-muted-foreground hover:bg-muted">
            <IconX className="size-5" />
          </DialogClose>
        </div>
        <DialogDescription className="sr-only">{part.name}</DialogDescription>
        <div className="my-5">
          <PartArt slot={part.slot} imageUrl={part.imageUrl} alt={part.name} />
        </div>
        <p className="text-xs text-muted-foreground">{t.illustration}</p>
        <p className="mt-3 text-2xl font-bold text-primary">{money(part.price)}</p>
        <p className="mt-2 text-sm text-muted-foreground">
          SKU: <span>{part.sku}</span>
        </p>
        <dl className="my-5 divide-y rounded-xl border px-4">
          {Object.entries(part.specs).map(([key, value]) => (
            <div key={key} className="flex justify-between gap-4 py-3 text-sm">
              <dt className="text-muted-foreground">{t.specLabels[key as keyof typeof t.specLabels] ?? key.replaceAll("_", " ")}</dt>
              <dd className="max-w-[65%] break-words text-right font-medium">{value}</dd>
            </div>
          ))}
        </dl>
        <Button
          className="h-11 w-full"
          onClick={() => {
            onSelect();
            setOpen(false);
          }}
        >
          {selected ? t.selected : t.select}
        </Button>
      </DialogContent>
    </DialogRoot>
  );
}

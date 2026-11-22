"use client";

import {IconCheck} from "@tabler/icons-react";

import {Button} from "@/components/ui/button";
import {ScrollArea, ScrollBar} from "@/components/ui/scroll-area";
import {cn} from "@/lib/utils";
import {BuilderTab, coreSlots, optionalSlots, slots, type Selection, type Slot} from "./contracts";
import type {BuilderCopy} from "./copy";

export function SlotQuickBar({
  activeTab,
  lastCoreSlot,
  lastPeripheralSlot,
  selection,
  onSelectSlot,
  t,
}: {
  activeTab: BuilderTab;
  lastCoreSlot: Slot;
  lastPeripheralSlot: Slot;
  selection: Selection;
  onSelectSlot: (slot: Slot) => void;
  t: BuilderCopy;
}) {
  const visibleSlots =
    activeTab === BuilderTab.PERIPHERALS
      ? optionalSlots
      : activeTab === BuilderTab.ALL
        ? slots
        : coreSlots;

  return (
    <ScrollArea className="w-full border-b bg-muted/15">
      <nav aria-label={t.choose} className="flex w-max items-center gap-1.5 px-4 py-2">
        <span className="mr-1 shrink-0 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          {t.choose}:
        </span>
        {visibleSlots.map((slotKey) => (
          <Button
            key={slotKey}
            type="button"
            size="sm"
            variant={selection[slotKey] ? "secondary" : "outline"}
            aria-pressed={
              activeTab === BuilderTab.CORE
                ? lastCoreSlot === slotKey
                : activeTab === BuilderTab.PERIPHERALS
                  ? lastPeripheralSlot === slotKey
                  : false
            }
            onClick={() => onSelectSlot(slotKey)}
            className={cn(
              "h-7 shrink-0 gap-1.5 rounded-full px-2.5 text-xs font-medium",
              selection[slotKey] && "border border-primary/40 bg-primary/10 font-bold text-primary hover:bg-primary/15",
            )}
          >
            {selection[slotKey] && <IconCheck className="size-3.5 shrink-0" />}
            {t.slots[slotKey]}
          </Button>
        ))}
      </nav>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}

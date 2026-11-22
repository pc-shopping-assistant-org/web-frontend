"use client";

import {IconSearch, IconSparkles, IconX} from "@tabler/icons-react";
import {useMemo, useState} from "react";

import {Button} from "@/components/ui/button";
import {DialogClose, DialogContent, DialogDescription, DialogRoot, DialogTitle} from "@/components/ui/dialog";
import {Input} from "@/components/ui/input";
import {Select} from "@/components/ui/select";
import type {BuilderCopy} from "./copy";
import {buildGoals, type BuildGoal, type Selection} from "./contracts";

export type PresetBuildItem = {
  id: string;
  name: string;
  goal: BuildGoal;
  price: number;
  selection: Selection;
};

export function PresetBuildsDialog({
  open,
  onOpenChange,
  presets,
  onSelect,
  t,
  money,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  presets: PresetBuildItem[];
  currentGoal?: BuildGoal;
  onSelect: (preset: PresetBuildItem) => void;
  t: BuilderCopy;
  money: (value: number) => string;
}) {
  const [filterGoal, setFilterGoal] = useState<"all" | BuildGoal>("all");
  const [search, setSearch] = useState("");
  const [budgetCap, setBudgetCap] = useState(0);

  const filtered = useMemo(() => {
    return presets.filter((item) => {
      if (filterGoal !== "all" && item.goal !== filterGoal) return false;
      if (budgetCap > 0 && item.price > budgetCap) return false;
      if (search.trim()) {
        const query = search.toLowerCase();
        return item.name.toLowerCase().includes(query);
      }
      return true;
    });
  }, [presets, filterGoal, budgetCap, search]);

  return (
    <DialogRoot open={open} onOpenChange={onOpenChange}>
      <DialogContent
        aria-label={t.allPresetsLabel}
        className="flex max-h-[90vh] w-[95vw] max-w-4xl flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-5 py-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <IconSparkles className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-foreground sm:text-lg">
                {t.allPresetsTitle}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {t.allPresetsSubtitle}
              </DialogDescription>
            </div>
          </div>
          <DialogClose
            render={
              <Button variant="ghost" size="icon" className="size-8 rounded-lg text-muted-foreground hover:text-foreground">
                <IconX className="size-4" />
              </Button>
            }
          />
        </div>

          {/* Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-muted/20 px-5 py-3 sm:px-6">
            <div className="flex flex-wrap items-center gap-1.5">
              <Button
                size="sm"
                variant={filterGoal === "all" ? "default" : "outline"}
                className="h-8 text-xs font-semibold"
                onClick={() => setFilterGoal("all")}
              >
                {t.allLabel} ({presets.length})
              </Button>
              {buildGoals.map((g) => (
                <Button
                  key={g}
                  size="sm"
                  variant={filterGoal === g ? "default" : "outline"}
                  className="h-8 text-xs font-semibold"
                  onClick={() => setFilterGoal(g)}
                >
                  {t[g] || g} ({presets.filter((p) => p.goal === g).length})
                </Button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <Select
                value={budgetCap}
                onChange={(e) => setBudgetCap(Number(e.target.value))}
                className="h-8 w-auto min-w-32 cursor-pointer text-xs font-medium"
              >
                <option value={0}>{t.noBudget}</option>
                {[15000000, 20000000, 30000000, 50000000, 80000000, 150000000].map((v) => (
                  <option key={v} value={v}>
                    ≤ {money(v)}
                  </option>
                ))}
              </Select>

              <div className="relative w-44 sm:w-56">
                <IconSearch className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t.presetSearchPlaceholder}
                  className="h-8 pl-8 pr-3 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Preset Cards Grid */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6">
            {filtered.length === 0 ? (
              <div className="py-16 text-center text-sm text-muted-foreground">
                {t.noMatchingPresets}
              </div>
            ) : (
              <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((item) => (
                  <article
                    key={item.id}
                    className="flex flex-col justify-between rounded-xl border bg-card p-4 transition-all duration-150 hover:border-primary/40 hover:shadow-xs"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          {t[item.goal] || item.goal}
                        </span>
                      </div>
                      <h4 className="mt-2 text-xs font-bold leading-snug text-foreground line-clamp-2" title={item.name}>
                        {item.name}
                      </h4>
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-2 border-t pt-3">
                      <div>
                        <p className="text-[11px] text-muted-foreground">{t.bundlePrice}</p>
                        <p className="text-sm font-extrabold text-primary">{money(item.price)}</p>
                      </div>
                      <Button
                        size="sm"
                        className="h-8 rounded-lg px-3 text-xs font-bold"
                        onClick={() => {
                          onSelect(item);
                          onOpenChange(false);
                        }}
                      >
                        {t.chooseThisBuild}
                      </Button>
                    </div>
                  </article>
                ))}
              </div>
            )}
        </div>
      </DialogContent>
    </DialogRoot>
  );
}

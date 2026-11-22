"use client";

import {IconLoader2, IconSparkles, IconX} from "@tabler/icons-react";
import {useState} from "react";

import {Alert, AlertDescription} from "@/components/ui/alert";
import {Button} from "@/components/ui/button";
import {DialogClose, DialogContent, DialogDescription, DialogRoot, DialogTitle} from "@/components/ui/dialog";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Select} from "@/components/ui/select";
import {optimizeBuild} from "./compatibility-api";
import {
  BuildObjective,
  buildObjectives,
  coreSlots,
  UseCaseProfile,
  useCaseProfiles,
  type Selection,
} from "./contracts";
import type {BuilderCopy} from "./copy";

const DEFAULT_OPTIMIZE_BUDGET_VND = 25_000_000;
const MIN_OPTIMIZE_BUDGET_VND = 5_000_000;

export function AutoOptimizeDialog({
  open,
  onOpenChange,
  currentSelection,
  defaultBudget,
  onOptimized,
  t,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentSelection: Selection;
  defaultBudget: number;
  onOptimized: (selection: Selection) => void;
  t: BuilderCopy;
}) {
  const [profile, setProfile] = useState<UseCaseProfile>(UseCaseProfile.GAMING_1440P);
  const [objective, setObjective] = useState<BuildObjective>(BuildObjective.BALANCED);
  const [budgetVnd, setBudgetVnd] = useState<number>(
    defaultBudget >= MIN_OPTIMIZE_BUDGET_VND ? defaultBudget : DEFAULT_OPTIMIZE_BUDGET_VND,
  );
  const [running, setRunning] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const pinnedCoreSlots: Selection = {};
  for (const slot of coreSlots) {
    const id = currentSelection[slot];
    if (id) pinnedCoreSlots[slot] = id;
  }
  const pinnedCount = Object.keys(pinnedCoreSlots).length;

  async function handleRun() {
    if (running) return;
    setRunning(true);
    setErrorMessage("");
    try {
      const result = await optimizeBuild({
        budgetVnd: Math.max(MIN_OPTIMIZE_BUDGET_VND, budgetVnd),
        useCase: profile,
        objective,
        pinnedSlots: pinnedCoreSlots,
      });
      onOptimized({...currentSelection, ...result.selection});
      onOpenChange(false);
    } catch {
      setErrorMessage(t.autoOptimizeFailed);
    } finally {
      setRunning(false);
    }
  }

  return (
    <DialogRoot open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-md p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <IconSparkles className="size-5" />
            </span>
            <div>
              <DialogTitle className="text-base font-bold">{t.autoOptimizeTitle}</DialogTitle>
              <DialogDescription className="mt-0.5 text-xs">{t.autoOptimizeSubtitle}</DialogDescription>
            </div>
          </div>
          <DialogClose
            render={
              <Button variant="ghost" size="icon" aria-label={t.close} className="size-8 rounded-lg text-muted-foreground">
                <IconX className="size-4" />
              </Button>
            }
          />
        </div>

        <div className="mt-4 space-y-3.5">
          <div className="space-y-1.5">
            <Label htmlFor="auto-optimize-profile" className="text-xs font-semibold">
              {t.autoOptimizeProfileLabel}
            </Label>
            <Select
              id="auto-optimize-profile"
              value={profile}
              onChange={(e) => setProfile(e.target.value as UseCaseProfile)}
              className="h-9 text-xs font-medium"
            >
              {useCaseProfiles.map((value) => (
                <option key={value} value={value}>
                  {t.profiles[value]}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="auto-optimize-objective" className="text-xs font-semibold">
              {t.autoOptimizeObjectiveLabel}
            </Label>
            <Select
              id="auto-optimize-objective"
              value={objective}
              onChange={(e) => setObjective(e.target.value as BuildObjective)}
              className="h-9 text-xs font-medium"
            >
              {buildObjectives.map((value) => (
                <option key={value} value={value}>
                  {t.objectives[value]}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="auto-optimize-budget" className="text-xs font-semibold">
              {t.autoOptimizeBudgetLabel}
            </Label>
            <Input
              id="auto-optimize-budget"
              type="number"
              min={MIN_OPTIMIZE_BUDGET_VND}
              step={1_000_000}
              value={budgetVnd}
              onChange={(e) => setBudgetVnd(Number(e.target.value) || MIN_OPTIMIZE_BUDGET_VND)}
              className="h-9 text-xs font-medium"
            />
          </div>

          {pinnedCount > 0 ? (
            <p className="rounded-lg bg-primary/5 px-3 py-2 text-xs text-primary">
              {t.autoOptimizePinnedNotice} ({pinnedCount})
            </p>
          ) : null}

          {errorMessage ? (
            <Alert variant="destructive" className="rounded-xl border-destructive/20 bg-destructive/5">
              <AlertDescription className="text-xs text-destructive">{errorMessage}</AlertDescription>
            </Alert>
          ) : null}

          <Button type="button" onClick={() => void handleRun()} disabled={running} className="h-10 w-full gap-2 font-semibold">
            {running ? <IconLoader2 className="size-4 animate-spin" /> : <IconSparkles className="size-4" />}
            {running ? t.autoOptimizeRunning : t.autoOptimizeRun}
          </Button>
        </div>
      </DialogContent>
    </DialogRoot>
  );
}

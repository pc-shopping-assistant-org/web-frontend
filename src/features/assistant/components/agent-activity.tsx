"use client";

import {
  Check,
  CheckCircle2,
  Cpu,
  FileText,
  Globe,
  Loader2,
  Scale,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import {useTranslations} from "next-intl";

import {AgentActivityStage} from "@/lib/domain/assistant-enums";
import type {AgentActivityEvent} from "../contracts/stateful";

const STAGE_ICONS: Record<AgentActivityStage, typeof Sparkles> = {
  [AgentActivityStage.Thinking]: Sparkles,
  [AgentActivityStage.SearchingCatalog]: Search,
  [AgentActivityStage.LoadingDetails]: FileText,
  [AgentActivityStage.Comparing]: Scale,
  [AgentActivityStage.CheckingCompatibility]: ShieldCheck,
  [AgentActivityStage.BuildingPc]: Cpu,
  [AgentActivityStage.SearchingWeb]: Globe,
  [AgentActivityStage.Verifying]: CheckCircle2,
};

export function AgentActivity({
  steps,
  compact = false,
}: {
  steps: AgentActivityEvent[];
  compact?: boolean;
}) {
  const t = useTranslations("assistant");
  if (!steps.length) return null;

  const active = steps[steps.length - 1];
  const previous = steps.slice(Math.max(0, steps.length - (compact ? 3 : 5)), -1);
  const ActiveIcon = STAGE_ICONS[active.stage] ?? Sparkles;

  return (
    <div
      role="status"
      aria-live="polite"
      className="mb-2 space-y-1.5 rounded-xl border border-primary/15 bg-primary/[0.03] px-3 py-2 text-xs"
    >
      {previous.length > 0 ? (
        <ul className="space-y-1">
          {previous.map((step, index) => (
            <li
              key={`${step.stage}-${step.detail ?? ""}-${index}`}
              className="flex items-center gap-2 text-muted-foreground/85"
            >
              <Check className="size-3.5 shrink-0 text-emerald-600" />
              <span className="truncate">{t(`activity.${step.stage}`)}</span>
              {step.detail ? (
                <span className="max-w-[45%] truncate rounded bg-muted/70 px-1.5 py-0.5 text-[11px] text-muted-foreground">
                  {step.detail}
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}

      <div className="flex items-center gap-2 font-medium text-foreground">
        <span className="relative flex size-4 shrink-0 items-center justify-center text-primary">
          <Loader2 className="size-3.5 animate-spin" />
        </span>
        <ActiveIcon className="size-3.5 shrink-0 text-primary/80" />
        <span className="min-w-0 truncate">{t(`activity.${active.stage}`)}</span>
        {active.detail ? (
          <span className="max-w-[50%] truncate rounded-md border border-primary/20 bg-background/80 px-1.5 py-0.5 text-[11px] font-normal text-muted-foreground">
            {active.detail}
          </span>
        ) : null}
      </div>
    </div>
  );
}

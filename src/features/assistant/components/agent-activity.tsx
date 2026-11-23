"use client";

import {
  CheckCircle2,
  Cpu,
  FileText,
  Globe,
  Scale,
  Search,
  ShieldCheck,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import {useTranslations} from "next-intl";

import {
  ChainOfThought,
  ChainOfThoughtContent,
  ChainOfThoughtHeader,
  ChainOfThoughtSearchResult,
  ChainOfThoughtSearchResults,
  ChainOfThoughtStep,
} from "@/components/ai-elements/chain-of-thought";
import {Spinner} from "@/components/ui/spinner";
import {AgentActivityStage} from "@/lib/domain/assistant-enums";
import type {AgentActivityEvent} from "../contracts/stateful";

const STAGE_ICONS: Record<AgentActivityStage, LucideIcon> = {
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

  const visibleSteps = steps.slice(-(compact ? 4 : 6));

  return (
    <ChainOfThought
      defaultOpen
      className="mb-2 space-y-2 rounded-xl border border-border/60 bg-muted/25 px-3 py-2"
    >
      <ChainOfThoughtHeader className="text-xs font-medium text-foreground">
        <span className="inline-flex items-center gap-2">
          <Spinner className="size-3.5 text-primary" />
          <span>{t("streaming")}</span>
        </span>
      </ChainOfThoughtHeader>
      <ChainOfThoughtContent className="mt-1 space-y-2">
        {visibleSteps.map((step, index) => {
          const isActive = index === visibleSteps.length - 1;
          return (
            <ChainOfThoughtStep
              key={`${step.stage}-${step.detail ?? ""}-${index}`}
              icon={STAGE_ICONS[step.stage] ?? Sparkles}
              label={t(`activity.${step.stage}`)}
              status={isActive ? "active" : "complete"}
              className="text-xs"
            >
              {step.detail ? (
                <ChainOfThoughtSearchResults>
                  <ChainOfThoughtSearchResult>{step.detail}</ChainOfThoughtSearchResult>
                </ChainOfThoughtSearchResults>
              ) : null}
            </ChainOfThoughtStep>
          );
        })}
      </ChainOfThoughtContent>
    </ChainOfThought>
  );
}

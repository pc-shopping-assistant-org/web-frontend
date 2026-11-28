"use client";

import {Check, Minus, SlidersHorizontal, X} from "lucide-react";
import {useLocale, useTranslations} from "next-intl";

import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {RequirementOperation, RequirementValueKind} from "@/lib/domain/assistant-enums";
import {formatMoney} from "@/lib/format";
import type {ProposalChange, StatefulProposal} from "../models";

const KNOWN_SUBJECTS = new Set([
  "SETUP",
  "WORKLOAD",
  "CPU",
  "MAINBOARD",
  "RAM",
  "GPU",
  "STORAGE",
  "PSU",
  "CASE",
  "COOLER",
  "MONITOR",
  "KEYBOARD",
  "MOUSE",
  "HEADSET",
]);

const KNOWN_PREDICATES = new Set([
  "budget",
  "accessory_budget",
  "use_case",
  "scope",
  "capacity",
  "brand",
  "model",
  "identity",
  "use_resource",
  "form_factor",
  "resolution",
  "fps",
  "wattage",
  "selection",
  "objective",
]);

const STANDALONE_PREDICATES = new Set([
  "budget",
  "accessory_budget",
  "use_case",
  "scope",
  "resolution",
  "fps",
  "objective",
]);

const KNOWN_TEXT_VALUES = new Set([
  "GAMING_1080P",
  "GAMING_1440P",
  "GAMING_4K",
  "GAMING_ESPORTS",
  "STREAMING_GAMING",
  "CONTENT_CREATION_3D",
  "VIDEO_EDITING",
  "GRAPHIC_DESIGN_2D",
  "AI_DATA_SCIENCE",
  "SOFTWARE_DEV",
  "WORKSTATION_SILENT",
  "OFFICE_BUDGET",
  "FULL_SETUP",
  "CORE_ONLY",
  "PC_ONLY",
  "RECOMMEND",
  "PERFORMANCE",
  "BALANCED",
  "UPGRADE_FRIENDLY",
]);

type Translator = (key: string, values?: Record<string, string | number>) => string;

function formatRawToken(token: string): string {
  return token
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (ch) => ch.toUpperCase());
}

export function formatProposalChange(
  change: ProposalChange,
  t: Translator,
  locale: string,
  partNamesByVariantId?: ReadonlyMap<string, string>,
): {label: string; value: string; isClear: boolean; isSoft: boolean} {
  const isClear = change.operation === RequirementOperation.Clear;
  const isSoft = change.strength === "SOFT";
  const subject = change.subject?.toUpperCase() ?? null;
  const predicate = change.predicate?.toLowerCase() ?? null;

  let label: string;
  if (change.target === "RESOURCE" && !subject) {
    label = t("proposal.resourceLabel");
  } else if (
    (subject === "SETUP" || subject === "WORKLOAD") &&
    predicate &&
    STANDALONE_PREDICATES.has(predicate)
  ) {
    label = t(`proposal.predicates.${predicate}`);
  } else {
    const subjectLabel =
      subject && KNOWN_SUBJECTS.has(subject)
        ? t(`proposal.subjects.${subject}`)
        : subject
          ? formatRawToken(subject)
          : t("proposal.defaultSubject");
    const predicateLabel =
      predicate && KNOWN_PREDICATES.has(predicate)
        ? t(`proposal.predicates.${predicate}`)
        : predicate
          ? formatRawToken(predicate)
          : null;
    label = predicateLabel ? `${subjectLabel} · ${predicateLabel}` : subjectLabel;
  }

  let formattedValue = "";
  const val = change.value;
  if (val?.kind === RequirementValueKind.Quantity) {
    const base =
      val.unit.toUpperCase() === "VND"
        ? formatMoney(val.amount, locale)
        : `${new Intl.NumberFormat(locale === "vi" ? "vi-VN" : "en-US").format(val.amount)} ${val.unit}`;
    if (change.operator === "LTE") {
      formattedValue = t("proposal.operators.LTE", {value: base});
    } else if (change.operator === "GTE") {
      formattedValue = t("proposal.operators.GTE", {value: base});
    } else {
      formattedValue = base;
    }
  } else if (val?.kind === RequirementValueKind.Text) {
    const normalized = val.text.trim().toUpperCase();
    formattedValue = KNOWN_TEXT_VALUES.has(normalized)
      ? t(`proposal.values.${normalized}`)
      : val.text;
  } else if (val?.kind === RequirementValueKind.Reference || change.variantId) {
    const refId = val?.kind === RequirementValueKind.Reference ? val.variantId : (change.variantId ?? "");
    formattedValue = partNamesByVariantId?.get(refId) ?? t("proposal.selectedComponent");
  }

  return {label, value: formattedValue, isClear, isSoft};
}

export function ProposalCard({
  proposal,
  disabled = false,
  compact = false,
  partNamesByVariantId,
  onConfirm,
  onDiscard,
}: {
  proposal: StatefulProposal;
  disabled?: boolean;
  compact?: boolean;
  partNamesByVariantId?: ReadonlyMap<string, string>;
  onConfirm: () => void;
  onDiscard: () => void;
}) {
  const t = useTranslations("assistant");
  const locale = useLocale();
  const titleId = `proposal-title-${proposal.proposalId}`;

  return (
    <div
      aria-labelledby={titleId}
      className="overflow-hidden rounded-2xl border border-primary/25 bg-card shadow-xs"
    >
      <div className={`flex items-start gap-2.5 border-b border-border/60 bg-primary/[0.04] ${compact ? "px-3.5 py-2.5" : "px-4 py-3"}`}>
        <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/12 text-primary">
          <SlidersHorizontal className="size-3.5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 id={titleId} className="text-sm font-semibold tracking-tight text-foreground">
            {t("proposal.title")}
          </h3>
          <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
            {t("proposal.description")}
          </p>
        </div>
      </div>

      {proposal.changes.length > 0 ? (
        <ul role="list" className={`divide-y divide-border/50 ${compact ? "px-3.5 py-1" : "px-4 py-1.5"}`}>
          {proposal.changes.map((change, index) => {
            const formatted = formatProposalChange(change, t, locale, partNamesByVariantId);
            return (
              <li key={index} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 py-2 text-sm">
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className={`flex size-5 shrink-0 items-center justify-center rounded-full ${
                      formatted.isClear
                        ? "bg-destructive/10 text-destructive"
                        : "bg-primary/10 text-primary"
                    }`}
                  >
                    {formatted.isClear ? (
                      <Minus className="size-3" aria-hidden="true" />
                    ) : (
                      <Check className="size-3" aria-hidden="true" />
                    )}
                  </span>
                  <span className="font-medium text-muted-foreground">{formatted.label}</span>
                  {formatted.isClear ? (
                    <Badge variant="outline" className="border-destructive/30 bg-destructive/5 px-1.5 py-0 text-[11px] font-medium text-destructive">
                      {t("proposal.clearBadge")}
                    </Badge>
                  ) : null}
                  {formatted.isSoft && !formatted.isClear ? (
                    <Badge variant="outline" className="border-border bg-muted/60 px-1.5 py-0 text-[11px] font-medium text-muted-foreground">
                      {t("proposal.preferenceBadge")}
                    </Badge>
                  ) : null}
                </div>
                {formatted.value ? (
                  <span
                    className={`font-semibold tabular-nums ${
                      formatted.isClear ? "text-muted-foreground line-through" : "text-foreground"
                    }`}
                  >
                    {formatted.value}
                  </span>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}

      <div className={`flex flex-wrap items-center justify-end gap-2 border-t border-border/60 bg-muted/20 ${compact ? "px-3.5 py-2" : "px-4 py-2.5"}`}>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={disabled}
          onClick={onDiscard}
          className="min-h-8 gap-1.5 rounded-lg text-xs"
        >
          <X className="size-3.5" aria-hidden="true" />
          {t("discardProposal")}
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={disabled}
          onClick={onConfirm}
          className="min-h-8 gap-1.5 rounded-lg text-xs"
        >
          <Check className="size-3.5" aria-hidden="true" />
          {t("confirmProposal")}
        </Button>
      </div>
    </div>
  );
}

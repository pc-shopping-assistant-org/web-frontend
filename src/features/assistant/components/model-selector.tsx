"use client";

import {Brain, Check, ChevronDown, Cpu} from "lucide-react";
import {useTranslations} from "next-intl";
import {useState} from "react";

import {Button} from "@/components/ui/button";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";
import type {ThinkingMode} from "@/lib/domain/assistant-enums";
import type {PublicModelInfo, PublicModelsCatalog} from "../contracts/stateful";

export function resolveModelSelection(
  catalog: PublicModelsCatalog | undefined,
  preferredModelId?: string,
  preferredThinkingMode?: ThinkingMode,
): {
  activeModel?: PublicModelInfo;
  modelId?: string;
  thinkingMode?: ThinkingMode;
} {
  if (!catalog?.models.length) {
    return {};
  }
  const activeModel =
    catalog.models.find((entry) => entry.id === preferredModelId) ??
    catalog.models.find((entry) => entry.id === catalog.default_model_id) ??
    catalog.models[0];
  const supported = activeModel.supported_thinking_modes;
  if (!supported.length) {
    return {activeModel, modelId: activeModel.id, thinkingMode: undefined};
  }
  const thinkingMode =
    preferredThinkingMode && supported.includes(preferredThinkingMode)
      ? preferredThinkingMode
      : (activeModel.default_thinking_mode ?? supported[0]);
  return {activeModel, modelId: activeModel.id, thinkingMode};
}

export function ModelSelector({
  catalog,
  modelId,
  thinkingMode,
  disabled = false,
  compact = false,
  onSelectModel,
  onSelectThinkingMode,
}: {
  catalog?: PublicModelsCatalog;
  modelId?: string;
  thinkingMode?: ThinkingMode;
  disabled?: boolean;
  compact?: boolean;
  onSelectModel: (modelId: string, defaultThinkingMode?: ThinkingMode) => void;
  onSelectThinkingMode: (mode: ThinkingMode) => void;
}) {
  const t = useTranslations("assistant");
  const [modelOpen, setModelOpen] = useState(false);
  const [thinkingOpen, setThinkingOpen] = useState(false);

  const resolved = resolveModelSelection(catalog, modelId, thinkingMode);
  const activeModel = resolved.activeModel;
  if (!catalog || !activeModel) return null;

  const supportedModes = activeModel.supported_thinking_modes;
  const activeThinkingMode = resolved.thinkingMode;

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-1.5">
      <Popover open={modelOpen} onOpenChange={setModelOpen}>
        <PopoverTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={disabled}
              aria-label={t("selectModel")}
              title={t("selectModel")}
              className="h-7 max-w-[180px] gap-1.5 rounded-lg border border-border/60 bg-muted/35 px-2 text-xs font-medium text-foreground hover:border-primary/40 hover:bg-primary/5"
            />
          }
        >
          <Cpu className="size-3.5 shrink-0 text-primary" />
          <span className="truncate">{activeModel.label}</span>
          <ChevronDown className="size-3 shrink-0 text-muted-foreground" />
        </PopoverTrigger>
        <PopoverContent side="top" align="start" sideOffset={8} className="w-64 rounded-xl p-1.5 shadow-lg">
          <p className="px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {t("selectModel")}
          </p>
          <div className="mt-0.5 space-y-0.5">
            {catalog.models.map((entry) => {
              const selected = entry.id === activeModel.id;
              return (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => {
                    onSelectModel(
                      entry.id,
                      entry.default_thinking_mode ?? entry.supported_thinking_modes[0] ?? undefined,
                    );
                    setModelOpen(false);
                  }}
                  className={`flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-xs transition ${
                    selected
                      ? "bg-primary/10 font-semibold text-primary"
                      : "text-foreground hover:bg-muted"
                  }`}
                >
                  <span className="min-w-0 flex-1 truncate">{entry.label}</span>
                  {selected ? <Check className="size-3.5 shrink-0 text-primary" /> : null}
                </button>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>

      {supportedModes.length > 0 && activeThinkingMode ? (
        <Popover open={thinkingOpen} onOpenChange={setThinkingOpen}>
          <PopoverTrigger
            render={
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={disabled}
                aria-label={t("selectThinking")}
                title={t("selectThinking")}
                className="h-7 gap-1.5 rounded-lg border border-border/60 bg-muted/35 px-2 text-xs font-medium text-foreground hover:border-primary/40 hover:bg-primary/5"
              />
            }
          >
            <Brain className="size-3.5 shrink-0 text-primary" />
            {!compact ? (
              <span className="hidden text-muted-foreground sm:inline">{t("thinkingMode")}:</span>
            ) : null}
            <span>{t(`thinkingModes.${activeThinkingMode}`)}</span>
            <ChevronDown className="size-3 shrink-0 text-muted-foreground" />
          </PopoverTrigger>
          <PopoverContent side="top" align="start" sideOffset={8} className="w-48 rounded-xl p-1.5 shadow-lg">
            <p className="px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {t("selectThinking")}
            </p>
            <div className="mt-0.5 space-y-0.5">
              {supportedModes.map((mode) => {
                const selected = mode === activeThinkingMode;
                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => {
                      onSelectThinkingMode(mode);
                      setThinkingOpen(false);
                    }}
                    className={`flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs transition ${
                      selected
                        ? "bg-primary/10 font-semibold text-primary"
                        : "text-foreground hover:bg-muted"
                    }`}
                  >
                    <span>{t(`thinkingModes.${mode}`)}</span>
                    {selected ? <Check className="size-3.5 shrink-0 text-primary" /> : null}
                  </button>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>
      ) : null}
    </div>
  );
}


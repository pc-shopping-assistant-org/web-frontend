"use client";

import {Check, Search} from "lucide-react";
import {useState} from "react";

import {Input} from "@/components/ui/input";
import {cn} from "@/lib/utils";

export type MultiSelectOption = {
  value: string;
  label: string;
  description?: string;
};

/**
 * A keyboard-friendly multi-select for admin forms.
 *
 * Native `select[multiple]` controls make the most important catalog actions
 * depend on Ctrl/Cmd-click, which is especially easy to miss on a laptop or
 * touch device. The list keeps the same string-array contract while exposing
 * explicit, discoverable selection rows.
 */
export function MultiSelectList({
  id,
  label,
  hint,
  options,
  value,
  onChange,
  selectedLabel,
  emptyLabel,
  className,
}: {
  id: string;
  label: string;
  hint?: string;
  options: MultiSelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  selectedLabel?: string;
  emptyLabel: string;
  className?: string;
}) {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();
  const filtered = normalizedQuery
    ? options.filter((option) =>
        [option.label, option.description]
          .filter(Boolean)
          .some((text) => text!.toLowerCase().includes(normalizedQuery)),
      )
    : options;

  function toggle(optionValue: string) {
    onChange(
      value.includes(optionValue)
        ? value.filter((item) => item !== optionValue)
        : [...value, optionValue],
    );
  }

  return (
    <fieldset className={cn("space-y-2", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <legend id={`${id}-label`} className="text-sm font-medium">
          {label}
        </legend>
        <span className="text-xs tabular-nums text-muted-foreground">
          {selectedLabel ?? `${value.length} selected`}
        </span>
      </div>
      {hint ? <p className="text-xs leading-5 text-muted-foreground">{hint}</p> : null}
      {options.length > 8 ? (
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={label}
            aria-label={`${label} search`}
            className="h-9 pl-9"
          />
        </div>
      ) : null}
      {filtered.length === 0 ? (
        <p className="rounded-xl border border-dashed p-4 text-center text-sm text-muted-foreground">
          {emptyLabel}
        </p>
      ) : (
        <div
          id={id}
          role="listbox"
          aria-labelledby={`${id}-label`}
          aria-multiselectable="true"
          className="grid max-h-56 gap-2 overflow-y-auto rounded-xl border bg-muted/10 p-2 sm:grid-cols-2"
        >
          {filtered.map((option) => {
            const selected = value.includes(option.value);
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={selected}
                className={cn(
                  "flex min-w-0 items-start gap-3 rounded-lg border bg-background px-3 py-2.5 text-left text-sm transition",
                  selected
                    ? "border-primary/40 bg-primary/5 ring-1 ring-primary/15"
                    : "border-transparent hover:border-primary/25 hover:bg-primary/[0.03]",
                )}
                onClick={() => toggle(option.value)}
              >
                <span
                  className={cn(
                    "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded border transition",
                    selected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-input bg-background text-transparent",
                  )}
                  aria-hidden="true"
                >
                  <Check className="size-3" strokeWidth={3} />
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-medium">{option.label}</span>
                  {option.description ? (
                    <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                      {option.description}
                    </span>
                  ) : null}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </fieldset>
  );
}

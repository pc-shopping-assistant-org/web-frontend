"use client";

import {Search} from "lucide-react";
import {useTranslations} from "next-intl";
import type {ReactNode} from "react";

import {Button} from "@/components/ui/button";
import {Card} from "@/components/ui/card";
import {cn} from "@/lib/utils";

/** What the admin list pages are built from, so an orders list and a promotions list read as one product. */

export function PageHeader({title, description, actions}: {title: string; description?: string; actions?: ReactNode}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {actions}
    </div>
  );
}

/** Underline tabs that narrow a list by one value (a status, a state); the first tab is usually "all". */
export function StatusTabs({label, tabs, value, onChange}: {label: string; tabs: readonly {value: string; label: string}[]; value: string; onChange: (value: string) => void}) {
  return (
    <div role="tablist" aria-label={label} className="flex gap-6 overflow-x-auto overflow-y-hidden border-b">
      {tabs.map((tab) => (
        <button
          key={tab.value || "all"}
          type="button"
          role="tab"
          aria-selected={value === tab.value}
          onClick={() => onChange(tab.value)}
          className={cn(
            "-mb-px shrink-0 border-b-2 px-1 pb-3 text-sm transition",
            value === tab.value ? "border-primary font-medium text-primary" : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

/** A labelled control of a filter bar. */
export function FilterField({label, children}: {label: string; children: ReactNode}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

/** The filters of a list: the fields in a grid, then Search and Clear. Enter in any field searches. */
export function FilterPanel({children, onSubmit, onReset, error, className}: {children: ReactNode; onSubmit: () => void; onReset: () => void; error?: string; className?: string}) {
  const t = useTranslations("admin");
  return (
    <Card className="p-4 sm:p-5">
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <div className={cn("grid gap-3 sm:grid-cols-2 xl:grid-cols-4", className)}>{children}</div>
        {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
        <div className="flex flex-wrap items-center gap-2">
          <Button type="submit"><Search className="size-4" />{t("search")}</Button>
          <Button type="button" variant="outline" onClick={onReset}>{t("clearFilters")}</Button>
        </div>
      </form>
    </Card>
  );
}

/** The table of a list in its card; it scrolls sideways inside the card on a narrow screen. */
export function DataTable({columns, minWidth = "52rem", children}: {columns: readonly {key: string; label: ReactNode; className?: string}[]; minWidth?: string; children: ReactNode}) {
  return (
    <div className="overflow-x-auto rounded-xl border">
      <table className="w-full border-collapse text-sm" style={{minWidth}}>
        <thead className="bg-muted/50 text-left text-muted-foreground">
          <tr>
            {columns.map((column) => <th key={column.key} scope="col" className={cn("relative px-4 py-3 font-medium", column.className)}>{column.label}</th>)}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function EmptyBox({children}: {children: ReactNode}) {
  return <div className="rounded-xl border border-dashed p-12 text-center text-sm text-muted-foreground">{children}</div>;
}

/** Under a list: what is shown on the left, the pager on the right. */
export function ListFooter({summary, pager}: {summary: ReactNode; pager?: ReactNode}) {
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
      <p className="text-xs text-muted-foreground">{summary}</p>
      {pager}
    </div>
  );
}

/** A day typed in a date filter as the start or the end of that day, the way the backend takes it. */
export function dateParam(value: string, endOfDay: boolean) {
  if (!value) return undefined;
  return `${value}T${endOfDay ? "23:59:59" : "00:00:00"}Z`;
}

export function shortId(value?: string) {
  if (!value) return "—";
  return value.length > 14 ? `${value.slice(0, 8)}…${value.slice(-4)}` : value;
}

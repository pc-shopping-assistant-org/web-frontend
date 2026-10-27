"use client";

import {ChevronLeft, ChevronRight} from "lucide-react";
import {useSyncExternalStore} from "react";

import {cn} from "@/lib/utils";

const ELLIPSIS = "ellipsis";
type PageItem = number | typeof ELLIPSIS;

/**
 * 1-based page numbers to show, with "…" over the gaps: the first and last four and two pages on each side of the
 * current one, or, when `compact`, the first and last pages and one page on each side of the current one.
 */
export function pageItems(current: number, total: number, compact = false): PageItem[] {
  if (total <= (compact ? 7 : 11)) return Array.from({length: total}, (_, index) => index + 1);
  const edge = compact ? 1 : 4;
  const side = compact ? 1 : 2;
  const shown = new Set<number>();
  for (let offset = 0; offset < edge; offset++) {
    shown.add(1 + offset);
    shown.add(total - offset);
  }
  for (let offset = -side; offset <= side; offset++) shown.add(current + offset);
  if (compact && current <= 3) [2, 3, 4].forEach((page) => shown.add(page));
  if (compact && current >= total - 2) [total - 3, total - 2, total - 1].forEach((page) => shown.add(page));
  const pages = [...shown].filter((page) => page >= 1 && page <= total).sort((a, b) => a - b);
  const items: PageItem[] = [];
  pages.forEach((page, index) => {
    if (index > 0 && page - pages[index - 1] > 1) items.push(ELLIPSIS);
    items.push(page);
  });
  return items;
}

const PHONE_QUERY = "(max-width: 639px)";
const subscribePhone = (notify: () => void) => {
  const query = window.matchMedia?.(PHONE_QUERY);
  query?.addEventListener("change", notify);
  return () => query?.removeEventListener("change", notify);
};

type PaginationProps = {
  /** 1-based number of the current page. */
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  previousLabel: string;
  nextLabel: string;
  /** Names a page for screen readers, e.g. "Page 3". */
  pageLabel: (page: number) => string;
  className?: string;
};

const cell =
  "inline-flex size-9 items-center justify-center rounded-lg border bg-background text-sm font-medium transition-colors hover:border-primary/40 hover:bg-primary/5 disabled:pointer-events-none disabled:opacity-40";

export function Pagination({page, totalPages, onPageChange, previousLabel, nextLabel, pageLabel, className}: PaginationProps) {
  const compact = useSyncExternalStore(
    subscribePhone,
    () => window.matchMedia?.(PHONE_QUERY).matches ?? false,
    () => false,
  );
  if (totalPages <= 1) return null;
  return (
    <nav aria-label="pagination" className={cn("flex flex-wrap items-center justify-center gap-1.5", className)}>
      <button type="button" className={cell} aria-label={previousLabel} title={previousLabel} disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
        <ChevronLeft className="size-4" aria-hidden="true" />
      </button>
      {pageItems(page, totalPages, compact).map((item, index) =>
        item === ELLIPSIS ? (
          <span key={`gap-${index}`} className="inline-flex size-9 items-center justify-center text-muted-foreground" aria-hidden="true">
            …
          </span>
        ) : (
          <button
            key={item}
            type="button"
            className={cn(cell, item === page && "border-primary bg-primary text-primary-foreground hover:border-primary hover:bg-primary")}
            aria-label={pageLabel(item)}
            aria-current={item === page ? "page" : undefined}
            onClick={() => item !== page && onPageChange(item)}
          >
            {item}
          </button>
        ),
      )}
      <button type="button" className={cell} aria-label={nextLabel} title={nextLabel} disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
        <ChevronRight className="size-4" aria-hidden="true" />
      </button>
    </nav>
  );
}

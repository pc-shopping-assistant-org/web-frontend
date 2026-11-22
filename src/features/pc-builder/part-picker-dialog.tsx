"use client";

import {IconSearch, IconX} from "@tabler/icons-react";
import {keepPreviousData, useQuery} from "@tanstack/react-query";
import {useEffect, useMemo, useState} from "react";

import {Alert, AlertDescription, AlertTitle} from "@/components/ui/alert";
import {Button} from "@/components/ui/button";
import {Checkbox} from "@/components/ui/checkbox";
import {DialogClose, DialogContent, DialogRoot, DialogTitle} from "@/components/ui/dialog";
import {Input} from "@/components/ui/input";
import {Pagination} from "@/components/ui/pagination";
import {Separator} from "@/components/ui/separator";
import {Skeleton} from "@/components/ui/skeleton";
import {getBrands, getCandidates, getComponentPage} from "./api";
import {CheckVerdict, coreSlots, PickerSort, type Selection, type Slot} from "./contracts";
import type {BuilderCopy} from "./copy";
import {PartCard} from "./part-card";

/** How long typing pauses before the catalog is asked again. */
const SEARCH_DEBOUNCE_MS = 300;

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}

export function PartPickerDialog({
  open,
  onOpenChange,
  slot,
  selection,
  onSelect,
  t,
  money,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slot: Slot | null;
  selection: Selection;
  onSelect: (slot: Slot, partId: string) => void;
  t: BuilderCopy;
  money: (value: number) => string;
}) {
  const [search, setSearch] = useState("");
  const [brand, setBrand] = useState("");
  const [sort, setSort] = useState<PickerSort>(PickerSort.PRICE_ASC);
  const [hideConflicts, setHideConflicts] = useState(false);
  const [page, setPage] = useState(0);

  const isCore = slot ? coreSlots.includes(slot) : false;

  const keyword = useDebouncedValue(search, SEARCH_DEBOUNCE_MS);

  // The catalog filters, orders and pages; this dialog only asks for one page at a time.
  const catalog = useQuery({
    queryKey: ["pc-builder", "components", slot, page, keyword, brand, sort],
    queryFn: ({signal}) =>
      slot
        ? getComponentPage(slot, {page, keyword, brandId: brand || undefined, sort}, signal)
        : Promise.resolve({parts: [], totalPages: 1, totalElements: 0}),
    enabled: Boolean(slot && open),
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });

  const brands = useQuery({
    queryKey: ["pc-builder", "brands", slot],
    queryFn: ({signal}) => (slot ? getBrands(slot, signal) : Promise.resolve([])),
    enabled: Boolean(slot && open),
    staleTime: 5 * 60_000,
  });

  const pageParts = useMemo(() => catalog.data?.parts ?? [], [catalog.data]);
  const pageIds = useMemo(() => pageParts.map((part) => part.id), [pageParts]);
  const total = catalog.data?.totalElements ?? 0;
  const pageCount = catalog.data?.totalPages ?? 1;
  const currentPage = Math.min(page, pageCount - 1);

  const candidates = useQuery<Record<string, CheckVerdict>>({
    queryKey: ["pc-builder", "candidates", selection, slot, pageIds],
    queryFn: ({signal}) => (slot ? getCandidates(selection, slot, pageIds, signal) : Promise.resolve({})),
    enabled: Boolean(slot && open && isCore && pageIds.length > 0),
    staleTime: 60_000,
  });

  // The conflict filter can only act on the page in hand: the catalog does not know the build.
  const visibleParts = hideConflicts && isCore ? pageParts.filter((part) => candidates.data?.[part.id] !== CheckVerdict.INCOMPATIBLE) : pageParts;

  if (!slot) return null;

  return (
    <DialogRoot
      modal={false}
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setSearch("");
          setBrand("");
          setPage(0);
        }
        onOpenChange(next);
      }}
    >
      <DialogContent
        aria-labelledby="dialog-slot-title"
        className="flex h-[92vh] w-[calc(100%-2rem)] max-w-[90rem] flex-col overflow-hidden"
      >
        {/* Header (Phong Vũ Modal Style) */}
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b bg-card px-5 py-4">
          <div className="flex flex-wrap items-center gap-3">
            <DialogTitle id="dialog-slot-title" className="text-lg font-bold sm:text-xl">
              {t.choose}: {t.slots[slot]}
            </DialogTitle>
              <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                {total} {t.results}
              </span>
            </div>
            <div className="flex flex-1 items-center justify-end gap-3 sm:max-w-md">
              <div className="relative w-full">
                <IconSearch className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  aria-label={t.search}
                  placeholder={t.search}
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(0);
                  }}
                  className="h-10 pl-9 pr-8 text-sm"
                />
                {search && (
                  <button
                    type="button"
                    aria-label={t.clearSearch}
                    onClick={() => {
                      setSearch("");
                      setPage(0);
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <IconX className="size-4" />
                  </button>
                )}
              </div>
              <DialogClose
                aria-label={t.close}
                className="flex size-10 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                <IconX className="size-5" />
              </DialogClose>
            </div>
          </div>

          {/* Body */}
          <div className="grid flex-1 overflow-hidden md:grid-cols-[230px_1fr]">
            {/* Sidebar filter (Phong Vũ Style) */}
            <aside className="space-y-5 overflow-y-auto border-r bg-muted/20 p-4 text-xs sm:p-5">
              {/* Brand filter with checkboxes */}
              <div>
                <h4 className="mb-2.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  {t.brand}
                </h4>
                <div className="space-y-2">
                  <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-foreground">
                    <Checkbox
                      checked={brand === ""}
                      onCheckedChange={() => {
                        setBrand("");
                        setPage(0);
                      }}
                    />
                    <span>{t.brand}</span>
                  </label>
                  {(brands.data ?? []).map((b) => (
                    <label key={b.id} className="flex cursor-pointer items-center gap-2 text-xs font-medium text-foreground">
                      <Checkbox
                        checked={brand === b.id}
                        onCheckedChange={() => {
                          setBrand(brand === b.id ? "" : b.id);
                          setPage(0);
                        }}
                      />
                      <span>{b.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Compatibility filter (Core components) */}
              {isCore && (
                <>
                  <Separator />
                  <div>
                    <h4 className="mb-2.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      {t.compatibility}
                    </h4>
                    <label className="flex cursor-pointer items-start gap-2 text-xs font-medium text-foreground">
                      <Checkbox
                        checked={hideConflicts}
                        onCheckedChange={(checked) => {
                          setHideConflicts(Boolean(checked));
                          setPage(0);
                        }}
                        className="mt-0.5"
                      />
                      <span>{t.compatibleOnly}</span>
                    </label>
                  </div>
                </>
              )}
            </aside>

            {/* Product area */}
            <main className="flex flex-col overflow-hidden bg-background">
              {/* Top sort bar */}
              <div className="flex shrink-0 items-center justify-between border-b px-5 py-2.5 text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">{t.sort}:</span>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant={sort === PickerSort.PRICE_ASC ? "default" : "ghost"}
                    size="sm"
                    className="h-7 text-xs font-semibold"
                    onClick={() => {
                      setSort(PickerSort.PRICE_ASC);
                      setPage(0);
                    }}
                  >
                    {t.ascending}
                  </Button>
                  <Button
                    type="button"
                    variant={sort === PickerSort.PRICE_DESC ? "default" : "ghost"}
                    size="sm"
                    className="h-7 text-xs font-semibold"
                    onClick={() => {
                      setSort(PickerSort.PRICE_DESC);
                      setPage(0);
                    }}
                  >
                    {t.descending}
                  </Button>
                </div>
              </div>

              {/* Grid or Empty / Loading state */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5">
                {(catalog.isError || candidates.isError) && (
                  <Alert variant="destructive" className="mb-4 rounded-xl border-destructive/20 bg-destructive/10 p-4">
                    <AlertTitle className="text-xs font-semibold">{t.error}</AlertTitle>
                    <AlertDescription>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => {
                          void catalog.refetch();
                          void candidates.refetch();
                        }}
                      >
                        {t.retry}
                      </Button>
                    </AlertDescription>
                  </Alert>
                )}

                {catalog.isPending ? (
                  <div aria-label={t.loading} className="grid gap-3 sm:grid-cols-2">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <Skeleton key={i} className="h-44 rounded-xl" />
                    ))}
                  </div>
                ) : visibleParts.length === 0 ? (
                  <div className="py-20 text-center text-sm text-muted-foreground">{t.empty}</div>
                ) : (
                  <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                    {visibleParts.map((part) => (
                      <PartCard
                        key={part.id}
                        part={part}
                        selected={selection[slot] === part.id}
                        status={isCore ? candidates.data?.[part.id] : undefined}
                        t={t}
                        money={money}
                        onSelect={() => {
                          onSelect(slot, part.id);
                          onOpenChange(false);
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>

              {pageCount > 1 && (
                <div className="shrink-0 border-t px-5 py-3">
                  <Pagination
                    page={currentPage + 1}
                    totalPages={pageCount}
                    onPageChange={(nextPage) => setPage(nextPage - 1)}
                    previousLabel={t.previousPage}
                    nextLabel={t.nextPage}
                    pageLabel={(p) => `${t.pagination} ${p}`}
                  />
                </div>
              )}
            </main>
          </div>
      </DialogContent>
    </DialogRoot>
  );
}

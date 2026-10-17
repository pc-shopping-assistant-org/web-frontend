"use client";

import {ChevronDown, ChevronRight, ListFilter} from "lucide-react";
import {useTranslations} from "next-intl";
import {useMemo, useState, type FormEvent, type ReactNode} from "react";

import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Skeleton} from "@/components/ui/skeleton";
import type {CategoryTree} from "@/features/catalog/contracts/responses";
import {cn} from "@/lib/utils";

const OPTION_LIMIT = 8;
const MAX_INDENT_LEVELS = 2;
const INDENT_REM = 0.875;

export type FilterOption = {value: string; label: string; depth?: number};

/** The categories as one list in tree order, each with how deep it sits. */
export function categoryOptions(nodes: CategoryTree[], depth = 0): FilterOption[] {
  return nodes.flatMap((node) => [
    ...(node.id && node.name ? [{value: node.id, label: node.name, depth}] : []),
    ...categoryOptions(node.children ?? [], depth + 1),
  ]);
}

type CatalogFiltersProps = {
  categories: FilterOption[];
  brands: FilterOption[];
  loading: boolean;
  categoryId?: string;
  brandId?: string;
  minPrice?: number;
  maxPrice?: number;
  onCategory: (id?: string) => void;
  onBrand: (id?: string) => void;
  onPrice: (range: {minPrice?: number; maxPrice?: number}) => void;
  onClear?: () => void;
};

/** What narrows the product list: category and brand apply as soon as they are picked, the price range with its button. */
export function CatalogFilters({categories, brands, loading, categoryId, brandId, minPrice, maxPrice, onCategory, onBrand, onPrice, onClear}: CatalogFiltersProps) {
  const t = useTranslations("catalog");
  return (
    <div>
      <h2 className="flex items-center gap-2 pb-4 text-sm font-bold uppercase tracking-wide">
        <ListFilter className="size-4" aria-hidden="true" />
        {t("filterTitle")}
      </h2>
      <FilterSection title={t("category")}>
        {loading ? <OptionsSkeleton /> : <OptionList name="category" options={categories} value={categoryId} allLabel={t("allCategories")} onChange={onCategory} />}
      </FilterSection>
      <FilterSection title={t("brand")}>
        {loading ? <OptionsSkeleton /> : <OptionList name="brand" options={brands} value={brandId} allLabel={t("allBrands")} onChange={onBrand} />}
      </FilterSection>
      <FilterSection title={t("priceRange")}>
        <PriceRange key={`${minPrice ?? ""}-${maxPrice ?? ""}`} minPrice={minPrice} maxPrice={maxPrice} onApply={onPrice} />
      </FilterSection>
      {onClear ? (
        <Button type="button" variant="outline" size="sm" className="w-full" onClick={onClear}>
          {t("clearFilters")}
        </Button>
      ) : null}
    </div>
  );
}

function FilterSection({title, children}: {title: string; children: ReactNode}) {
  return (
    <section className="border-t border-border/70 py-4">
      <h3 className="mb-3 text-sm font-semibold">{title}</h3>
      {children}
    </section>
  );
}

function OptionsSkeleton() {
  return (
    <div className="space-y-2.5" aria-hidden="true">
      {[0, 1, 2, 3].map((row) => <Skeleton key={row} className="h-4 w-4/5" />)}
    </div>
  );
}

type TreeRow = FilterOption & {hasChildren: boolean; ancestors: string[]};

/** Each option with whether the one after it sits below it, and the ids above it, read from the list's tree order. */
function treeRows(options: FilterOption[]): TreeRow[] {
  const path: string[] = [];
  return options.map((option, index) => {
    const depth = option.depth ?? 0;
    path.length = depth;
    const ancestors = [...path];
    path[depth] = option.value;
    return {...option, hasChildren: (options[index + 1]?.depth ?? 0) > depth, ancestors};
  });
}

function OptionList({name, options, value, allLabel, onChange}: {name: string; options: FilterOption[]; value?: string; allLabel: string; onChange: (value?: string) => void}) {
  const t = useTranslations("catalog");
  const rows = useMemo(() => treeRows(options), [options]);
  // The parents above the chosen option start open, so the choice is never hidden at first
  const [opened, setOpened] = useState(() => new Set(rows.find((row) => row.value === value)?.ancestors));
  const [expanded, setExpanded] = useState(false);
  const shown = rows.filter((row) => row.ancestors.every((id) => opened.has(id)));
  // A choice that sits below the fold keeps the list open, so the selection is never hidden
  const pinnedOpen = shown.findIndex((row) => row.value === value) >= OPTION_LIMIT;
  const open = expanded || pinnedOpen;
  // Only a list with levels sets its top level apart; a flat list (the brands) keeps one weight
  const hasLevels = rows.some((row) => (row.depth ?? 0) > 0);
  const visible = open ? shown : shown.slice(0, OPTION_LIMIT);

  function toggle(id: string) {
    setOpened((current) => {
      const next = new Set(current);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  }

  function choose(row: TreeRow) {
    if (row.hasChildren) setOpened((current) => new Set(current).add(row.value));
    onChange(row.value);
  }

  return (
    <div>
      <ul className="space-y-0.5">
        <li><OptionRow name={name} label={allLabel} checked={!value} onSelect={() => onChange(undefined)} /></li>
        {visible.map((row) => {
          const isOpen = opened.has(row.value);
          return (
            <li key={row.value} className="flex items-center" style={{marginLeft: `${Math.min(row.depth ?? 0, MAX_INDENT_LEVELS) * INDENT_REM}rem`}}>
              <OptionRow name={name} label={row.label} depth={row.depth} strong={hasLevels && !row.depth} checked={row.value === value} onSelect={() => choose(row)} />
              {row.hasChildren ? (
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-label={t(isOpen ? "collapseChildren" : "expandChildren", {name: row.label})}
                  title={t(isOpen ? "collapseChildren" : "expandChildren", {name: row.label})}
                  onClick={() => toggle(row.value)}
                  className="ml-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground"
                >
                  <ChevronRight className={cn("size-4 transition", isOpen && "rotate-90")} aria-hidden="true" />
                </button>
              ) : null}
            </li>
          );
        })}
      </ul>
      {shown.length > OPTION_LIMIT && !pinnedOpen ? (
        <button type="button" aria-expanded={open} onClick={() => setExpanded((current) => !current)} className="mt-2 inline-flex items-center gap-1 px-2.5 text-sm text-muted-foreground transition hover:text-foreground">
          {open ? t("showLess") : t("showMore")}
          <ChevronDown className={cn("size-4 transition", open && "rotate-180")} aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}

function OptionRow({name, label, depth = 0, strong = false, checked, onSelect}: {name: string; label: string; depth?: number; strong?: boolean; checked: boolean; onSelect: () => void}) {
  return (
    <label className="block min-w-0 flex-1 cursor-pointer">
      <input type="radio" name={name} checked={checked} onChange={onSelect} className="peer sr-only" />
      <span
        className={cn(
          "block break-words rounded-lg px-2.5 py-1.5 text-sm leading-5 transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-primary/40",
          checked ? "bg-primary/10 font-medium text-primary" : cn("hover:bg-muted", strong ? "font-medium text-foreground" : depth > 0 ? "text-foreground/70" : "text-foreground/85"),
        )}
      >
        {label}
      </span>
    </label>
  );
}

function PriceRange({minPrice, maxPrice, onApply}: {minPrice?: number; maxPrice?: number; onApply: (range: {minPrice?: number; maxPrice?: number}) => void}) {
  const t = useTranslations("catalog");
  const [min, setMin] = useState(minPrice === undefined ? "" : String(minPrice));
  const [max, setMax] = useState(maxPrice === undefined ? "" : String(maxPrice));
  const [invalid, setInvalid] = useState(false);

  function submit(event: FormEvent) {
    event.preventDefault();
    const from = min === "" ? undefined : Number(min);
    const to = max === "" ? undefined : Number(max);
    if (from !== undefined && to !== undefined && from > to) {
      setInvalid(true);
      return;
    }
    setInvalid(false);
    onApply({minPrice: from, maxPrice: to});
  }

  return (
    <form onSubmit={submit} noValidate>
      <div className="flex items-center gap-2">
        <Input type="number" min="0" inputMode="numeric" value={min} onChange={(event) => setMin(event.target.value)} placeholder={t("priceFromPlaceholder")} aria-label={t("minPrice")} className="h-9 min-w-0 px-2.5 text-sm" />
        <span className="h-px w-3 shrink-0 bg-border" aria-hidden="true" />
        <Input type="number" min="0" inputMode="numeric" value={max} onChange={(event) => setMax(event.target.value)} placeholder={t("priceToPlaceholder")} aria-label={t("maxPrice")} className="h-9 min-w-0 px-2.5 text-sm" />
      </div>
      {invalid ? <p role="alert" className="mt-2 text-xs text-destructive">{t("invalidPriceRange")}</p> : null}
      <Button type="submit" size="sm" className="mt-3 w-full">{t("applyPrice")}</Button>
    </form>
  );
}

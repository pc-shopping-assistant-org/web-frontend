"use client";

import {IconCheck, IconChevronDown, IconChevronRight, IconFolderOpen, IconPlus, IconRefresh, IconSparkles} from "@tabler/icons-react";
import {useQuery} from "@tanstack/react-query";
import {useLocale} from "next-intl";
import {useState} from "react";

import {Alert, AlertDescription} from "@/components/ui/alert";
import {Button} from "@/components/ui/button";
import {Skeleton} from "@/components/ui/skeleton";
import {Tabs, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {formatMoney} from "@/lib/format";
import {cn} from "@/lib/utils";
import {getAccessories, getQuote} from "./api";
import {BuildGoal, buildGoals, coreSlots, MAX_QUANTITY, optionalSlots, selectionSchema, slots, type Selection, type Slot} from "./contracts";
import {copy} from "./copy";
import {PartArt} from "./part-art";
import {PartPickerDialog} from "./part-picker-dialog";
import {PresetBuildsDialog} from "./preset-builds-dialog";
import {SetupSummary} from "./setup-summary";
import {SlotRow} from "./slot-row";
import {getPrebuiltBuilds} from "./compatibility-api";

const storageKey = "gearpc:build:v1";

function omitSlot<T>(record: Partial<Record<Slot, T>>, slot: Slot): Partial<Record<Slot, T>> {
  const next = {...record};
  delete next[slot];
  return next;
}

export function BuilderPage({initialSelection = {}, invalidLink = false}: {initialSelection?: Selection; invalidLink?: boolean}) {
  const locale = useLocale();
  const t = copy[locale === "en" ? "en" : "vi"];
  const money = (value: number) => formatMoney(value, locale);

  const [selection, setSelection] = useState<Selection>(initialSelection);
  const [quantities, setQuantities] = useState<Partial<Record<Slot, number>>>({});
  const [pickerSlot, setPickerSlot] = useState<Slot | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [allPresetsOpen, setAllPresetsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "core" | "peripherals">("core");
  const [lastCoreSlot, setLastCoreSlot] = useState<Slot>("CPU");
  const [lastPeripheralSlot, setLastPeripheralSlot] = useState<Slot>("MONITOR");
  const [budget, setBudget] = useState(0);
  const [goal, setGoal] = useState<BuildGoal>(BuildGoal.GAMING);
  const [notice, setNotice] = useState(invalidLink ? t.invalid : "");
  const [shareLink, setShareLink] = useState("");

  const accessories = useQuery({
    queryKey: ["pc-builder", "accessories"],
    queryFn: ({signal}) => getAccessories(signal),
    staleTime: 60_000,
  });

  const quote = useQuery({
    queryKey: ["pc-builder", "quote", selection],
    queryFn: ({signal}) => getQuote(selection, signal),
  });

  const prebuiltQuery = useQuery({
    queryKey: ["pc-builder", "prebuilt-builds"],
    queryFn: ({signal}) => getPrebuiltBuilds(signal),
    staleTime: 5 * 60_000,
  });

  const realTemplates = (prebuiltQuery.data || []).map((b) => ({
    id: b.id,
    name: b.name,
    goal: b.goal,
    price: b.total_price,
    selection: b.selection as Selection,
  }));

  function openPicker(slot: Slot) {
    setPickerSlot(slot);
    setPickerOpen(true);
    if (coreSlots.includes(slot)) {
      setLastCoreSlot(slot);
    } else {
      setLastPeripheralSlot(slot);
    }
  }

  function handleSelect(slot: Slot, partId: string) {
    setSelection((curr) => ({...curr, [slot]: partId}));
    setQuantities((curr) => omitSlot(curr, slot));
    setNotice("");
    setShareLink("");
  }

  function remove(slot: Slot) {
    setSelection((curr) => omitSlot(curr, slot));
    setQuantities((curr) => omitSlot(curr, slot));
    setShareLink("");
  }

  function resetBuild() {
    setSelection({});
    setQuantities({});
  }

  function load() {
    try {
      const saved = localStorage.getItem(storageKey);
      if (!saved) {
        setNotice(t.noSaved);
        return;
      }
      setSelection(selectionSchema.parse(JSON.parse(saved)));
      setShareLink("");
      setNotice("");
    } catch {
      setNotice(t.invalid);
    }
  }

  function save() {
    try {
      localStorage.setItem(storageKey, JSON.stringify(selection));
      setNotice(t.saved);
    } catch {
      setNotice(t.storageError);
    }
  }

  async function share() {
    const url = new URL(window.location.href);
    url.searchParams.set("build", JSON.stringify(selection));
    setShareLink(url.toString());
    try {
      await navigator.clipboard.writeText(url.toString());
      setNotice(t.copied);
    } catch {
      setNotice(t.linkReady);
    }
  }

  const ready = !!quote.data && !quote.isFetching && !quote.isError;
  const coreCount = coreSlots.filter((value) => selection[value]).length;
  const extraCount = optionalSlots.filter((value) => selection[value]).length;
  const quantityOf = (slot: Slot) => quantities[slot] ?? 1;
  const total = (quote.data?.parts ?? []).reduce((sum, part) => sum + part.price * quantityOf(part.slot), 0);

  const displayedSlots: Slot[] = activeTab === "all" ? slots : activeTab === "core" ? coreSlots : optionalSlots;

  return (
    <section aria-label={t.title} className="min-h-screen bg-muted/30 px-4 pb-24 pt-4 sm:px-6 lg:px-8 lg:pb-8">
      <div className="mx-auto w-full max-w-[90rem]">
        {/* Breadcrumb & Header */}
        <header className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <nav className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <span>{t.home}</span>
              <span>›</span>
              <span className="font-semibold text-foreground">Build PC</span>
            </nav>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t.title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t.subtitle}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="h-10 text-xs font-semibold" onClick={load}>
              <IconFolderOpen className="mr-1.5 size-4" />
              {t.load}
            </Button>
            <Button
              variant="outline"
              className="h-10 text-xs font-semibold text-muted-foreground hover:text-foreground"
              onClick={() => {
                resetBuild();
                setShareLink("");
              }}
            >
              <IconRefresh className="mr-1.5 size-4" />
              {t.resetBuild}
            </Button>
          </div>
        </header>

        {/* Presets Toolbar (Phong Vũ Style) */}
        <section className="mb-5 rounded-2xl border bg-card p-4 shadow-2xs" aria-label={t.start}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t.start}:</span>
              {buildGoals.map((value) => (
                <Button
                  key={value}
                  size="sm"
                  variant={goal === value ? "default" : "outline"}
                  className="h-8 text-xs font-semibold"
                  onClick={() => setGoal(value)}
                >
                  {t[value] || value}
                </Button>
              ))}
            </div>

            <label className="flex w-full items-center justify-between gap-3 text-sm sm:w-auto sm:justify-start">
              <span className="shrink-0 text-xs font-medium text-muted-foreground">{t.budget}:</span>
              <div className="relative">
                <select
                  id="builder-budget-select"
                  name="budget"
                  value={budget}
                  onChange={(e) => setBudget(Number(e.target.value))}
                  className="h-9 cursor-pointer appearance-none rounded-lg border bg-background pl-3 pr-8 text-xs font-medium transition hover:border-primary/50"
                >
                  <option value={0}>{t.noBudget}</option>
                  {[15000000, 20000000, 30000000, 50000000, 80000000].map((value) => (
                    <option key={value} value={value}>
                      ≤ {money(value)}
                    </option>
                  ))}
                </select>
                <IconChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              </div>
            </label>
          </div>

          {/* Preset configuration Mini-Cards & See All button */}
          {(() => {
            const matchingTemplates = realTemplates.filter(
              (template) => template.goal === goal && (budget === 0 || template.price <= budget),
            );
            // Select up to 4 representative templates spread across price range
            const featuredCount = 4;
            const featuredTemplates =
              matchingTemplates.length <= featuredCount
                ? matchingTemplates
                : [
                    matchingTemplates[0],
                    matchingTemplates[Math.floor(matchingTemplates.length * 0.33)],
                    matchingTemplates[Math.floor(matchingTemplates.length * 0.66)],
                    matchingTemplates[matchingTemplates.length - 1],
                  ];

            return (
              <div className="mt-3.5 border-t pt-3.5">
                <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
                  {featuredTemplates.map((template) => (
                    <button
                      key={template.id}
                      type="button"
                      onClick={() => {
                        setSelection(template.selection);
                        setQuantities({});
                        setShareLink("");
                        setNotice("");
                      }}
                      className="group flex flex-col justify-between rounded-xl border border-border/80 bg-background p-3 text-left transition-all duration-150 hover:border-primary/50 hover:bg-primary/5 hover:shadow-2xs"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            {t[template.goal] || template.goal}
                          </span>
                        </div>
                        <h4 className="mt-1 line-clamp-2 text-xs font-bold text-foreground group-hover:text-primary transition-colors" title={template.name}>
                          {template.name}
                        </h4>
                      </div>
                      <div className="mt-2.5 flex items-center justify-between border-t border-border/50 pt-2">
                        <span className="text-xs font-black text-primary">{money(template.price)}</span>
                        <span className="inline-flex items-center text-[11px] font-semibold text-primary">
                          {t.choosePart} <IconChevronRight className="ml-0.5 size-3.5 transition-transform group-hover:translate-x-0.5" />
                        </span>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-dashed pt-2.5 text-xs">
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setAllPresetsOpen(true)}
                      className="h-8 font-bold text-primary hover:bg-primary/10 hover:text-primary"
                    >
                      <IconSparkles className="mr-1.5 size-3.5" />
                      {t.viewAllPresets} ({matchingTemplates.length})
                    </Button>
                    <button
                      type="button"
                      onClick={() => {
                        resetBuild();
                        setShareLink("");
                      }}
                      className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-dashed px-3 text-xs font-medium text-muted-foreground transition hover:border-primary hover:text-primary"
                    >
                      <IconPlus className="size-3.5" />
                      {t.custom}
                    </button>
                  </div>
                  <span className="text-[11px] text-muted-foreground">
                    {t.verifiedNoConflict}
                  </span>
                </div>
              </div>
            );
          })()}
        </section>

        {/* Main 2-Column Grid: Left Slot Rows List (Phong Vũ style) - Right Sticky Summary */}
        <div className="grid min-w-0 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_420px] xl:grid-cols-[minmax(0,1fr)_450px] 2xl:grid-cols-[minmax(0,1fr)_480px]">
          {/* Left Column: Numbered Slots List */}
          <div className="min-w-0 max-w-full space-y-4">
            <Tabs
              value={activeTab}
              onValueChange={(val) => {
                if (val === "all" || val === "core" || val === "peripherals") {
                  setActiveTab(val);
                }
              }}
              className="gap-0 rounded-2xl border bg-card shadow-2xs"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-3.5">
                <div>
                  <h2 className="text-lg font-bold">{t.componentsTitle}</h2>
                  <p className="text-xs text-muted-foreground">{t.componentsHint}</p>
                </div>

                {/* Tabs for Core / Peripherals / All */}
                <TabsList aria-label={t.componentsTitle}>
                  <TabsTrigger value="core" aria-label={t.tabs.core} className="px-3 text-xs font-semibold">
                    {t.tabs.core} (8)
                  </TabsTrigger>
                  <TabsTrigger value="peripherals" aria-label={t.tabs.peripherals} className="px-3 text-xs font-semibold">
                    {t.tabs.peripherals} (4)
                  </TabsTrigger>
                  <TabsTrigger value="all" aria-label={t.allSlots} className="px-3 text-xs font-semibold">
                    {t.allSlots} (12)
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Slot Navigation Pills Bar */}
              <nav aria-label={t.choose} className="flex max-w-full items-center gap-1.5 overflow-x-auto border-b bg-muted/15 px-4 py-2">
                <span className="shrink-0 text-[11px] font-bold uppercase tracking-wider text-muted-foreground mr-1">{t.choose}:</span>
                {(activeTab === "peripherals" ? optionalSlots : activeTab === "all" ? slots : coreSlots).map((slotKey) => (
                  <button
                    key={slotKey}
                    type="button"
                    aria-pressed={
                      activeTab === "core" ? lastCoreSlot === slotKey : activeTab === "peripherals" ? lastPeripheralSlot === slotKey : false
                    }
                    onClick={() => openPicker(slotKey)}
                    className={cn(
                      "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition",
                      selection[slotKey]
                        ? "border-primary/40 bg-primary/10 text-primary font-bold"
                        : "bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground",
                    )}
                  >
                    {selection[slotKey] && <IconCheck className="size-3.5 shrink-0" />}
                    {t.slots[slotKey]}
                  </button>
                ))}
              </nav>
            </Tabs>

            {/* Vertical Numbered Slot Rows (Phong Vũ Core Pattern) */}
            <section aria-label={t.componentListLabel} className="space-y-2">
              {displayedSlots.map((slotKey) => {
                const slotIdx = slots.indexOf(slotKey) + 1;
                const selectedPart = quote.data?.parts.find((p) => p.slot === slotKey);
                const check = quote.data?.checks.find((c) => c.slots.includes(slotKey));
                return (
                  <SlotRow
                    key={slotKey}
                    slot={slotKey}
                    index={slotIdx}
                    part={selectedPart}
                    compatibilityCheck={check}
                    onPick={() => openPicker(slotKey)}
                    onRemove={() => remove(slotKey)}
                    quantity={quantityOf(slotKey)}
                    onQuantityChange={(next) => setQuantities((curr) => ({...curr, [slotKey]: Math.min(MAX_QUANTITY, Math.max(1, next))}))}
                    t={t}
                    money={money}
                  />
                );
              })}
            </section>

            {/* Suggested Accessories Section (Bottom of Left Column) */}
            <section className="mt-6 rounded-2xl border bg-card p-5 shadow-2xs" aria-label={t.accessoryTitle}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-foreground">{t.accessoryTitle}</h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">{t.accessoryHint}</p>
                </div>
              </div>

              {accessories.isPending ? (
                <Skeleton className="mt-4 h-28 rounded-xl" />
              ) : accessories.isError ? (
                <Alert variant="destructive" className="mt-4 rounded-xl border-destructive/20 bg-destructive/5">
                  <AlertDescription className="flex items-center justify-between gap-2 text-xs text-destructive">
                    <span>{t.error}</span>
                    <Button variant="ghost" size="sm" onClick={() => void accessories.refetch()}>
                      {t.retry}
                    </Button>
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {optionalSlots.map((value) => {
                    const part = accessories.data?.find((p) => p.slot === value);
                    if (!part) return null;
                    const isSelected = selection[value] === part.id;
                    return (
                      <article
                        key={value}
                        className="flex min-w-0 flex-col justify-between rounded-xl border bg-muted/20 p-3.5 transition hover:border-primary/40"
                      >
                        <div>
                          <div className="flex items-start gap-3">
                            <PartArt slot={value} compact />
                            <div className="min-w-0 flex-1">
                              <span className="text-[11px] font-medium text-muted-foreground">
                                {t.slots[value]} · {t.optional}
                              </span>
                              <h4 className="mt-0.5 line-clamp-2 text-xs font-bold" title={part.name}>
                                {part.name}
                              </h4>
                              <p className="mt-1 text-xs font-extrabold text-primary">{money(part.price)}</p>
                            </div>
                          </div>
                        </div>
                        <div className="mt-3 flex items-center justify-between gap-2 border-t pt-2.5">
                          <Button
                            variant={isSelected ? "secondary" : "default"}
                            size="sm"
                            className="h-8 min-w-0 flex-1 text-xs font-semibold"
                            onClick={() => {
                              setSelection((curr) => ({...curr, [value]: part.id}));
                              setShareLink("");
                            }}
                          >
                            <IconPlus className="mr-1 size-3.5" />
                            {isSelected ? t.selected : t.addAccessory}
                          </Button>
                          <button
                            type="button"
                            className="flex h-8 shrink-0 items-center whitespace-nowrap px-1 text-xs font-semibold text-primary hover:underline"
                            onClick={() => openPicker(value)}
                          >
                            {t.browseOptions}
                            <IconChevronRight className="ml-0.5 size-3.5" />
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </div>

          {/* Right Column: Sticky Summary & AI Consultation (Phong Vũ Style) */}
          <SetupSummary
            t={t}
            selection={selection}
            quantities={quantities}
            quote={quote.data}
            ready={ready}
            error={quote.isError}
            budget={budget}
            notice={notice}
            shareLink={shareLink}
            money={money}
            onEdit={(slotToEdit) => {
              if (coreSlots.includes(slotToEdit)) {
                setActiveTab("core");
              } else {
                setActiveTab("peripherals");
              }
              openPicker(slotToEdit);
            }}
            onRemove={remove}
            onClear={() => {
              resetBuild();
              setShareLink("");
            }}
            onSave={save}
            onShare={() => void share()}
            onRetry={() => void quote.refetch()}
          />
        </div>
      </div>

      {/* Modal Dialog for Choosing Components (Phong Vũ Pattern) */}
      <PartPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        slot={pickerSlot}
        selection={selection}
        onSelect={handleSelect}
        t={t}
        money={money}
      />

      {/* Modal Dialog for Exploring All 100 Prebuilt Conflict-Free Builds */}
      <PresetBuildsDialog
        open={allPresetsOpen}
        onOpenChange={setAllPresetsOpen}
        presets={realTemplates}
        currentGoal={goal}
        onSelect={(item) => {
          setSelection(item.selection);
          setQuantities({});
          setShareLink("");
          setNotice("");
        }}
        t={t}
        money={money}
      />

      {/* Mobile Sticky Action Bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-between border-t bg-background/95 px-4 py-3 backdrop-blur lg:hidden">
        <div>
          <p className="text-xs text-muted-foreground">
            {coreCount}/{coreSlots.length}
            {extraCount > 0 ? ` + ${extraCount} ${t.extra}` : ""} · {t.total}
          </p>
          <p className="text-lg font-bold text-primary">{ready ? money(total) : t.updating}</p>
        </div>
        <a
          href="#build-summary"
          className="inline-flex items-center rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground shadow-xs"
        >
          {t.view}
          <IconChevronRight className="ml-1 size-4" />
        </a>
      </div>
    </section>
  );
}

"use client";

import {Tabs} from "@base-ui/react/tabs";
import {IconCheck, IconChevronRight, IconPlus, IconSearch, IconFolderOpen} from "@tabler/icons-react";
import {useQuery} from "@tanstack/react-query";
import {useLocale} from "next-intl";
import {useState} from "react";

import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Skeleton} from "@/components/ui/skeleton";
import {formatMoney} from "@/lib/format";
import {cn} from "@/lib/utils";
import {getAccessories, getCandidates, getComponents, getQuote} from "./api";
import {selectionSchema, coreSlots, optionalSlots, slotGroups, type Selection, type Slot} from "./contracts";
import {copy} from "./copy";
import {PartArt} from "./part-art";
import {SetupSummary} from "./setup-summary";
import {PartCard} from "./part-card";

const storageKey = "gearpc:demo-build:v1";
const templates: {name: string; goal: "gaming" | "creator"; selection: Selection}[] = [
  {name: "AMD · AM5 / DDR5", goal: "gaming", selection: {CPU: "cpu-amd", MAINBOARD: "board-amd", RAM: "ram-ddr5", GPU: "gpu-radeon", SSD: "ssd-1tb", PSU: "psu-650", CASE: "case-atx", COOLER: "cooler-air"}},
  {name: "Intel · RTX 4060", goal: "gaming", selection: {CPU: "cpu-intel", MAINBOARD: "board-intel", RAM: "ram-ddr5", GPU: "gpu-rtx", SSD: "ssd-1tb", PSU: "psu-650", CASE: "case-atx", COOLER: "cooler-air"}},
  {name: "Ryzen 7 · RTX 4070 Super", goal: "creator", selection: {CPU: "cpu-amd7", MAINBOARD: "board-amd-atx", RAM: "ram-ddr5-rgb", GPU: "gpu-unknown", SSD: "ssd-2tb", PSU: "psu-750", CASE: "case-atx", COOLER: "cooler-liquid"}},
];

export function BuilderPage({initialSelection = {}, invalidLink = false}: {initialSelection?: Selection; invalidLink?: boolean}) {
  const locale = useLocale();
  const t = copy[locale === "en" ? "en" : "vi"];
  const money = (value: number) => formatMoney(value, locale);
  const [slot, setSlot] = useState<Slot>("CPU");
  const [lastSlots, setLastSlots] = useState<{core: Slot; peripherals: Slot}>({core: "CPU", peripherals: "MONITOR"});
  const activeGroup = coreSlots.includes(slot) ? "core" : "peripherals";
  const activeSlots = activeGroup === "core" ? coreSlots : optionalSlots;
  const [selection, setSelection] = useState<Selection>(initialSelection);
  const [search, setSearch] = useState("");
  const [brand, setBrand] = useState("");
  const [sort, setSort] = useState("ascending");
  const [hideConflicts, setHideConflicts] = useState(false);
  const [budget, setBudget] = useState(0);
  const [goal, setGoal] = useState<"gaming" | "creator">("gaming");
  const [notice, setNotice] = useState(invalidLink ? t.invalid : "");
  const [shareLink, setShareLink] = useState("");

  const catalog = useQuery({queryKey: ["pc-builder", "components", slot], queryFn: ({signal}) => getComponents(slot, signal), staleTime: 60_000});
  const accessories = useQuery({queryKey: ["pc-builder", "accessories"], queryFn: ({signal}) => getAccessories(signal), staleTime: 60_000});
  const quote = useQuery({queryKey: ["pc-builder", "quote", selection], queryFn: ({signal}) => getQuote(selection, signal)});
  // Candidate checks use the same server validator; do not duplicate compatibility rules in UI.
  const candidates = useQuery({
    queryKey: ["pc-builder", "candidates", selection, slot],
    queryFn: ({signal}) => getCandidates(selection, slot, signal),
    enabled: activeGroup === "core",
    staleTime: 60_000,
  });
  const parts = (catalog.data ?? []).filter(part =>
    (!brand || part.brand === brand) && `${part.name} ${part.brand} ${part.sku}`.toLowerCase().includes(search.toLowerCase()) &&
    (!hideConflicts || candidates.data?.[part.id] !== "INCOMPATIBLE")
  ).sort((a, b) => sort === "ascending" ? a.price - b.price : b.price - a.price);

  function changeSlot(value: Slot) {
    setSlot(value);
    setLastSlots(current => ({...current, [coreSlots.includes(value) ? "core" : "peripherals"]: value}));
    setBrand(""); setSearch("");
  }
  function select(id: string, advance: boolean) {
    setSelection(current => ({...current, [slot]: id}));
    setNotice(""); setShareLink("");
    if (advance) {
      const group = slotGroups.find(group => group.slots.includes(slot))!;
      changeSlot(group.slots[(group.slots.indexOf(slot) + 1) % group.slots.length]);
    }
  }
  function remove(value: Slot) {
    setSelection(current => { const next = {...current}; delete next[value]; return next; });
    setShareLink("");
  }
  function load() {
    try {
      const saved = localStorage.getItem(storageKey);
      if (!saved) { setNotice(t.noSaved); return; }
      setSelection(selectionSchema.parse(JSON.parse(saved))); setShareLink(""); setNotice("");
    } catch { setNotice(t.invalid); }
  }
  function save() {
    try { localStorage.setItem(storageKey, JSON.stringify(selection)); setNotice(t.saved); }
    catch { setNotice(t.storageError); }
  }
  async function share() {
    const url = new URL(window.location.href);
    url.searchParams.set("build", JSON.stringify(selection));
    setShareLink(url.toString());
    try { await navigator.clipboard.writeText(url.toString()); setNotice(t.copied); }
    catch { setNotice(t.linkReady); }
  }
  const ready = !!quote.data && !quote.isFetching && !quote.isError;
  const coreCount = coreSlots.filter(value => selection[value]).length;
  const extraCount = optionalSlots.filter(value => selection[value]).length;
  const total = quote.data?.total ?? 0;

  return <section aria-label={t.title} className="min-h-screen bg-muted/30 px-4 pb-24 pt-4 sm:px-5 lg:px-6 lg:pb-8">
    <header className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div><p className="mb-2 text-xs font-bold tracking-[0.2em] text-primary">gearPC / PC BUILDER</p><h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t.title}</h1><p className="mt-1 text-sm text-muted-foreground">{t.subtitle}</p></div>
      <Button variant="outline" className="h-11" onClick={load}><IconFolderOpen />{t.load}</Button>
    </header>
    <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-amber-300/60 bg-amber-50 px-3 py-2 text-amber-950 dark:bg-amber-950 dark:text-amber-100"><span className="shrink-0 rounded-md bg-amber-200 px-2 py-1 text-xs font-bold text-amber-950">{t.demo}</span><p className="text-sm">{t.notice}</p></div>
    <section className="mb-4 rounded-xl border bg-background px-4 py-3" aria-label={t.start}>
      <div className="flex flex-wrap items-center justify-between gap-4"><div className="flex flex-wrap items-center gap-2"><h2 className="mr-2 font-semibold">{t.start}</h2>{(["gaming", "creator"] as const).map(value => <Button key={value} variant={goal === value ? "default" : "outline"} onClick={() => setGoal(value)}>{t[value]}</Button>)}</div>
        <label className="flex items-center gap-3 text-sm">{t.budget}<select value={budget} onChange={e => setBudget(Number(e.target.value))} className="h-10 rounded-lg border bg-background px-3"><option value={0}>{t.noBudget}</option>{[15000000, 25000000, 35000000, 50000000].map(value => <option key={value} value={value}>{money(value)}</option>)}</select></label>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">{templates.filter(template => template.goal === goal).map(template => <button key={template.name} onClick={() => {setSelection(template.selection); setShareLink(""); setNotice("");}} className="inline-flex h-9 items-center gap-2 rounded-lg border bg-muted/20 px-3 text-left text-sm transition hover:border-primary hover:bg-primary/5"><span className="font-medium">{template.name}</span><IconChevronRight className="size-5 shrink-0 text-primary" /></button>)}<button onClick={() => {setSelection({}); changeSlot("CPU"); setShareLink("");}} className="inline-flex h-9 items-center gap-2 rounded-lg border border-dashed px-3 text-left text-sm text-muted-foreground hover:border-primary hover:text-primary"><IconPlus className="size-6" />{t.custom}</button></div>
    </section>
    <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_380px] 2xl:grid-cols-[minmax(0,1fr)_410px]">
      <Tabs.Root value={activeGroup} onValueChange={(value: unknown) => {
        if (value === "core" || value === "peripherals") changeSlot(lastSlots[value]);
      }} className="min-w-0 overflow-hidden rounded-2xl border bg-background shadow-sm">
        <header className="border-b px-4 py-3">
          <h2 className="text-xl font-semibold">{t.componentsTitle}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t.componentsHint}</p>
        </header>
        <Tabs.List aria-label={t.componentsTitle} className="flex gap-6 border-b px-5 sm:px-6">
          {slotGroups.map(group => <Tabs.Tab key={group.id} value={group.id} aria-label={t.tabs[group.id]} className="relative flex items-center gap-2 border-b-2 border-transparent py-3 text-sm font-semibold text-muted-foreground outline-none data-[active]:border-primary data-[active]:text-primary focus-visible:ring-2 focus-visible:ring-ring">
            {t.tabs[group.id]}
            <span aria-hidden="true" className="rounded-full bg-muted px-2 py-0.5 text-xs">{group.slots.filter(value => selection[value]).length}</span>
          </Tabs.Tab>)}
        </Tabs.List>
        <Tabs.Panel value={activeGroup}>
          <nav aria-label={t.choose} className="flex flex-wrap gap-1.5 border-b bg-muted/15 px-4 py-3">
            {activeSlots.map(value => <button key={value} aria-pressed={slot === value} onClick={() => changeSlot(value)} className={cn("inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition", slot === value ? "border-primary bg-primary text-primary-foreground" : "bg-background hover:border-primary/40")}>
              {selection[value] ? <IconCheck className="size-4" /> : <IconPlus className="size-4 opacity-50" />}
              {t.slots[value]}
            </button>)}
          </nav>
      <section className="min-w-0 p-4" aria-labelledby="component-heading">
        <div className="flex items-center justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-widest text-primary">{slot}</p><h2 id="component-heading" className="mt-1 text-xl font-semibold">{t.slots[slot]}</h2></div><span className="text-sm text-muted-foreground">{parts.length} {t.results}</span></div>
        <div className="relative mt-3"><IconSearch className="absolute left-3 top-3 size-5 text-muted-foreground" /><Input aria-label={t.search} placeholder={t.search} value={search} onChange={e => setSearch(e.target.value)} className="h-11 pl-10 text-base" /></div>
        <div className="my-3 grid grid-cols-2 gap-3"><select aria-label={t.brand} value={brand} onChange={e => setBrand(e.target.value)} className="h-10 min-w-0 rounded-lg border bg-background px-3 text-sm"><option value="">{t.brand}</option>{[...new Set(catalog.data?.map(p => p.brand))].map(value => <option key={value}>{value}</option>)}</select><select aria-label={t.sort} value={sort} onChange={e => setSort(e.target.value)} className="h-10 min-w-0 rounded-lg border bg-background px-3 text-sm"><option value="ascending">{t.ascending}</option><option value="descending">{t.descending}</option></select></div>
        {activeGroup === "core" && <label className="mb-5 flex items-center gap-2 text-sm text-muted-foreground"><input type="checkbox" checked={hideConflicts} onChange={e => setHideConflicts(e.target.checked)} />{t.compatibleOnly}</label>}
        {(catalog.isError || candidates.isError) && <div role="alert" className="mb-4 rounded-xl bg-destructive/10 p-4"><p>{t.error}</p><Button variant="outline" onClick={() => {void catalog.refetch(); void candidates.refetch();}}>{t.retry}</Button></div>}
        {catalog.isPending ? <div aria-label={t.loading} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">{[1, 2, 3].map(value => <Skeleton key={value} className="h-40" />)}</div> : <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {parts.map(part => <PartCard key={part.id} part={part} selected={selection[slot] === part.id}
            status={activeGroup === "core" ? candidates.data?.[part.id] : undefined}
            t={t} money={money} onSelect={() => select(part.id, false)} />)}

        </div>}
        {!catalog.isPending && !catalog.isError && parts.length === 0 && <p className="py-16 text-center text-muted-foreground">{t.empty}</p>}
      </section>
        </Tabs.Panel>
      </Tabs.Root>
      <SetupSummary t={t} selection={selection} quote={quote.data} ready={ready} error={quote.isError} budget={budget} notice={notice} shareLink={shareLink} money={money} onEdit={changeSlot} onRemove={remove}
        onClear={() => {setSelection({}); setShareLink("");}}
        onSave={save} onShare={() => void share()} onRetry={() => void quote.refetch()} />

    </div>
    <section className="mt-6 rounded-2xl border bg-background p-5" aria-label={t.accessoryTitle}>
      <h2 className="text-xl font-semibold">{t.accessoryTitle}</h2><p className="mt-1 text-sm text-muted-foreground">{t.accessoryHint}</p>
      {accessories.isPending ? <Skeleton className="mt-4 h-32" /> : accessories.isError ? <div role="alert" className="mt-4 text-sm">{t.error}<Button variant="ghost" onClick={() => void accessories.refetch()}>{t.retry}</Button></div> : <div className="mt-4 grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">{optionalSlots.map(value => {
        const part = accessories.data?.find(part => part.slot === value);
        if (!part) return null;
        return <article key={value} className="rounded-xl border bg-muted/20 p-4"><div className="flex items-start gap-3"><PartArt slot={value} compact /><div className="min-w-0"><p className="text-xs text-muted-foreground">{t.slots[value]} · {t.optional}</p><h3 className="mt-1 font-semibold">{part.name}</h3><p className="mt-1 font-semibold text-primary">{money(part.price)}</p></div></div><div className="mt-3 flex flex-wrap gap-2"><Button variant="outline" className="h-9" onClick={() => {setSelection(current => ({...current, [value]: part.id})); setShareLink("");}}><IconPlus />{selection[value] === part.id ? t.selected : t.addAccessory}</Button><a href="#component-heading" className="inline-flex items-center px-2 text-sm font-medium text-primary" onClick={() => changeSlot(value)}>{t.browseOptions}<IconChevronRight className="size-4" /></a></div></article>;
      })}</div>}
    </section>
    <div className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-between border-t bg-background/95 px-4 py-3 backdrop-blur xl:hidden"><div><p className="text-xs text-muted-foreground">{coreCount}/{coreSlots.length}{extraCount > 0 ? ` + ${extraCount} ${t.extra}` : ""} · {t.total}</p><p className="text-lg font-bold text-primary">{ready ? money(total) : t.updating}</p></div><a href="#build-summary" className="rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground">{t.view}<IconChevronRight className="ml-1 inline size-4" /></a></div>
  </section>;
}

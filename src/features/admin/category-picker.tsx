"use client";

import {ChevronRight, Pencil, Search} from "lucide-react";
import {useTranslations} from "next-intl";
import {useEffect, useMemo, useRef, useState} from "react";

import {Button} from "@/components/ui/button";
import {Dialog} from "@/components/ui/dialog";
import {Input} from "@/components/ui/input";
import type {CategoryTree} from "@/features/catalog/contracts/responses";
import {cn} from "@/lib/utils";

type Node = {id: string; name: string; children: Node[]};

function toNodes(categories: CategoryTree[]): Node[] {
  return categories.flatMap((category) => (category.id ? [{id: category.id, name: category.name ?? "", children: toNodes(category.children ?? [])}] : []));
}

/** The ids from the top category down to `id`, or empty when it is not in the tree. */
function pathTo(nodes: Node[], id: string): string[] {
  for (const node of nodes) {
    if (node.id === id) return [node.id];
    const below = pathTo(node.children, id);
    if (below.length) return [node.id, ...below];
  }
  return [];
}

function namesOf(nodes: Node[], path: string[]): string[] {
  const names: string[] = [];
  let level = nodes;
  for (const id of path) {
    const node = level.find((candidate) => candidate.id === id);
    if (!node) break;
    names.push(node.name);
    level = node.children;
  }
  return names;
}

/** Every category with the way to it, for the search box. */
function flatPaths(nodes: Node[], trail: string[] = [], names: string[] = []): {path: string[]; names: string[]}[] {
  return nodes.flatMap((node) => {
    const path = [...trail, node.id];
    const label = [...names, node.name];
    return [{path, names: label}, ...flatPaths(node.children, path, label)];
  });
}

/**
 * The category of a product, picked the way a seller picks it on a marketplace: a field showing the chosen path,
 * opening a window of columns, one per level, where a click on a category with children shows them in the next column.
 */
export function CategoryPicker({
  id,
  value,
  onChange,
  categories,
  loading = false,
}: {
  id: string;
  value: string;
  onChange: (categoryId: string) => void;
  categories: CategoryTree[];
  loading?: boolean;
}) {
  const t = useTranslations("admin.categoryPicker");
  const [open, setOpen] = useState(false);
  const nodes = useMemo(() => toNodes(categories), [categories]);
  const current = useMemo(() => namesOf(nodes, pathTo(nodes, value)), [nodes, value]);

  return (
    <>
      <button
        id={id}
        type="button"
        aria-haspopup="dialog"
        disabled={loading}
        onClick={() => setOpen(true)}
        className="flex h-10 w-full items-center justify-between gap-3 rounded-xl border border-input bg-card px-3 text-left text-sm transition hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
      >
        <span className={cn("min-w-0 truncate", current.length ? "" : "text-muted-foreground")}>
          {current.length ? current.join(" > ") : t("placeholder")}
        </span>
        <Pencil className="size-4 shrink-0 text-muted-foreground" />
      </button>
      {open ? (
        <PickerDialog
          nodes={nodes}
          initial={pathTo(nodes, value)}
          onClose={() => setOpen(false)}
          onConfirm={(categoryId) => {
            onChange(categoryId);
            setOpen(false);
          }}
        />
      ) : null}
    </>
  );
}

function PickerDialog({
  nodes,
  initial,
  onClose,
  onConfirm,
}: {
  nodes: Node[];
  initial: string[];
  onClose: () => void;
  onConfirm: (categoryId: string) => void;
}) {
  const t = useTranslations("admin.categoryPicker");
  const tc = useTranslations("admin");
  const [path, setPath] = useState<string[]>(initial);
  const [keyword, setKeyword] = useState("");
  const scroller = useRef<HTMLDivElement>(null);

  // One column per level: the top categories, then the children of what is chosen at each level, while there are any.
  const columns: Node[][] = [nodes];
  let level = nodes;
  for (const id of path) {
    const node = level.find((candidate) => candidate.id === id);
    if (!node || node.children.length === 0) break;
    columns.push(node.children);
    level = node.children;
  }
  const selected = path.length ? path[path.length - 1] : "";
  const words = keyword.trim().toLowerCase();
  const found = words ? flatPaths(nodes).filter((entry) => entry.names.join(" ").toLowerCase().includes(words)) : [];

  // On a narrow screen the column that was just opened is off to the right, so it is brought into view
  const depthShown = columns.length;
  useEffect(() => {
    const node = scroller.current;
    const opened = node?.querySelectorAll("ul")[depthShown - 1];
    if (node && opened) node.scrollLeft = opened.offsetLeft - node.offsetLeft;
  }, [depthShown]);

  function pick(depth: number, id: string) {
    setPath((current) => [...current.slice(0, depth), id]);
  }

  return (
    <Dialog
      open
      onClose={onClose}
      title={t("title")}
      closeLabel={tc("close")}
      className="max-w-4xl"
      footer={
        <div className="flex w-full flex-wrap items-center justify-between gap-3">
          <p className="min-w-0 flex-1 text-sm text-muted-foreground">
            {t("selected")}{" "}
            <span className="font-semibold text-foreground">{selected ? namesOf(nodes, path).join(" > ") : t("none")}</span>
          </p>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose}>{tc("cancel")}</Button>
            <Button type="button" disabled={!selected} onClick={() => onConfirm(selected)}>{t("confirm")}</Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="relative max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            data-autofocus
            className="pl-9"
            aria-label={t("search")}
            placeholder={t("search")}
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />
        </div>

        {words ? (
          <ul className="max-h-80 divide-y overflow-y-auto rounded-xl border">
            {found.length ? found.map((entry) => {
              const id = entry.path[entry.path.length - 1];
              return (
                <li key={id}>
                  <button
                    type="button"
                    onClick={() => {
                      setPath(entry.path);
                      setKeyword("");
                    }}
                    className={cn("w-full px-4 py-2.5 text-left text-sm transition hover:bg-muted/50", id === selected && "font-medium text-primary")}
                  >
                    {entry.names.join(" > ")}
                  </button>
                </li>
              );
            }) : <li className="p-8 text-center text-sm text-muted-foreground">{t("noMatch")}</li>}
          </ul>
        ) : (
          <div ref={scroller} className="overflow-x-auto rounded-xl border bg-card">
            <div className="flex min-w-max divide-x" style={{minHeight: "20rem"}}>
              {Array.from({length: Math.max(columns.length, 3)}, (_, depth) => {
                const items = columns[depth] ?? [];
                return (
                  <ul key={depth} role="listbox" aria-label={t("level", {level: depth + 1})} className="max-h-80 w-56 shrink-0 overflow-y-auto p-1.5 sm:w-1/3 sm:min-w-56">
                    {items.map((node) => {
                      const active = path[depth] === node.id;
                      return (
                        <li key={node.id}>
                          <button
                            type="button"
                            role="option"
                            aria-selected={active}
                            onClick={() => pick(depth, node.id)}
                            className={cn(
                              "flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition",
                              active ? "bg-primary/10 font-semibold text-primary" : "hover:bg-muted/60",
                            )}
                          >
                            <span className="min-w-0 truncate">{node.name}</span>
                            {node.children.length ? <ChevronRight className={cn("size-4 shrink-0", active ? "" : "text-muted-foreground")} /> : null}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </Dialog>
  );
}

"use client";

import {ChevronRight, Pencil, Search} from "lucide-react";
import {useTranslations} from "next-intl";
import {useEffect, useMemo, useRef, useState, type KeyboardEvent} from "react";

import {Button} from "@/components/ui/button";
import {Dialog} from "@/components/ui/dialog";
import {ErrorMessage} from "@/components/ui/error-message";
import {Input} from "@/components/ui/input";
import type {CategoryTree} from "@/features/catalog/contracts/responses";
import {cn} from "@/lib/utils";

type Node = {id: string; name: string; children: Node[]};

function toNodes(categories: CategoryTree[]): Node[] {
  return categories.flatMap((category) =>
    category.id ? [{id: category.id, name: category.name ?? "", children: toNodes(category.children ?? [])}] : [],
  );
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

/** Lower case without accents, so "do hoa" finds "Đồ họa". */
function fold(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").toLowerCase();
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
  error,
  currentLabel,
  required = false,
}: {
  id: string;
  value: string;
  onChange: (categoryId: string) => void;
  categories: CategoryTree[];
  loading?: boolean;
  /** Why the categories could not be loaded, shown in the window instead of empty columns. */
  error?: unknown;
  /** The name of the current category, for the one that is not in the tree (hidden or removed since it was set). */
  currentLabel?: string;
  /** Says it in words under the field while nothing is chosen. */
  required?: boolean;
}) {
  const t = useTranslations("admin.categoryPicker");
  const [open, setOpen] = useState(false);
  const nodes = useMemo(() => toNodes(categories), [categories]);
  const inTree = useMemo(() => namesOf(nodes, pathTo(nodes, value)), [nodes, value]);
  const current = inTree.length ? inTree : value && currentLabel ? [currentLabel] : [];

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
      {required && !value ? <p className="text-xs text-muted-foreground">{t("required")}</p> : null}
      {open ? (
        <PickerDialog
          nodes={nodes}
          error={error}
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
  error,
  initial,
  onClose,
  onConfirm,
}: {
  nodes: Node[];
  error?: unknown;
  initial: string[];
  onClose: () => void;
  onConfirm: (categoryId: string) => void;
}) {
  const t = useTranslations("admin.categoryPicker");
  const tc = useTranslations("admin");
  const [path, setPath] = useState<string[]>(initial);
  const [keyword, setKeyword] = useState("");
  const scroller = useRef<HTMLDivElement>(null);
  const searchBox = useRef<HTMLDivElement>(null);

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
  const words = fold(keyword.trim());
  const found = words ? flatPaths(nodes).filter((entry) => fold(entry.names.join(" ")).includes(words)) : [];

  // On a narrow screen the column that was just opened is off to the right, so it is brought into view
  const depthShown = columns.length;
  useEffect(() => {
    const node = scroller.current;
    const opened = node?.querySelectorAll("ul")[depthShown - 1];
    if (node && opened) node.scrollLeft = opened.offsetLeft - node.offsetLeft;
    // A long column opens at the chosen category rather than at its top
    node?.querySelectorAll<HTMLElement>('ul [aria-current="true"]').forEach((chosen) => {
      const column = chosen.closest("ul");
      if (column) column.scrollTop = Math.max(0, chosen.offsetTop - column.offsetTop - column.clientHeight / 2 + chosen.offsetHeight / 2);
    });
  }, [depthShown]);

  function pick(depth: number, id: string) {
    setPath((current) => [...current.slice(0, depth), id]);
  }

  function chooseFound(entryPath: string[]) {
    setPath(entryPath);
    setKeyword("");
  }

  /** Arrows inside the columns: up and down within one, right into the children of a category, left back to its parent. */
  function onColumnKeys(event: KeyboardEvent<HTMLElement>) {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>("button[data-col]");
    const column = button?.closest("ul");
    if (!button || !column) return;
    const depth = Number(button.dataset.col);
    const buttons = [...column.querySelectorAll<HTMLButtonElement>("button")];
    const index = buttons.indexOf(button);
    const focus = (target?: HTMLElement | null) => {
      if (!target) return;
      event.preventDefault();
      target.focus();
    };
    if (event.key === "ArrowDown") focus(buttons[index + 1]);
    else if (event.key === "ArrowUp") focus(buttons[index - 1]);
    else if (event.key === "Home") focus(buttons[0]);
    else if (event.key === "End") focus(buttons[buttons.length - 1]);
    else if (event.key === "ArrowLeft")
      focus(scroller.current?.querySelector<HTMLElement>(`ul[data-col="${depth - 1}"] button[aria-current="true"]`));
    else if (event.key === "ArrowRight" && button.dataset.parent === "true") {
      event.preventDefault();
      button.click();
      // the next column is drawn after the click, so the focus goes there once it exists
      window.setTimeout(() => scroller.current?.querySelector<HTMLElement>(`ul[data-col="${depth + 1}"] button`)?.focus(), 0);
    }
  }

  /** In the search box Enter takes the first match and Down goes into the matches; Up and Down walk them. */
  function onSearchKeys(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" && found.length) {
      event.preventDefault();
      chooseFound(found[0].path);
    } else if (event.key === "ArrowDown") {
      const first = document.querySelector<HTMLElement>("[data-result] button");
      if (first) {
        event.preventDefault();
        first.focus();
      }
    }
  }

  function onResultKeys(event: KeyboardEvent<HTMLElement>) {
    const buttons = [...event.currentTarget.querySelectorAll<HTMLButtonElement>("button")];
    const index = buttons.indexOf(event.target as HTMLButtonElement);
    if (event.key === "ArrowDown" && buttons[index + 1]) {
      event.preventDefault();
      buttons[index + 1].focus();
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      (buttons[index - 1] ?? searchBox.current?.querySelector("input"))?.focus();
    }
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
            {t("selected")} <span className="font-semibold text-foreground">{selected ? namesOf(nodes, path).join(" > ") : t("none")}</span>
          </p>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              {tc("cancel")}
            </Button>
            <Button type="button" disabled={!selected} onClick={() => onConfirm(selected)}>
              {t("confirm")}
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        <div ref={searchBox} className="relative max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            data-autofocus
            className="pl-9"
            aria-label={t("search")}
            placeholder={t("search")}
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            onKeyDown={onSearchKeys}
          />
        </div>

        {error ? (
          <div className="rounded-xl border p-4">
            <ErrorMessage error={error} />
          </div>
        ) : nodes.length === 0 ? (
          <div className="rounded-xl border border-dashed p-12 text-center text-sm text-muted-foreground">{t("empty")}</div>
        ) : words ? (
          <ul className="max-h-80 divide-y overflow-y-auto rounded-xl border" onKeyDown={onResultKeys}>
            {found.length ? (
              found.map((entry) => {
                const id = entry.path[entry.path.length - 1];
                return (
                  <li key={id} data-result>
                    <button
                      type="button"
                      onClick={() => chooseFound(entry.path)}
                      className={cn(
                        "w-full px-4 py-2.5 text-left text-sm transition hover:bg-muted/50",
                        id === selected && "font-medium text-primary",
                      )}
                    >
                      {entry.names.join(" > ")}
                    </button>
                  </li>
                );
              })
            ) : (
              <li className="p-8 text-center text-sm text-muted-foreground">{t("noMatch")}</li>
            )}
          </ul>
        ) : (
          <div ref={scroller} className="overflow-x-auto rounded-xl border bg-card" onKeyDown={onColumnKeys}>
            <div className="flex min-w-max divide-x" style={{minHeight: "20rem"}}>
              {Array.from({length: Math.max(columns.length, 3)}, (_, depth) => {
                const items = columns[depth] ?? [];
                return (
                  <ul
                    key={depth}
                    data-col={depth}
                    aria-label={t("level", {level: depth + 1})}
                    className="max-h-80 w-56 shrink-0 overflow-y-auto p-1.5 sm:w-1/3 sm:min-w-56"
                  >
                    {items.map((node, index) => {
                      const active = path[depth] === node.id;
                      // one stop per column for Tab: the chosen category, or the first while none is chosen
                      const stop = active || (!path[depth] && index === 0);
                      return (
                        <li key={node.id}>
                          <button
                            type="button"
                            data-col={depth}
                            data-parent={node.children.length > 0}
                            tabIndex={stop ? 0 : -1}
                            aria-current={active ? "true" : undefined}
                            onClick={() => pick(depth, node.id)}
                            className={cn(
                              "flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition",
                              active ? "bg-primary/10 font-semibold text-primary" : "hover:bg-muted/60",
                            )}
                          >
                            <span className="min-w-0 truncate">{node.name}</span>
                            {node.children.length ? (
                              <ChevronRight className={cn("size-4 shrink-0", active ? "" : "text-muted-foreground")} />
                            ) : null}
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

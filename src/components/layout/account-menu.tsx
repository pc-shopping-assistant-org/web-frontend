"use client";

import {IconChevronDown, IconClipboardList, IconLogout, IconUser} from "@tabler/icons-react";
import {useTranslations} from "next-intl";
import {useEffect, useRef, useState} from "react";

import {PersonAvatar} from "@/components/ui/person-avatar";
import {Link} from "@/i18n/navigation";
import {cn} from "@/lib/utils";

type AccountMenuProps = {
  name: string;
  person: {avatarUrl?: string; firstName: string};
  /** A customer has orders of their own; an employee works on the orders of every customer from the admin area. */
  showOrders: boolean;
  signingOut: boolean;
  onSignOut: () => void;
};

const MENU_ITEM = "flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm transition hover:bg-muted hover:text-primary";

/** The signed-in customer in the header: the avatar and name open the account, orders and sign-out, on hover or on click. */
export function AccountMenu({name, person, showOrders, signingOut, onSignOut}: AccountMenuProps) {
  const t = useTranslations("nav");
  const [open, setOpen] = useState(false);
  const [nameCut, setNameCut] = useState(false);
  const nameRef = useRef<HTMLSpanElement>(null);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    const close = (event: Event) => {
      if (event instanceof KeyboardEvent ? event.key === "Escape" : !root.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  return (
    <div ref={root} className="relative ml-1" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onMouseEnter={() => {
          // The full name is worth a tooltip only when the button does not show all of it: cut with an ellipsis, or hidden on a narrow screen
          const label = nameRef.current;
          setNameCut(!label || label.clientWidth === 0 || label.scrollWidth > label.clientWidth);
        }}
        onClick={() => setOpen((value) => !value)}
        className="peer inline-flex max-w-44 shrink-0 items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium transition hover:bg-muted"
      >
        <PersonAvatar person={person} className="size-7 text-xs" />
        <span ref={nameRef} className="hidden min-w-0 truncate xl:inline">{name}</span>
        <IconChevronDown className={cn("hidden size-3.5 shrink-0 text-muted-foreground transition xl:block", open && "rotate-180")} aria-hidden="true" />
      </button>
      {/* Shown almost at once, unlike the browser title, which waits a second or two; to the left, since the menu opens below */}
      {nameCut ? (
        <span
          role="tooltip"
          className="pointer-events-none absolute right-full top-1/2 z-50 mr-2 w-max max-w-72 -translate-y-1/2 break-words rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity delay-100 peer-hover:opacity-100"
        >
          {name}
        </span>
      ) : null}
      {open ? (
        // The padding keeps the pointer inside the menu while it crosses the gap under the button
        <div className="absolute right-0 top-full z-50 pt-2">
          <div role="menu" className="w-52 overflow-hidden rounded-xl border bg-background py-1.5 shadow-2xl shadow-slate-950/10">
            <Link role="menuitem" href="/account" onClick={() => setOpen(false)} className={MENU_ITEM}>
              <IconUser className="size-4 text-muted-foreground" aria-hidden="true" />
              {t("myAccount")}
            </Link>
            {showOrders ? (
              <Link role="menuitem" href="/orders" onClick={() => setOpen(false)} className={MENU_ITEM}>
                <IconClipboardList className="size-4 text-muted-foreground" aria-hidden="true" />
                {t("myOrders")}
              </Link>
            ) : null}
            <button
              type="button"
              role="menuitem"
              disabled={signingOut}
              onClick={() => {
                setOpen(false);
                onSignOut();
              }}
              className={cn(MENU_ITEM, "border-t disabled:opacity-60")}
            >
              <IconLogout className="size-4 text-muted-foreground" aria-hidden="true" />
              {t("logout")}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

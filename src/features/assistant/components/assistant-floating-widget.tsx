"use client";

import {Bot, X} from "lucide-react";
import {useTranslations} from "next-intl";
import {useState} from "react";

import {Button} from "@/components/ui/button";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";
import {usePathname} from "@/i18n/navigation";
import {useProductBySlug} from "@/features/catalog/queries";
import {AssistantPage} from "../assistant-page";

const HIDDEN_PREFIXES = ["/assistant", "/admin", "/login", "/register", "/checkout"] as const;

function extractProductSlug(pathname: string): string {
  if (!pathname.startsWith("/products/")) return "";
  const segment = pathname.slice("/products/".length).split("/")[0];
  if (!segment) return "";
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

export function AssistantFloatingWidget() {
  const pathname = usePathname();
  const t = useTranslations("assistant");
  const common = useTranslations("common");
  const [open, setOpen] = useState(false);

  const hidden = HIDDEN_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
  const productSlug = !hidden && open ? extractProductSlug(pathname) : "";
  const productQuery = useProductBySlug(productSlug);
  const contextProduct = productQuery.data
    ? {id: productQuery.data.id, name: productQuery.data.name}
    : undefined;

  if (hidden) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            size="lg"
            aria-label={open ? common("close") : t("floatingOpen")}
            className="fixed bottom-5 right-5 z-40 h-12 gap-2 rounded-full px-4 shadow-lg ring-1 ring-primary/20 transition-transform hover:scale-[1.03] hover:shadow-xl active:scale-95"
          />
        }
      >
        {open ? (
          <X className="size-5" />
        ) : (
          <>
            <Bot className="size-5" />
            <span className="hidden sm:inline">{t("floatingOpen")}</span>
          </>
        )}
      </PopoverTrigger>

      <PopoverContent
        side="top"
        align="end"
        sideOffset={12}
        className="h-[min(640px,78dvh)] w-[calc(100vw-1.5rem)] max-w-[410px] gap-0 overflow-hidden rounded-2xl p-0 shadow-2xl"
      >
        <AssistantPage
          variant="widget"
          onCloseWidget={() => setOpen(false)}
          contextProduct={contextProduct}
        />
      </PopoverContent>
    </Popover>
  );
}

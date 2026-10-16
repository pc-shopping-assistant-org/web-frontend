"use client";

import {Plus} from "lucide-react";
import {useLocale, useTranslations} from "next-intl";
import {useState} from "react";

import {Button, buttonVariants} from "@/components/ui/button";
import {Card} from "@/components/ui/card";
import {ConfirmAction} from "@/components/ui/confirm-action";
import {ErrorMessage} from "@/components/ui/error-message";
import {Skeleton} from "@/components/ui/skeleton";
import {StatusBadge} from "@/components/ui/status-badge";
import {Link} from "@/i18n/navigation";
import {DiscountState, DiscountStatus, DiscountType} from "@/lib/domain/commerce-enums";
import {formatMoney} from "@/lib/format";
import {cn} from "@/lib/utils";

import {AdminPagination} from "./admin-pagination";
import {StatusTabs} from "./list-kit";
import type {DiscountSummary} from "./contracts/responses";
import {useAdminDiscounts, useAdminDiscountStatus} from "./queries";

const PAGE_SIZE = 20;
const TABS = ["", DiscountState.Running, DiscountState.Scheduled, DiscountState.Expired, DiscountState.Locked] as const;

/**
 * The promotions list, laid out like the product list: tabs by state, then a table of promotions with what each one
 * gives, where it applies and when, and the two things done to one from here (open it, stop or restart it).
 */
export function DiscountListPage() {
  const t = useTranslations("admin");
  const tl = useTranslations("admin.discountList");
  const locale = useLocale();
  const [state, setState] = useState<string>("");
  const [pageNumber, setPageNumber] = useState(0);
  const query = useAdminDiscounts({page: pageNumber, size: PAGE_SIZE, state: state || undefined});
  const mutation = useAdminDiscountStatus();
  const page = query.data;
  const items = page?.items ?? [];
  const dateFormat = new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-US", {day: "2-digit", month: "2-digit", year: "numeric"});
  const day = (value?: string) => (value ? dateFormat.format(new Date(value)) : "—");

  function pick(tab: string) {
    setState(tab);
    setPageNumber(0);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("resource.discounts")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("resource.discountsDescription")}</p>
        </div>
        <Link href="/admin/discounts/new" className={buttonVariants({size: "lg"})}>
          <Plus className="size-4" />
          {t("createDiscount")}
        </Link>
      </div>

      <StatusTabs
        label={t("discountState")}
        value={state}
        onChange={pick}
        tabs={TABS.map((tab) => ({value: tab, label: tab ? t(`statusValues.${tab}`) : tl("all")}))}
      />

      <Card className="p-4 sm:p-5">
        {query.isPending ? (
          <Skeleton className="h-64 rounded-xl" />
        ) : query.isError ? (
          <ErrorMessage error={query.error} />
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-dashed p-12 text-center text-sm text-muted-foreground">
            {state ? tl("emptyFiltered") : tl("empty")}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full min-w-[56rem] border-collapse text-sm">
              <thead className="bg-muted/50 text-left text-muted-foreground">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium">{tl("name")}</th>
                  <th scope="col" className="px-4 py-3 font-medium">{tl("scope")}</th>
                  <th scope="col" className="px-4 py-3 font-medium">{tl("value")}</th>
                  <th scope="col" className="px-4 py-3 font-medium">{tl("period")}</th>
                  <th scope="col" className="px-4 py-3 font-medium">{t("discountState")}</th>
                  <th scope="col" className="px-4 py-3 font-medium">{tl("actions")}</th>
                </tr>
              </thead>
              <tbody>
                {items.map((discount) => (
                  <DiscountRow
                    key={discount.id}
                    discount={discount}
                    day={day}
                    busy={mutation.isPending}
                    onStatus={(status) => mutation.mutateAsync({id: discount.id, status})}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
        {mutation.isError ? (
          <div className="mt-4">
            <ErrorMessage error={mutation.error} />
          </div>
        ) : null}
        {page && items.length > 0 ? (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">{tl("showing", {count: page.totalElements})}</p>
            {page.totalPages > 1 ? (
              <AdminPagination
                hasPrev={page.page > 0}
                hasNext={!page.last}
                onPrev={() => setPageNumber((current) => Math.max(0, current - 1))}
                onNext={() => setPageNumber((current) => current + 1)}
              />
            ) : null}
          </div>
        ) : null}
      </Card>
    </div>
  );
}

function DiscountRow({
  discount,
  day,
  busy,
  onStatus,
}: {
  discount: DiscountSummary;
  day: (value?: string) => string;
  busy: boolean;
  onStatus: (status: string) => Promise<unknown>;
}) {
  const t = useTranslations("admin");
  const tl = useTranslations("admin.discountList");
  const locale = useLocale();
  const active = discount.status === DiscountStatus.Active;
  const amount = discount.discountType === DiscountType.Percent ? `${discount.value}%` : formatMoney(discount.value, locale);

  return (
    <tr className="border-t align-top transition hover:bg-muted/20">
      <td className="max-w-xs px-4 py-3">
        <Link href={`/admin/discounts/${discount.id}`} className="line-clamp-2 font-medium hover:text-primary hover:underline">
          {discount.title || discount.code}
        </Link>
        <div className="mt-1">
          {discount.code ? (
            <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground">{discount.code}</span>
          ) : (
            <span className="text-xs text-muted-foreground">{tl("auto")}</span>
          )}
        </div>
      </td>
      <td className="px-4 py-3 text-muted-foreground">{discount.applicationScope ? t(`scopeValues.${discount.applicationScope}`) : "—"}</td>
      <td className="px-4 py-3">
        <p className="font-medium">{amount}</p>
        {discount.minOrderAmount > 0 ? (
          <p className="mt-0.5 text-xs text-muted-foreground">{tl("minOrder", {amount: formatMoney(discount.minOrderAmount, locale)})}</p>
        ) : null}
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
        <p>{day(discount.startAt)}</p>
        <p className="mt-0.5">– {day(discount.endAt)}</p>
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={discount.state} />
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <Link href={`/admin/discounts/${discount.id}`} className={cn(buttonVariants({variant: "link", size: "xs"}), "h-auto p-0 text-sm font-medium")}>
            {tl("edit")}
          </Link>
          {active ? (
            <ConfirmAction
              title={t("confirmStatusChange")}
              description={t("statusChangeDescription", {status: t(`statusValues.${DiscountStatus.Inactive}`)})}
              confirmLabel={tl("deactivate")}
              cancelLabel={t("cancel")}
              onConfirm={() => onStatus(DiscountStatus.Inactive)}
              variant="link"
              size="xs"
              className="h-auto p-0 text-sm font-medium text-destructive"
            >
              {tl("deactivate")}
            </ConfirmAction>
          ) : (
            <Button type="button" variant="link" size="xs" className="h-auto p-0 text-sm font-medium" disabled={busy} onClick={() => void onStatus(DiscountStatus.Active)}>
              {tl("activate")}
            </Button>
          )}
        </div>
      </td>
    </tr>
  );
}

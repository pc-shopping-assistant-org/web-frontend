"use client";

import {Star} from "lucide-react";
import {useLocale, useTranslations} from "next-intl";
import {useState} from "react";

import {Badge} from "@/components/ui/badge";
import {Card} from "@/components/ui/card";
import {ErrorMessage} from "@/components/ui/error-message";
import {Input} from "@/components/ui/input";
import {Select} from "@/components/ui/select";
import {Skeleton} from "@/components/ui/skeleton";
import {StatusBadge} from "@/components/ui/status-badge";
import type {Review} from "@/features/catalog/contracts/responses";
import {Link} from "@/i18n/navigation";
import {ReviewStatus} from "@/lib/domain/catalog-enums";

import {AdminCursorPagination} from "./admin-pagination";
import {EmptyBox, FilterField, FilterPanel, ListFooter, PageHeader, StatusTabs} from "./list-kit";
import {toNumber} from "./list-helpers";
import {useAdminReviewStatus, useAdminReviews} from "./queries";
import {StatusSelect} from "./status-select";

const PAGE_SIZE = 20;
const MAX_RATING = 5;
const EMPTY_FILTERS = {keyword: "", rating: ""};

/** The reviews of customers: tabs by status, a search by text and by rating, and each review with its stars and comment. */
export function ReviewListPage() {
  const t = useTranslations("admin");
  const tl = useTranslations("admin.reviewList");
  const locale = useLocale();
  const [status, setStatus] = useState("");
  const [draft, setDraft] = useState(EMPTY_FILTERS);
  const [applied, setApplied] = useState(EMPTY_FILTERS);
  const [cursor, setCursor] = useState<string | undefined>();
  const query = useAdminReviews({
    limit: PAGE_SIZE,
    cursor,
    keyword: applied.keyword || undefined,
    status: status || undefined,
    rating: toNumber(applied.rating),
  });
  const mutation = useAdminReviewStatus();
  const page = query.data;
  const items = page?.items ?? [];
  const filtered = Boolean(status || applied.keyword || applied.rating);
  const date = new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-US", {day: "2-digit", month: "2-digit", year: "numeric"});

  const search = () => {
    setApplied({...draft, keyword: draft.keyword.trim()});
    setCursor(undefined);
  };
  const reset = () => {
    setDraft(EMPTY_FILTERS);
    setApplied(EMPTY_FILTERS);
    setStatus("");
    setCursor(undefined);
  };

  return (
    <div className="space-y-5">
      <PageHeader title={t("resource.reviews")} description={t("resource.reviewsDescription")} />

      <StatusTabs
        label={t("status")}
        value={status}
        onChange={(value) => {
          setStatus(value);
          setCursor(undefined);
        }}
        tabs={[{value: "", label: tl("all")}, ...Object.values(ReviewStatus).map((value) => ({value, label: t(`statusValues.${value}`)}))]}
      />

      <FilterPanel onSubmit={search} onReset={reset} className="xl:grid-cols-[minmax(0,1fr)_14rem]">
        <FilterField label={t("search")}>
          <Input
            aria-label={t("searchReviews")}
            placeholder={t("searchReviews")}
            value={draft.keyword}
            onChange={(event) => setDraft((current) => ({...current, keyword: event.target.value}))}
          />
        </FilterField>
        <FilterField label={t("rating")}>
          <Select value={draft.rating} onChange={(event) => setDraft((current) => ({...current, rating: event.target.value}))}>
            <option value="">{t("allRatings")}</option>
            {Array.from({length: MAX_RATING}, (_, index) => MAX_RATING - index).map((rating) => (
              <option key={rating} value={rating}>
                {rating}/{MAX_RATING}
              </option>
            ))}
          </Select>
        </FilterField>
      </FilterPanel>

      <Card className="p-4 sm:p-5">
        {query.isPending ? (
          <Skeleton className="h-64 rounded-xl" />
        ) : query.isError ? (
          <ErrorMessage error={query.error} />
        ) : items.length === 0 ? (
          <EmptyBox>{filtered ? tl("emptyFiltered") : tl("empty")}</EmptyBox>
        ) : (
          <ul className="divide-y overflow-hidden rounded-xl border">
            {items.map((review) => (
              <ReviewRow
                key={review.id}
                review={review}
                date={(value) => date.format(new Date(value))}
                onStatus={(id, next) => mutation.mutateAsync({id, status: next})}
              />
            ))}
          </ul>
        )}
        {mutation.isError ? (
          <div className="mt-4">
            <ErrorMessage error={mutation.error} />
          </div>
        ) : null}
        {page && items.length > 0 && (page.hasPrev || page.hasNext) ? (
          <ListFooter
            summary={t("showingItems", {count: items.length})}
            pager={
              <AdminCursorPagination
                hasPrev={page.hasPrev}
                hasNext={page.hasNext}
                onPrev={() => setCursor(page.prevCursor)}
                onNext={() => setCursor(page.nextCursor)}
              />
            }
          />
        ) : null}
      </Card>
    </div>
  );
}

function ReviewRow({
  review,
  date,
  onStatus,
}: {
  review: Review;
  date: (value: string) => string;
  onStatus: (id: string, status: string) => Promise<unknown> | unknown;
}) {
  const t = useTranslations("admin");
  const rating = Math.max(0, Math.min(MAX_RATING, review.rating ?? 0));
  const product = review.productName ?? t("product");

  return (
    <li className="space-y-3 p-4 transition hover:bg-muted/20 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {review.productId ? (
              <Link href={`/admin/products/${review.productId}`} className="font-medium hover:text-primary hover:underline">
                {product}
              </Link>
            ) : (
              <p className="font-medium">{product}</p>
            )}
            {review.isVerifiedPurchase ? <Badge>{t("verifiedPurchase")}</Badge> : null}
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {review.customerName ?? "—"}
            {review.createdAt ? ` · ${date(review.createdAt)}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <StatusBadge status={review.status} />
          {review.id ? (
            <StatusSelect
              currentStatus={review.status ?? ReviewStatus.Active}
              options={Object.values(ReviewStatus)}
              label={t("status")}
              onStatus={(status) => onStatus(review.id, status)}
            />
          ) : null}
        </div>
      </div>
      <div className="flex items-center gap-1" role="img" aria-label={`${rating}/${MAX_RATING}`}>
        {Array.from({length: MAX_RATING}, (_, index) => (
          <Star key={index} className={index < rating ? "size-4 fill-amber-400 text-amber-400" : "size-4 text-muted-foreground/30"} />
        ))}
        <span className="ml-1 text-sm font-medium">
          {rating}/{MAX_RATING}
        </span>
      </div>
      <p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{review.comment || t("noReviewComment")}</p>
    </li>
  );
}

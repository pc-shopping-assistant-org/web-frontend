"use client";

import {ChevronLeft, ChevronRight, Star} from "lucide-react";
import {useLocale, useTranslations} from "next-intl";
import {useState} from "react";

import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {Card, CardContent} from "@/components/ui/card";
import {ErrorMessage} from "@/components/ui/error-message";
import {Skeleton} from "@/components/ui/skeleton";
import {useProfile} from "@/features/auth/queries";
import {isStaffRole} from "@/lib/auth/roles";

import type {ProductReview} from "../models";
import {useMyProductReviews, useProductReviews, useUpdateProductReview} from "../queries";
import {ReviewForm} from "./review-form";

const EDIT_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

/** The single edit is still open: not spent, and within 30 days of posting (the product being on sale is the backend's call). */
function canEdit(review: ProductReview) {
  return !review.editedAt && Date.now() - Date.parse(review.createdAt) <= EDIT_WINDOW_MS;
}

function Stars({rating}: {rating: number}) {
  return <span className="flex items-center gap-1 text-sm"><Star className="size-4 fill-amber-400 text-amber-400" />{rating}/5</span>;
}

/** The reviews of a product: the ones of the signed-in customer pinned on top, where they can edit them, then everyone's, newest first. */
export function ProductReviews({productId, enabled = true}: {productId: string; enabled?: boolean}) {
  const t = useTranslations("catalog");
  const locale = useLocale();
  const profile = useProfile();
  const isCustomer = profile.isSuccess && !isStaffRole(profile.data.role);
  const [pageNumber, setPageNumber] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const reviews = useProductReviews(productId, pageNumber, {enabled});
  const mine = useMyProductReviews(productId, enabled && isCustomer);
  const update = useUpdateProductReview();
  const myReviews = mine.data ?? [];
  const myIds = new Set(myReviews.map((review) => review.id));
  const others = (reviews.data?.items ?? []).filter((review) => !myIds.has(review.id));
  const page = reviews.data;
  const date = (value: string) => new Date(value).toLocaleDateString(locale === "vi" ? "vi-VN" : "en-US");

  async function save(review: ProductReview, values: {rating: number; comment: string}) {
    try {
      await update.mutateAsync({
        productId,
        reviewId: review.id,
        request: {rating: values.rating, comment: values.comment},
      });
      setEditingId(null);
    } catch {
      // the form shows the refusal
    }
  }

  return <section className="mt-14">
    <div className="mb-5 flex items-end justify-between">
      <div>
        <p className="eyebrow">{t("reviews")}</p>
        <h2 className="mt-2 text-2xl font-semibold">{t("customerReviews")}</h2>
      </div>
      <span className="text-sm text-muted-foreground">{page ? t("reviewsCount", {count: page.totalElements}) : null}</span>
    </div>
    {mine.isError ? <div className="mb-4"><ErrorMessage error={mine.error} /></div> : null}
    {myReviews.length ? <div className="mb-4 space-y-4">
      {myReviews.map((review) => <Card key={review.id} className="border-primary/40 bg-primary/[0.03]">
        <CardContent className="space-y-3 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="flex items-center gap-2 font-medium">{t("yourReview")}{review.editedAt ? <Badge className="border-border bg-muted/70 font-normal text-muted-foreground">{t("editedBadge")}</Badge> : null}</span>
            <Stars rating={review.rating} />
          </div>
          {editingId === review.id ? <ReviewForm
            idPrefix={`edit-${review.id}`}
            initial={{rating: review.rating, comment: review.comment ?? ""}}
            submitLabel={t("saveReview")}
            hint={t("editOnceHint")}
            pending={update.isPending}
            error={update.error}
            onSubmit={(values) => void save(review, values)}
            onCancel={() => setEditingId(null)}
          /> : <>
            <p className="text-sm leading-6 text-muted-foreground">{review.comment || "—"}</p>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground">{date(review.createdAt)}</span>
              {canEdit(review) ? <Button type="button" size="sm" variant="outline" onClick={() => { update.reset(); setEditingId(review.id); }}>{t("editReview")}</Button> : null}
            </div>
          </>}
        </CardContent>
      </Card>)}
    </div> : null}
    {!enabled || reviews.isPending ? <Skeleton className="h-24 rounded-2xl" /> : reviews.isError ? <ErrorMessage error={reviews.error} /> : others.length === 0 && myReviews.length === 0 ? <div className="rounded-2xl border border-dashed p-8 text-sm text-muted-foreground">{t("noReviews")}</div> : <>
      <div className="grid gap-4 md:grid-cols-2">
        {others.map((review) => <Card key={review.id}>
          <CardContent className="space-y-2 p-5">
            <div className="flex items-center justify-between">
              <span className="font-medium">{review.reviewerName ?? t("verifiedBuyer")}</span>
              <Stars rating={review.rating} />
            </div>
            <p className="text-sm leading-6 text-muted-foreground">{review.comment || "—"}</p>
            <p className="text-xs text-muted-foreground">{date(review.createdAt)}{review.editedAt ? ` · ${t("editedBadge")}` : ""}</p>
          </CardContent>
        </Card>)}
      </div>
      {page && page.totalPages > 1 ? <div className="mt-6 flex items-center justify-center gap-2">
        <Button variant="outline" disabled={page.page === 0} onClick={() => setPageNumber((current) => Math.max(0, current - 1))}><ChevronLeft className="size-4" />{t("previous")}</Button>
        <span className="text-sm text-muted-foreground">{page.page + 1}/{page.totalPages}</span>
        <Button variant="outline" disabled={page.last} onClick={() => setPageNumber((current) => current + 1)}>{t("next")}<ChevronRight className="size-4" /></Button>
      </div> : null}
    </>}
  </section>;
}

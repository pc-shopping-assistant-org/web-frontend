"use client";

import {useTranslations} from "next-intl";
import {useState} from "react";

import {Button} from "@/components/ui/button";
import {ErrorMessage} from "@/components/ui/error-message";
import {ReviewForm} from "@/features/catalog/components/review-form";
import {useCreateProductReview, useOrderLineProduct} from "@/features/catalog/queries";
import {Link} from "@/i18n/navigation";

/**
 * Review of one line of a completed order. A line is reviewed once; the review itself is edited on the page of the
 * product, where the customer's reviews are pinned, so a line that is already reviewed just points there.
 * {@code reviewed} is undefined while it is being looked up, and then nothing is shown rather than a button that may not apply.
 */
export function OrderLineReview({orderItemId, productVariantId, reviewed}: {orderItemId: string; productVariantId?: string; reviewed?: boolean}) {
  const t = useTranslations("orders");
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  const product = useOrderLineProduct(productVariantId, open || done || reviewed === true);
  const create = useCreateProductReview();
  const productLink = product.data ? <Link href={`/products/${product.data.seoName}`} className="font-medium text-primary hover:underline">{t("viewYourReview")}</Link> : null;

  async function submit(values: {rating: number; comment: string}) {
    if (!product.data) return;
    try {
      await create.mutateAsync({
        productId: product.data.id,
        request: {orderItemId, rating: values.rating, comment: values.comment},
      });
      setDone(true);
      setOpen(false);
    } catch {
      // the form shows the refusal
    }
  }

  if (!productVariantId || reviewed === undefined) return null;
  if (done || reviewed) return <p className="mt-3 text-sm text-muted-foreground">{done ? t("reviewSubmitted") : t("alreadyReviewed")} {productLink}</p>;
  if (!open) return <Button type="button" size="sm" variant="outline" className="mt-3" onClick={() => { create.reset(); setOpen(true); }}>{t("writeReview")}</Button>;
  return <div className="mt-4 rounded-xl border bg-muted/20 p-4">
    {product.isError ? <ErrorMessage error={product.error} /> : null}
    <ReviewForm
      idPrefix={`review-${orderItemId}`}
      submitLabel={t("submitReview")}
      pending={create.isPending || product.isPending}
      error={create.error}
      onSubmit={(values) => void submit(values)}
      onCancel={() => setOpen(false)}
    />
    {create.isError && productLink ? <p className="mt-3 text-sm text-muted-foreground">{productLink}</p> : null}
  </div>;
}

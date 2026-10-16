"use client";

import { useTranslations } from "next-intl";
import { DiscountForm } from "./discount-create";
import { useAdminDiscount } from "./queries";
import { BackLink, Loading, Failure } from "./detail-kit";

export function AdminDiscountDetailPage({
  discountId,
}: {
  discountId: string;
}) {
  const t = useTranslations("admin");
  const discount = useAdminDiscount(discountId);
  if (discount.isPending) return <Loading />;
  if (discount.isError || !discount.data)
    return (
      <>
        <BackLink href="/admin/discounts">{t("back")}</BackLink>
        <Failure error={discount.error} />
      </>
    );
  return (
    <div>
      <BackLink href="/admin/discounts">{t("back")}</BackLink>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">{t("editDiscount")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{discount.data.title}</p>
      </div>
      <DiscountForm discount={discount.data} />
    </div>
  );
}

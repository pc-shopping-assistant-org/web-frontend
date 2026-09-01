import { useTranslations } from "next-intl";

import { Badge } from "./badge";
import {AccountStatus} from "@/lib/domain/account-enums";
import {OrderStatus, PaymentStatus} from "@/lib/domain/commerce-enums";
import {ResourceStatus} from "@/lib/domain/catalog-enums";

const positive = new Set<string>([ResourceStatus.Active, OrderStatus.Completed, OrderStatus.Confirmed, PaymentStatus.Paid]);
const warning = new Set<string>([
  OrderStatus.PendingPayment,
  OrderStatus.PendingConfirmation,
  PaymentStatus.Pending,
  OrderStatus.Shipping,
]);
const negative = new Set<string>([
  OrderStatus.Cancelled,
  PaymentStatus.Failed,
  AccountStatus.Inactive,
  AccountStatus.Locked,
  ResourceStatus.Deleted,
]);

export function StatusBadge({
  status,
  label,
}: {
  status?: string | null;
  label?: string;
}) {
  const t = useTranslations("admin");
  const value = status?.toUpperCase() ?? "—";
  const className = positive.has(value)
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : warning.has(value)
      ? "border-amber-200 bg-amber-50 text-amber-700"
      : negative.has(value)
        ? "border-rose-200 bg-rose-50 text-rose-700"
        : "";
  const translated =
    !label && status && t.has(`statusValues.${value}`)
      ? t(`statusValues.${value}`)
      : (label ?? value);
  return <Badge className={className}>{translated}</Badge>;
}

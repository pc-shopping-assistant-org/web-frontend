import {Badge} from "./badge";

const positive = new Set(["ACTIVE", "COMPLETED", "CONFIRMED", "PAID"]);
const warning = new Set(["PENDING_PAYMENT", "PENDING_CONFIRMATION", "PENDING", "SHIPPING"]);
const negative = new Set(["CANCELLED", "FAILED", "INACTIVE", "LOCKED", "DELETED"]);

export function StatusBadge({status, label}: {status?: string | null; label?: string}) {
  const value = status?.toUpperCase() ?? "—";
  const className = positive.has(value)
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : warning.has(value)
      ? "border-amber-200 bg-amber-50 text-amber-700"
      : negative.has(value)
        ? "border-rose-200 bg-rose-50 text-rose-700"
        : "";
  return <Badge className={className}>{label ?? value}</Badge>;
}

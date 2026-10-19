"use client";

import {CreditCard} from "lucide-react";
import {useTranslations} from "next-intl";

import {Card} from "@/components/ui/card";
import {ErrorMessage} from "@/components/ui/error-message";
import {Skeleton} from "@/components/ui/skeleton";
import {StatusBadge} from "@/components/ui/status-badge";
import {useAdminPaymentMethods} from "@/features/payments/queries";

import {DataTable, EmptyBox, ListFooter, PageHeader} from "./list-kit";

/** The payment methods the shop has set up. They are fixed data used when an order is made and a payment reconciled. */
export function PaymentMethodListPage() {
  const t = useTranslations("admin");
  const tl = useTranslations("admin.paymentMethodList");
  const query = useAdminPaymentMethods();
  const methods = query.data ?? [];

  return (
    <div className="space-y-5">
      <PageHeader title={t("resource.paymentMethods")} description={t("resource.paymentMethodsDescription")} />
      <Card className="p-4 sm:p-5">
        {query.isPending ? (
          <Skeleton className="h-40 rounded-xl" />
        ) : query.isError ? (
          <ErrorMessage error={query.error} />
        ) : methods.length === 0 ? (
          <EmptyBox>{tl("empty")}</EmptyBox>
        ) : (
          <DataTable
            minWidth="32rem"
            columns={[
              {key: "method", label: tl("method")},
              {key: "code", label: tl("code")},
              {key: "status", label: t("status")},
            ]}
          >
            {methods.map((method, index) => (
              <tr key={method.id ?? index} className="border-t transition hover:bg-muted/20">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <CreditCard className="size-4" />
                    </span>
                    <span className="font-medium">{method.name ?? method.code ?? "—"}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground">{method.code ?? "—"}</span>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={method.status} />
                </td>
              </tr>
            ))}
          </DataTable>
        )}
        {methods.length > 0 ? <ListFooter summary={t("paymentMethodCatalogHint")} /> : null}
      </Card>
    </div>
  );
}

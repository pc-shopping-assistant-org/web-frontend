"use client";

import {useTranslations} from "next-intl";
import {useState} from "react";

import {Card} from "@/components/ui/card";
import {ErrorMessage} from "@/components/ui/error-message";
import {Input} from "@/components/ui/input";
import {Select} from "@/components/ui/select";
import {Skeleton} from "@/components/ui/skeleton";
import {StatusBadge} from "@/components/ui/status-badge";
import {Link} from "@/i18n/navigation";
import {ResourceStatus} from "@/lib/domain/catalog-enums";

import {AdminCursorPagination} from "./admin-pagination";
import {DataTable, EmptyBox, FilterField, FilterPanel, ListFooter, PageHeader} from "./list-kit";
import {SupplierCreateForm} from "./management-forms";
import {useAdminSuppliers} from "./queries";

const PAGE_SIZE = 20;
const EMPTY_FILTERS = {keyword: "", status: ""};

/** The suppliers: a search by text and status, and a table of their contacts. */
export function SupplierListPage() {
  const t = useTranslations("admin");
  const tl = useTranslations("admin.supplierList");
  const [draft, setDraft] = useState(EMPTY_FILTERS);
  const [applied, setApplied] = useState(EMPTY_FILTERS);
  const [cursor, setCursor] = useState<string | undefined>();
  const query = useAdminSuppliers({limit: PAGE_SIZE, cursor, keyword: applied.keyword || undefined, status: applied.status || undefined});
  const page = query.data;
  const items = page?.items ?? [];
  const filtered = Boolean(applied.keyword || applied.status);

  return (
    <div className="space-y-5">
      <PageHeader title={t("resource.suppliers")} description={t("resource.suppliersDescription")} />
      <SupplierCreateForm />
      <FilterPanel
        onSubmit={() => {
          setApplied({...draft, keyword: draft.keyword.trim()});
          setCursor(undefined);
        }}
        onReset={() => {
          setDraft(EMPTY_FILTERS);
          setApplied(EMPTY_FILTERS);
          setCursor(undefined);
        }}
        className="xl:grid-cols-[minmax(0,1fr)_14rem]"
      >
        <FilterField label={t("search")}>
          <Input
            aria-label={t("searchSuppliers")}
            placeholder={t("searchSuppliers")}
            value={draft.keyword}
            onChange={(event) => setDraft((current) => ({...current, keyword: event.target.value}))}
          />
        </FilterField>
        <FilterField label={t("status")}>
          <Select value={draft.status} onChange={(event) => setDraft((current) => ({...current, status: event.target.value}))}>
            <option value="">{t("allStatuses")}</option>
            {[ResourceStatus.Active, ResourceStatus.Inactive].map((status) => (
              <option key={status} value={status}>
                {t(`statusValues.${status}`)}
              </option>
            ))}
          </Select>
        </FilterField>
      </FilterPanel>
      <Card className="p-4 sm:p-5">
        {query.isPending ? (
          <Skeleton className="h-48 rounded-xl" />
        ) : query.isError ? (
          <ErrorMessage error={query.error} />
        ) : items.length === 0 ? (
          <EmptyBox>{filtered ? tl("emptyFiltered") : tl("empty")}</EmptyBox>
        ) : (
          <DataTable
            minWidth="40rem"
            columns={[
              {key: "name", label: tl("name")},
              {key: "email", label: tl("email")},
              {key: "phone", label: tl("phone")},
              {key: "status", label: t("status")},
            ]}
          >
            {items.map((supplier) => (
              <tr key={supplier.id} className="border-t transition hover:bg-muted/20">
                <td className="px-4 py-3">
                  {supplier.id ? (
                    <Link href={`/admin/suppliers/${supplier.id}`} className="font-medium hover:text-primary hover:underline">
                      {supplier.name ?? "—"}
                    </Link>
                  ) : (
                    <span className="font-medium">{supplier.name ?? "—"}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{supplier.email ?? "—"}</td>
                <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{supplier.phone ?? "—"}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={supplier.status} />
                </td>
              </tr>
            ))}
          </DataTable>
        )}
        {page && items.length > 0 && (page.hasPrev || page.hasNext) ? (
          <ListFooter
            summary={t("showingItems", {count: items.length})}
            pager={
              <AdminCursorPagination
                hasPrev={Boolean(page.hasPrev)}
                hasNext={Boolean(page.hasNext)}
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

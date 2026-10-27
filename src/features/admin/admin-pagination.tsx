"use client";

import {ArrowLeft, ArrowRight} from "lucide-react";
import {useTranslations} from "next-intl";

import {Button} from "@/components/ui/button";
import {Pagination} from "@/components/ui/pagination";

/** Numbered pages of an admin list; `page` and `onPageChange` are zero-based like the backend's page number. */
export function AdminPagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  const t = useTranslations("admin");
  return (
    <Pagination
      page={page + 1}
      totalPages={totalPages}
      onPageChange={(next) => onPageChange(next - 1)}
      previousLabel={t("previous")}
      nextLabel={t("next")}
      pageLabel={(number) => t("pageNumber", {page: number})}
      className="justify-end"
    />
  );
}

/** Previous and next for a list the backend pages by cursor and cannot count. */
export function AdminCursorPagination({
  hasPrev,
  hasNext,
  onPrev,
  onNext,
}: {
  hasPrev: boolean;
  hasNext: boolean;
  onPrev: () => void;
  onNext: () => void;
}) {
  const t = useTranslations("admin");
  return (
    <div className="flex items-center gap-2">
      <Button type="button" variant="outline" size="sm" onClick={onPrev} disabled={!hasPrev}>
        <ArrowLeft className="size-4" />
        {t("previous")}
      </Button>
      <Button type="button" variant="outline" size="sm" onClick={onNext} disabled={!hasNext}>
        {t("next")}
        <ArrowRight className="size-4" />
      </Button>
    </div>
  );
}

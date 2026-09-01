"use client";

import {ArrowLeft, ArrowRight} from "lucide-react";
import {useTranslations} from "next-intl";

import {Button} from "@/components/ui/button";

export function AdminPagination({hasPrev, hasNext, onPrev, onNext}: {hasPrev: boolean; hasNext: boolean; onPrev: () => void; onNext: () => void}) {
  const t = useTranslations("admin");
  return <div className="flex items-center gap-2"><Button type="button" variant="outline" size="sm" onClick={onPrev} disabled={!hasPrev}><ArrowLeft className="size-4" />{t("previous")}</Button><Button type="button" variant="outline" size="sm" onClick={onNext} disabled={!hasNext}>{t("next")}<ArrowRight className="size-4" /></Button></div>;
}

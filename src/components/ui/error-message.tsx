"use client";

import {useTranslations} from "next-intl";

import {ApiClientError} from "@/lib/api/envelope";

export function ErrorMessage({error, fallback = "UNKNOWN"}: {error: unknown; fallback?: string}) {
  const t = useTranslations("errors");
  const common = useTranslations("common");
  const key = error instanceof ApiClientError ? error.messageKey : fallback;
  const translated = t.has(String(key)) ? t(String(key)) : common("unknownError");
  const detail = error instanceof ApiClientError ? error.errors.find((item) => item.message)?.message : undefined;

  return (
    <div role="alert" className="rounded-lg border border-destructive/25 bg-destructive/5 p-3 text-sm text-destructive">
      <p>{translated}</p>
      {detail ? <p className="mt-1 text-xs opacity-80">{detail}</p> : null}
    </div>
  );
}

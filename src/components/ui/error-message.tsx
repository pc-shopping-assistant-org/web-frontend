"use client";

import {useTranslations} from "next-intl";

import {ApiClientError} from "@/lib/api/envelope";
import {ApiMessageKey} from "@/lib/domain/message-keys";

export function ErrorMessage({error, fallback = ApiMessageKey.UNKNOWN}: {error: unknown; fallback?: string}) {
  const t = useTranslations("errors");
  const common = useTranslations("common");
  const key = error instanceof ApiClientError ? error.messageKey : fallback;
  const hasTranslation = t.has(String(key));
  const translated = hasTranslation ? t(String(key)) : common("unknownError");
  // The backend's own wording is English, so it is shown only where it adds something the translation cannot:
  // an error nobody translated, or the validation message that says which field is wrong
  const showDetail = !hasTranslation || key === ApiMessageKey.VALIDATION_ERROR;
  const detail = showDetail && error instanceof ApiClientError ? error.errors.find((item) => item.message)?.message : undefined;

  return (
    <div role="alert" className="rounded-lg border border-destructive/25 bg-destructive/5 p-3 text-sm text-destructive">
      <p>{translated}</p>
      {detail ? <p className="mt-1 text-xs opacity-80">{detail}</p> : null}
    </div>
  );
}

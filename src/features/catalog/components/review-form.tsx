"use client";

import {Star} from "lucide-react";
import {useTranslations} from "next-intl";
import {useState} from "react";

import {Button} from "@/components/ui/button";
import {ErrorMessage} from "@/components/ui/error-message";
import {Label} from "@/components/ui/label";
import {Textarea} from "@/components/ui/textarea";

import {REVIEW_COMMENT_MAX_LENGTH} from "../contracts/requests";

const RATINGS = [1, 2, 3, 4, 5] as const;

export type ReviewFormValues = {rating: number; comment: string};

/** The stars and the comment of a review, for writing one and for editing one. */
export function ReviewForm({
  idPrefix,
  initial,
  submitLabel,
  hint,
  pending,
  error,
  onSubmit,
  onCancel,
}: {
  idPrefix: string;
  initial?: ReviewFormValues;
  submitLabel: string;
  hint?: string;
  pending: boolean;
  error: unknown;
  onSubmit: (values: ReviewFormValues) => void;
  onCancel?: () => void;
}) {
  const t = useTranslations("catalog");
  const [rating, setRating] = useState(initial?.rating ?? 0);
  const [comment, setComment] = useState(initial?.comment ?? "");

  return <form
    className="space-y-4"
    onSubmit={(event) => {
      event.preventDefault();
      if (rating) onSubmit({rating, comment});
    }}
  >
    <div className="space-y-2">
      <Label>{t("ratingLabel")}</Label>
      <div className="flex gap-1" role="group" aria-label={t("ratingLabel")}>
        {RATINGS.map((value) => <button
          key={value}
          type="button"
          aria-label={t("starsOption", {count: value})}
          aria-pressed={rating === value}
          onClick={() => setRating(value)}
          className="rounded p-0.5 transition hover:scale-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
        >
          <Star className={`size-7 ${value <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40"}`} />
        </button>)}
      </div>
    </div>
    <div className="space-y-2">
      <Label htmlFor={`${idPrefix}-comment`}>{t("commentLabel")}</Label>
      <Textarea
        id={`${idPrefix}-comment`}
        value={comment}
        maxLength={REVIEW_COMMENT_MAX_LENGTH}
        placeholder={t("commentPlaceholder")}
        onChange={(event) => setComment(event.target.value)}
      />
    </div>
    {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    {error ? <ErrorMessage error={error} /> : null}
    <div className="flex gap-2">
      <Button type="submit" disabled={pending || !rating}>{submitLabel}</Button>
      {onCancel ? <Button type="button" variant="outline" onClick={onCancel} disabled={pending}>{t("cancelReview")}</Button> : null}
    </div>
  </form>;
}

"use client";

import {ArrowLeft} from "lucide-react";
import {ErrorMessage} from "@/components/ui/error-message";
import {AdminPageSkeleton} from "@/components/ui/loading-skeletons";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Link} from "@/i18n/navigation";

/** Small shared back link so every admin detail screen has a predictable exit. */
export function BackLink({href, children}: {href: string; children: string}) {
  return (
    <Link href={href} className="mb-7 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
      <ArrowLeft className="size-4" />
      {children}
    </Link>
  );
}

export function Loading() {
  return <AdminPageSkeleton />;
}
export function Failure({error}: {error: unknown}) {
  return <ErrorMessage error={error} />;
}
export function Field({
  id,
  label,
  value,
  onChange,
  type = "text",
  required,
  min,
  max,
  disabled = false,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  min?: string;
  max?: string;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        min={min}
        max={max}
        disabled={disabled}
      />
    </div>
  );
}
export function FormError({error, formError}: {error: unknown; formError?: string}) {
  return error || formError ? (
    <div className="space-y-2">
      {formError ? <p className="text-sm text-destructive">{formError}</p> : null}
      {error ? <ErrorMessage error={error} /> : null}
    </div>
  ) : null;
}

export function SummaryLine({label, value, strong}: {label: string; value: string; strong?: boolean}) {
  return (
    <div className={`flex justify-between gap-4 ${strong ? "font-semibold" : ""}`}>
      <span className="text-muted-foreground">{label}</span>
      <span>{value}</span>
    </div>
  );
}

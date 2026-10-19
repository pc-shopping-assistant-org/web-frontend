"use client";

import {Eye, EyeOff} from "lucide-react";
import {useTranslations} from "next-intl";
import {forwardRef, useState, type InputHTMLAttributes} from "react";

import {cn} from "@/lib/utils";

const INPUT_CLASS =
  "flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(({className, type = "text", ...props}, ref) =>
  type === "password" ? (
    <PasswordInput ref={ref} className={className} {...props} />
  ) : (
    <input ref={ref} type={type} className={cn(INPUT_CLASS, className)} {...props} />
  ),
);
Input.displayName = "Input";

/** Every password box can show what was typed, so a typo is seen before it locks someone out. */
const PasswordInput = forwardRef<HTMLInputElement, Omit<InputHTMLAttributes<HTMLInputElement>, "type">>(({className, ...props}, ref) => {
  const t = useTranslations("common");
  const [visible, setVisible] = useState(false);
  const label = visible ? t("hidePassword") : t("showPassword");

  return (
    <div className="relative w-full">
      <input ref={ref} type={visible ? "text" : "password"} className={cn(INPUT_CLASS, "pr-10", className)} {...props} />
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        disabled={props.disabled}
        aria-label={label}
        aria-pressed={visible}
        title={label}
        className="absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r-lg text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {visible ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
      </button>
    </div>
  );
});
PasswordInput.displayName = "PasswordInput";

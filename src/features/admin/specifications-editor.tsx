"use client";

import {useTranslations} from "next-intl";
import {useEffect, useMemo, useState} from "react";

import {ErrorMessage} from "@/components/ui/error-message";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Select} from "@/components/ui/select";
import {Skeleton} from "@/components/ui/skeleton";

import {useCategorySpecsSchema} from "./queries";

type Specs = Record<string, unknown>;
type SchemaAttribute = {
  allowedValues?: string[];
  dataType?: string;
  displayName?: string;
  key?: string;
  required?: boolean;
  unit?: string;
};

/**
 * The specifications of a product, filled in the way the category defines them: one box per attribute, of the
 * attribute's own type. A category with no attributes has nothing to fill in, so nothing is shown. The value stays a
 * JSON string so both forms keep their state as before, but the seller never types JSON.
 */
export function SpecificationsEditor({
  categoryId,
  value,
  onChange,
  idPrefix,
}: {
  categoryId: string;
  value: string;
  onChange: (value: string) => void;
  idPrefix: string;
}) {
  const t = useTranslations("admin");
  const schema = useCategorySpecsSchema(categoryId);
  const parsed = useMemo(() => parseSpecs(value), [value]);
  const attributes = useMemo(
    () =>
      (schema.data?.attributes ?? [])
        .slice()
        .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
        .map((attribute) => attribute as SchemaAttribute)
        .filter((attribute) => Boolean(attribute.key)),
    [schema.data?.attributes],
  );

  /** Values of another category (or of an attribute since removed) are not on screen, so they must not be sent. */
  const settled = Boolean(categoryId) && !schema.isPending && !schema.isError;
  useEffect(() => {
    if (!settled) return;
    const allowed = new Set(attributes.map((attribute) => attribute.key));
    const entries = Object.entries(parsed);
    const kept = entries.filter(([key]) => allowed.has(key));
    if (kept.length !== entries.length) onChange(JSON.stringify(Object.fromEntries(kept), null, 2));
  }, [settled, attributes, parsed, onChange]);

  function setSpec(key: string, next: unknown) {
    const nextSpecs = {...parsed};
    if (next === "" || next === undefined || next === null || (Array.isArray(next) && next.length === 0)) delete nextSpecs[key];
    else nextSpecs[key] = next;
    onChange(JSON.stringify(nextSpecs, null, 2));
  }

  if (!categoryId) return null;
  if (schema.isPending) return <Skeleton className="h-24 rounded-xl sm:col-span-2" />;
  if (schema.isError)
    return (
      <div className="sm:col-span-2">
        <ErrorMessage error={schema.error} />
      </div>
    );
  if (attributes.length === 0) return null;

  return (
    <section className="space-y-4 sm:col-span-2" aria-label={t("specifications")}>
      <div>
        <h3 className="text-base font-semibold">{t("specifications")}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{t("specificationsSchemaHint")}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {attributes.map((attribute) => (
          <SpecificationField
            key={attribute.key}
            attribute={attribute}
            value={parsed[attribute.key!]}
            id={`${idPrefix}-${attribute.key}`}
            onChange={(next) => setSpec(attribute.key!, next)}
          />
        ))}
      </div>
    </section>
  );
}

function SpecificationField({
  attribute,
  value,
  id,
  onChange,
}: {
  attribute: SchemaAttribute;
  value: unknown;
  id: string;
  onChange: (value: unknown) => void;
}) {
  const t = useTranslations("admin");
  const label = attribute.displayName ?? attribute.key ?? t("specifications");
  const dataType = attribute.dataType?.toUpperCase() ?? "STRING";
  const stringValue = value == null ? "" : String(value);

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>
        {label}
        {attribute.required ? <span className="ml-1 text-destructive">*</span> : null}
        {attribute.unit ? <span className="ml-1 text-xs font-normal text-muted-foreground">({attribute.unit})</span> : null}
      </Label>
      {dataType === "ENUM" && attribute.allowedValues?.length ? (
        <Select id={id} value={stringValue} required={attribute.required} onChange={(event) => onChange(event.target.value)}>
          <option value="">{t("chooseValue")}</option>
          {attribute.allowedValues.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </Select>
      ) : dataType === "LIST" ? (
        <ListField id={id} items={toItems(value)} allowedValues={attribute.allowedValues ?? []} onChange={onChange} />
      ) : dataType === "BOOLEAN" ? (
        <Select
          id={id}
          value={stringValue}
          required={attribute.required}
          onChange={(event) => onChange(event.target.value === "" ? "" : event.target.value === "true")}
        >
          <option value="">{t("chooseValue")}</option>
          <option value="true">{t("booleanTrue")}</option>
          <option value="false">{t("booleanFalse")}</option>
        </Select>
      ) : (
        <Input
          id={id}
          type={dataType === "NUMBER" ? "number" : "text"}
          value={stringValue}
          onChange={(event) =>
            onChange(dataType === "NUMBER" && event.target.value !== "" ? Number(event.target.value) : event.target.value)
          }
          required={attribute.required}
        />
      )}
    </div>
  );
}

/** Several values of one attribute: a tick box per allowed value, or comma separated text when any value is accepted. */
function ListField({
  id,
  items,
  allowedValues,
  onChange,
}: {
  id: string;
  items: string[];
  allowedValues: string[];
  onChange: (value: string[]) => void;
}) {
  const [draft, setDraft] = useState(items.join(", "));

  if (allowedValues.length > 0) {
    return (
      <div id={id} className="flex flex-wrap gap-x-4 gap-y-2 rounded-md border border-input p-2.5">
        {allowedValues.map((option) => (
          <label key={option} className="flex items-center gap-1.5 text-sm">
            <input
              type="checkbox"
              checked={items.includes(option)}
              onChange={(event) =>
                onChange(event.target.checked ? [...items, option] : items.filter((item) => item !== option))
              }
            />
            {option}
          </label>
        ))}
      </div>
    );
  }
  return (
    <Input
      id={id}
      value={draft}
      onChange={(event) => {
        setDraft(event.target.value);
        onChange(event.target.value.split(",").map((item) => item.trim()).filter(Boolean));
      }}
    />
  );
}

function toItems(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String) : [];
}

function parseSpecs(value: string): Specs {
  try {
    const parsed = JSON.parse(value || "{}");
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as Specs) : {};
  } catch {
    return {};
  }
}

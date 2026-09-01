"use client";

import { ChevronDown, Settings2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";

import { useCategorySpecsSchema } from "./queries";

type Specs = Record<string, unknown>;
type SchemaAttribute = {
  allowedValues?: string[];
  dataType?: string;
  displayName?: string;
  key?: string;
  required?: boolean;
  unit?: string;
};

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
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const parsed = useMemo(() => parseSpecs(value), [value]);
  const attributes = useMemo(
    () =>
      (schema.data?.groups ?? [])
        .slice()
        .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
        .flatMap((group) =>
          (group.attributes ?? [])
            .slice()
            .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
            .map((attribute) => ({
              groupName: group.groupName ?? t("specifications"),
              attribute: attribute as SchemaAttribute,
            })),
        )
        .filter(({ attribute }) => Boolean(attribute.key)),
    [schema.data?.groups, t],
  );

  function setSpec(key: string, next: unknown) {
    const nextSpecs = { ...parsed };
    if (next === "" || next === undefined || next === null) delete nextSpecs[key];
    else nextSpecs[key] = next;
    onChange(JSON.stringify(nextSpecs, null, 2));
  }

  const hasSchema = Boolean(categoryId && attributes.length);
  return (
    <div className="space-y-3 sm:col-span-2">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Label htmlFor={`${idPrefix}-specifications-json`}>
            {t("specifications")}
          </Label>
          <p className="mt-1 text-xs text-muted-foreground">
            {hasSchema
              ? t("specificationsSchemaHint")
              : categoryId
                ? t("specificationsFallbackHint")
                : t("selectCategoryForSpecifications")}
          </p>
        </div>
        {hasSchema ? (
          <button
            type="button"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition hover:text-foreground"
            onClick={() => setAdvancedOpen((current) => !current)}
            aria-expanded={advancedOpen}
          >
            <Settings2 className="size-3.5" />
            {t("advancedJson")}
            <ChevronDown
              className={`size-3.5 transition ${advancedOpen ? "rotate-180" : ""}`}
            />
          </button>
        ) : null}
      </div>

      {schema.isPending && categoryId ? (
        <Skeleton className="h-24 rounded-xl" />
      ) : hasSchema ? (
        <div className="grid gap-4 rounded-xl border bg-muted/15 p-4 lg:grid-cols-2">
          {groupAttributes(attributes).map(([groupName, groupItems]) => (
            <Card key={groupName} className="bg-background/80 shadow-none">
              <CardHeader className="p-4 pb-3">
                <CardTitle className="text-sm">{groupName}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-4 pt-0">
                {groupItems.map(({ attribute }) => (
                  <SpecificationField
                    key={attribute.key}
                    attribute={attribute}
                    value={parsed[attribute.key!]}
                    id={`${idPrefix}-${attribute.key}`}
                    onChange={(next) => setSpec(attribute.key!, next)}
                  />
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Textarea
          id={`${idPrefix}-specifications-json`}
          className="min-h-32 font-mono text-xs"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      )}

      {hasSchema && advancedOpen ? (
        <div className="rounded-xl border bg-muted/15 p-4">
          <Label htmlFor={`${idPrefix}-specifications-json`}>
            {t("rawJson")}
          </Label>
          <Textarea
            id={`${idPrefix}-specifications-json`}
            className="mt-2 min-h-32 font-mono text-xs"
            value={value}
            onChange={(event) => onChange(event.target.value)}
          />
        </div>
      ) : null}
    </div>
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
        {attribute.unit ? (
          <span className="ml-1 text-xs font-normal text-muted-foreground">
            ({attribute.unit})
          </span>
        ) : null}
      </Label>
      {dataType === "ENUM" && attribute.allowedValues?.length ? (
        <Select id={id} value={stringValue} onChange={(event) => onChange(event.target.value)}>
          <option value="">{t("chooseValue")}</option>
          {attribute.allowedValues.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </Select>
      ) : dataType === "BOOLEAN" ? (
        <Select
          id={id}
          value={stringValue}
          onChange={(event) =>
            onChange(
              event.target.value === ""
                ? ""
                : event.target.value === "true",
            )
          }
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
            onChange(
              dataType === "NUMBER" && event.target.value !== ""
                ? Number(event.target.value)
                : event.target.value,
            )
          }
          required={attribute.required}
        />
      )}
    </div>
  );
}

function groupAttributes(
  attributes: { groupName: string; attribute: SchemaAttribute }[],
) {
  const groups = new Map<string, { groupName: string; attribute: SchemaAttribute }[]>();
  for (const item of attributes) {
    const entries = groups.get(item.groupName) ?? [];
    entries.push(item);
    groups.set(item.groupName, entries);
  }
  return Array.from(groups.entries());
}

function parseSpecs(value: string): Specs {
  try {
    const parsed = JSON.parse(value || "{}");
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Specs)
      : {};
  } catch {
    return {};
  }
}

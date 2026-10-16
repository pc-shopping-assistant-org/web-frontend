"use client";

import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ErrorMessage } from "@/components/ui/error-message";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Link, useRouter } from "@/i18n/navigation";
import {ResourceStatus} from "@/lib/domain/catalog-enums";

import { useBrands, useCategories } from "@/features/catalog/queries";
import { CategoryPicker } from "./category-picker";
import { galleryRequest, ProductGalleryEditor, type GalleryItem } from "./product-fields";
import { SpecificationsEditor } from "./specifications-editor";
import { VariantMatrixEditor } from "./variant-matrix";
import {
  buildVariantRequests,
  emptyMatrix,
  validateMatrix,
  type VariantProblem,
} from "./variant-matrix-model";
import {
  useCreateAdminProduct,
  useCreateAdminVariant,
} from "./queries";

/**
 * The product and its variants in one go. They are separate backend calls, so the product is made first and the
 * variants one by one; one that fails leaves the product behind and a retry makes only the variants still missing.
 */
export function ProductCreateForm() {
  const t = useTranslations("admin");
  const tv = useTranslations("admin.variantMatrix");
  const router = useRouter();
  const categories = useCategories();
  const brands = useBrands();
  const create = useCreateAdminProduct();
  const createVariant = useCreateAdminVariant();
  const [matrix, setMatrix] = useState(emptyMatrix);
  const [matrixProblem, setMatrixProblem] = useState<VariantProblem | null>(null);
  const [created, setCreated] = useState<{ id: string; done: string[] } | null>(null);
  const [variantError, setVariantError] = useState<unknown>(null);
  const [form, setForm] = useState({
    name: "",
    seoName: "",
    categoryId: "",
    brandId: "",
    description: "",
    specifications: "{}",
    images: [] as GalleryItem[],
  });
  const [formError, setFormError] = useState("");
  async function submit(event: FormEvent) {
    event.preventDefault();
    setFormError("");
    let specifications: Record<string, unknown> = {};
    try {
      specifications = JSON.parse(form.specifications || "{}");
    } catch {
      setFormError(t("invalidJson"));
      return;
    }
    if (
      !specifications ||
      Array.isArray(specifications) ||
      typeof specifications !== "object"
    ) {
      setFormError(t("specificationsObjectRequired"));
      return;
    }
    const problem = validateMatrix(matrix);
    setMatrixProblem(problem);
    if (problem) return;
    setVariantError(null);
    let productId = created?.id;
    if (!productId) {
      try {
        const product = await create.mutateAsync({
          name: form.name.trim(),
          seoName: form.seoName.trim(),
          categoryId: form.categoryId,
          brandId: form.brandId || undefined,
          description: form.description.trim() || undefined,
          specifications,
          images: galleryRequest(form.images),
        });
        productId = product?.id;
      } catch {
        return;
      }
      if (!productId) return;
    }
    const done = [...(created?.done ?? [])];
    setCreated({ id: productId, done });
    for (const { key, request } of buildVariantRequests(matrix)) {
      if (done.includes(key)) continue;
      try {
        await createVariant.mutateAsync({ productId, request });
      } catch (error) {
        setVariantError(error);
        return;
      }
      done.push(key);
      setCreated({ id: productId, done: [...done] });
    }
    router.push(`/admin/products/${productId}`);
  }
  return (
    <Card className="mb-6">
      {(
        <CardContent className="pt-6">
          <form
            className="grid gap-4 sm:grid-cols-2"
            onSubmit={(event) => void submit(event)}
          >
            <Field
              id="product-name"
              label={t("name")}
              value={form.name}
              onChange={(value) =>
                setForm((current) => ({ ...current, name: value }))
              }
              required
            />
            <Field
              id="product-seo"
              label={t("seoName")}
              value={form.seoName}
              onChange={(value) =>
                setForm((current) => ({ ...current, seoName: value }))
              }
            />
            <div className="space-y-2">
              <Label htmlFor="product-category">{t("category")} <span className="text-destructive">*</span></Label>
              <CategoryPicker
                id="product-category"
                value={form.categoryId}
                onChange={(categoryId) => setForm((current) => ({ ...current, categoryId }))}
                categories={categories.data ?? []}
                loading={categories.isPending}
                error={categories.error}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="product-brand">{t("brand")}</Label>
              <Select
                id="product-brand"
                value={form.brandId}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    brandId: event.target.value,
                  }))
                }
              >
                <option value="">{t("noBrand")}</option>
                {(brands.data ?? [])
                  .filter((brand) => brand.status === ResourceStatus.Active)
                  .map((brand) => (
                    <option key={brand.id} value={brand.id}>
                      {brand.name}
                    </option>
                  ))}
              </Select>
            </div>
            <ProductGalleryEditor
              id="product-gallery"
              items={form.images}
              onChange={(images) => setForm((current) => ({ ...current, images }))}
            />
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="product-description">{t("description")}</Label>
              <Textarea
                id="product-description"
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
              />
            </div>
            <SpecificationsEditor
              categoryId={form.categoryId}
              value={form.specifications}
              onChange={(value) =>
                setForm((current) => ({ ...current, specifications: value }))
              }
              idPrefix="product"
            />
            <VariantMatrixEditor
              value={matrix}
              onChange={(next) => {
                setMatrix(next);
                setMatrixProblem(null);
              }}
              problem={matrixProblem}
            />
            {created && variantError ? (
              <div role="alert" className="space-y-2 rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm sm:col-span-2">
                <p className="font-medium">
                  {tv("partial", { done: created.done.length, total: buildVariantRequests(matrix).length })}
                </p>
                <ErrorMessage error={variantError} />
                <Link href={`/admin/products/${created.id}`} className="inline-block font-medium text-primary underline-offset-4 hover:underline">
                  {tv("openCreated")}
                </Link>
              </div>
            ) : null}
            <div className="flex flex-wrap gap-2 sm:col-span-2">
              <Button
                type="submit"
                disabled={
                  create.isPending ||
                  createVariant.isPending ||
                  !form.categoryId ||
                  !form.name.trim()
                }
              >
                <Plus className="size-4" />
                {created ? tv("retry") : t("create")}
              </Button>
              {formError ? (
                <p className="self-center text-sm text-destructive">
                  {formError}
                </p>
              ) : null}
              {create.isError ? <ErrorMessage error={create.error} /> : null}
            </div>
          </form>
        </CardContent>
      )}
    </Card>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  required,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
      />
    </div>
  );
}

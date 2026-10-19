"use client";

import {Save, Trash2} from "lucide-react";
import {useTranslations} from "next-intl";
import {useMemo, useState, type FormEvent} from "react";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Label} from "@/components/ui/label";
import {Select} from "@/components/ui/select";
import {StatusBadge} from "@/components/ui/status-badge";
import {Textarea} from "@/components/ui/textarea";
import {useRouter} from "@/i18n/navigation";
import type {ProductDetail} from "@/features/catalog/contracts/responses";
import {ResourceStatus} from "@/lib/domain/catalog-enums";
import {ConfirmAction} from "./confirm-action";
import {galleryFromProduct, galleryRequest, ProductGalleryEditor} from "./product-fields";
import {SpecificationsEditor} from "./specifications-editor";
import {StatusSelect} from "./status-select";
import {ProductVariantsSection} from "./variant-table";
import {CategoryPicker} from "./category-picker";
import {useBrands, useCategories} from "@/features/catalog/queries";
import {useAdminProduct, useAdminProductStatus, useDeleteAdminProduct, useUpdateAdminProduct} from "./queries";
import {BackLink, Loading, Failure, Field, FormError} from "./detail-kit";

export function AdminProductDetailPage({productId}: {productId: string}) {
  const t = useTranslations("admin");
  const router = useRouter();
  const product = useAdminProduct(productId);
  const remove = useDeleteAdminProduct();
  if (product.isPending) return <Loading />;
  if (product.isError || !product.data)
    return (
      <>
        <BackLink href="/admin/products">{t("back")}</BackLink>
        <Failure error={product.error} />
      </>
    );
  return (
    <div>
      <BackLink href="/admin/products">{t("back")}</BackLink>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">{t("productDetail")}</p>
          <h1 className="mt-2 text-3xl font-semibold">{product.data.name}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{product.data.id}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={product.data.status} />
          <ConfirmAction
            title={t("confirmDelete")}
            confirmLabel={t("delete")}
            cancelLabel={t("cancel")}
            onConfirm={() =>
              remove.mutateAsync(productId).then(() => {
                router.push("/admin/products");
              })
            }
            size="sm"
            variant="destructive"
          >
            <Trash2 className="size-3.5" />
            {t("delete")}
          </ConfirmAction>
        </div>
      </div>
      <div className="space-y-6">
        <ProductEditor product={product.data} />
        <ProductVariantsSection product={product.data} />
      </div>
    </div>
  );
}

function ProductEditor({product}: {product: ProductDetail}) {
  const t = useTranslations("admin");
  const categories = useCategories();
  const brands = useBrands();
  const update = useUpdateAdminProduct();
  const status = useAdminProductStatus();
  const defaults = useMemo(
    () => ({
      name: product.name ?? "",
      seoName: product.seoName ?? "",
      categoryId: product.category?.id ?? "",
      brandId: product.brand?.id ?? "",
      description: product.description ?? "",
      specifications: product.specifications ? JSON.stringify(product.specifications, null, 2) : "{}",
      images: galleryFromProduct(product.images),
    }),
    [product],
  );
  const [draft, setDraft] = useState<typeof defaults | null>(null);
  const [formError, setFormError] = useState("");
  const form = draft ?? defaults;
  function set<K extends keyof typeof defaults>(key: K, value: (typeof defaults)[K]) {
    setDraft((current) => ({...(current ?? defaults), [key]: value}));
  }
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
    let saved;
    try {
      saved = await update.mutateAsync({
        id: product.id!,
        request: {
          name: form.name.trim(),
          seoName: form.seoName.trim(),
          categoryId: form.categoryId,
          brandId: form.brandId || undefined,
          description: form.description.trim() || undefined,
          specifications,
          images: galleryRequest(form.images),
        },
      });
    } catch {
      return;
    }
    setDraft({
      ...form,
      name: saved.name,
      seoName: saved.seoName,
      images: galleryFromProduct(saved.images),
    });
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("editProduct")}</CardTitle>
        <CardDescription>{t("editProductDescription")}</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4 sm:grid-cols-2" onSubmit={(event) => void submit(event)}>
          <Field id="admin-product-name" label={t("name")} value={form.name} onChange={(value) => set("name", value)} required />
          <Field id="admin-product-seo" label={t("seoName")} value={form.seoName} onChange={(value) => set("seoName", value)} />
          <div className="space-y-2">
            <Label htmlFor="admin-product-category">
              {t("category")} <span className="text-destructive">*</span>
            </Label>
            <CategoryPicker
              id="admin-product-category"
              value={form.categoryId}
              onChange={(categoryId) => set("categoryId", categoryId)}
              categories={categories.data ?? []}
              loading={categories.isPending}
              error={categories.error}
              required
              currentLabel={product.category?.name}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="admin-product-brand">{t("brand")}</Label>
            <Select id="admin-product-brand" value={form.brandId} onChange={(event) => set("brandId", event.target.value)}>
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
          <ProductGalleryEditor id="admin-product-gallery" items={form.images} onChange={(images) => set("images", images)} />
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="admin-product-description">{t("description")}</Label>
            <Textarea
              id="admin-product-description"
              value={form.description}
              onChange={(event) => set("description", event.target.value)}
            />
          </div>
          <SpecificationsEditor
            categoryId={form.categoryId}
            value={form.specifications}
            onChange={(value) => set("specifications", value)}
            idPrefix="admin-product"
          />
          <div className="flex flex-wrap items-center gap-2 sm:col-span-2">
            <Button type="submit" disabled={update.isPending}>
              <Save className="size-4" />
              {t("save")}
            </Button>
            <StatusSelect
              currentStatus={product.status ?? ResourceStatus.Active}
              options={[ResourceStatus.Active, ResourceStatus.Inactive]}
              label={t("status")}
              onStatus={(nextStatus) => status.mutateAsync({id: product.id!, status: nextStatus})}
              className="w-36"
              disabled={status.isPending}
            />
          </div>
          <FormError error={update.error ?? status.error} formError={formError} />
        </form>
      </CardContent>
    </Card>
  );
}

"use client";

import {ArrowLeft, Plus, Save, Trash2} from "lucide-react";
import {useLocale, useTranslations} from "next-intl";
import {useMemo, useState, type FormEvent} from "react";

import {Button} from "@/components/ui/button";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {ErrorMessage} from "@/components/ui/error-message";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Select} from "@/components/ui/select";
import {StatusBadge} from "@/components/ui/status-badge";
import {Textarea} from "@/components/ui/textarea";
import {Link} from "@/i18n/navigation";
import type {BackendSchema, CategoryTree, ProductDetail} from "@/lib/api/types";
import {formatMoney} from "@/lib/format";

import {useBrands, useCategories} from "@/features/catalog/queries";
import {
  useAdminCustomer,
  useAdminCustomerOrders,
  useAdminCustomerStatus,
  useAdminDiscount,
  useAdminEmployee,
  useAdminEmployeeStatus,
  useAdminOrder,
  useAdminOrderStatus,
  useAdminProduct,
  useAdminProductStatus,
  useAdminSuppliers,
  useAdminSupplier,
  useAdminDiscountStatus,
  useCreateAdminVariant,
  useDeleteAdminDiscount,
  useDeleteAdminSupplier,
  useDeleteAdminVariant,
  useOptions,
  useInvoices,
  useOrderInvoice,
  useRoles,
  useUpdateAdminDiscount,
  useUpdateAdminEmployee,
  useUpdateAdminProduct,
  useUpdateAdminSupplier,
} from "./queries";

/** Small shared back link so every admin detail screen has a predictable exit. */
function BackLink({href, children}: {href: string; children: string}) {
  return <Link href={href} className="mb-7 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" />{children}</Link>;
}

function Loading() { return <div className="h-72 animate-pulse rounded-2xl bg-muted" />; }
function Failure({error}: {error: unknown}) { return <ErrorMessage error={error} />; }
function Field({id, label, value, onChange, type = "text", required}: {id: string; label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean}) { return <div className="space-y-2"><Label htmlFor={id}>{label}</Label><Input id={id} type={type} value={value} onChange={(event) => onChange(event.target.value)} required={required} /></div>; }
function DateTimeField({id, label, value, onChange, required}: {id: string; label: string; value: string; onChange: (value: string) => void; required?: boolean}) { return <Field id={id} label={label} type="datetime-local" value={value} onChange={onChange} required={required} />; }
function FormError({error, formError}: {error: unknown; formError?: string}) { return error || formError ? <div className="space-y-2">{formError ? <p className="text-sm text-destructive">{formError}</p> : null}{error ? <ErrorMessage error={error} /> : null}</div> : null; }
function flatten(categories: CategoryTree[], depth = 0): {id: string; label: string}[] { return categories.flatMap((category) => [...(category.id ? [{id: category.id, label: `${"— ".repeat(depth)}${category.name ?? ""}`}] : []), ...flatten(category.children ?? [], depth + 1)]); }
function toDateTimeInput(value?: string) { return value ? value.slice(0, 16) : ""; }
function toIso(value: string) { return value ? new Date(value).toISOString() : new Date().toISOString(); }

export function AdminProductDetailPage({productId}: {productId: string}) {
  const t = useTranslations("admin");
  const product = useAdminProduct(productId);
  if (product.isPending) return <Loading />;
  if (product.isError || !product.data) return <><BackLink href="/admin/products">{t("back")}</BackLink><Failure error={product.error} /></>;
  return <div><BackLink href="/admin/products">{t("back")}</BackLink><div className="mb-8 flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow">{t("productDetail")}</p><h1 className="mt-2 text-3xl font-semibold">{product.data.name}</h1><p className="mt-2 text-sm text-muted-foreground">{product.data.id}</p></div><StatusBadge status={product.data.status} /></div><div className="space-y-6"><ProductEditor product={product.data} /><VariantManager product={product.data} /></div></div>;
}

function ProductEditor({product}: {product: ProductDetail}) {
  const t = useTranslations("admin");
  const categories = useCategories();
  const brands = useBrands();
  const suppliers = useAdminSuppliers({limit: 100});
  const update = useUpdateAdminProduct();
  const status = useAdminProductStatus();
  const defaults = useMemo(() => ({name: product.name ?? "", seoName: product.seoName ?? "", categoryId: product.category?.id ?? "", brandId: product.brand?.id ?? "", description: product.description ?? "", specifications: product.specifications ? JSON.stringify(product.specifications, null, 2) : "{}", supplierIds: product.suppliers?.flatMap((supplier) => supplier.id ? [supplier.id] : []) ?? []}), [product]);
  const [draft, setDraft] = useState<typeof defaults | null>(null);
  const [formError, setFormError] = useState("");
  const form = draft ?? defaults;
  function set<K extends keyof typeof defaults>(key: K, value: (typeof defaults)[K]) { setDraft((current) => ({...(current ?? defaults), [key]: value})); }
  async function submit(event: FormEvent) {
    event.preventDefault();
    setFormError("");
    let specifications: Record<string, unknown> = {};
    try { specifications = JSON.parse(form.specifications || "{}"); } catch { setFormError(t("invalidJson")); return; }
    const saved = await update.mutateAsync({id: product.id!, request: {name: form.name.trim(), seoName: form.seoName.trim(), categoryId: form.categoryId, brandId: form.brandId || undefined, supplierIds: form.supplierIds, description: form.description.trim() || undefined, specifications}});
    if (saved) setDraft({...form, name: saved.name ?? form.name, seoName: saved.seoName ?? form.seoName});
  }
  return <Card><CardHeader><CardTitle>{t("editProduct")}</CardTitle><CardDescription>{t("editProductDescription")}</CardDescription></CardHeader><CardContent><form className="grid gap-4 sm:grid-cols-2" onSubmit={(event) => void submit(event)}><Field id="admin-product-name" label={t("name")} value={form.name} onChange={(value) => set("name", value)} required /><Field id="admin-product-seo" label={t("seoName")} value={form.seoName} onChange={(value) => set("seoName", value)} required /><div className="space-y-2"><Label htmlFor="admin-product-category">{t("category")}</Label><Select id="admin-product-category" value={form.categoryId} onChange={(event) => set("categoryId", event.target.value)} required><option value="">{t("chooseCategory")}</option>{flatten(categories.data ?? []).map((category) => <option key={category.id} value={category.id}>{category.label}</option>)}</Select></div><div className="space-y-2"><Label htmlFor="admin-product-brand">{t("brand")}</Label><Select id="admin-product-brand" value={form.brandId} onChange={(event) => set("brandId", event.target.value)}><option value="">{t("noBrand")}</option>{(brands.data ?? []).filter((brand) => brand.status === "ACTIVE").map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}</Select></div><div className="space-y-2 sm:col-span-2"><Label htmlFor="admin-product-suppliers">{t("suppliers")}</Label><Select id="admin-product-suppliers" multiple value={form.supplierIds} onChange={(event) => set("supplierIds", Array.from(event.target.selectedOptions).map((option) => option.value))} className="min-h-28">{(suppliers.data?.items ?? []).filter((supplier) => supplier.id && supplier.status === "ACTIVE").map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}</Select></div><div className="space-y-2 sm:col-span-2"><Label htmlFor="admin-product-description">{t("description")}</Label><Textarea id="admin-product-description" value={form.description} onChange={(event) => set("description", event.target.value)} /></div><div className="space-y-2 sm:col-span-2"><Label htmlFor="admin-product-specifications">{t("specificationsJson")}</Label><Textarea id="admin-product-specifications" className="min-h-32 font-mono text-xs" value={form.specifications} onChange={(event) => set("specifications", event.target.value)} /></div><div className="flex flex-wrap items-center gap-2 sm:col-span-2"><Button type="submit" disabled={update.isPending}><Save className="size-4" />{t("save")}</Button><Select className="w-36" value={product.status ?? "ACTIVE"} onChange={(event) => void status.mutateAsync({id: product.id!, status: event.target.value})}><option value="ACTIVE">ACTIVE</option><option value="INACTIVE">INACTIVE</option></Select></div><FormError error={update.error ?? status.error} formError={formError} /></form></CardContent></Card>;
}

function VariantManager({product}: {product: ProductDetail}) {
  const t = useTranslations("admin");
  const create = useCreateAdminVariant();
  const remove = useDeleteAdminVariant();
  const options = useOptions();
  const [form, setForm] = useState({sku: "", model: "", listPrice: "", quantity: "0", warranty: "12", description: "", optionIds: [] as string[], imageFileIds: ""});
  async function submit(event: FormEvent) { event.preventDefault(); await create.mutateAsync({productId: product.id!, request: {sku: form.sku.trim(), model: form.model.trim() || undefined, listPrice: Number(form.listPrice), quantity: Number(form.quantity), warranty: form.warranty.trim() || undefined, description: form.description.trim() || undefined, optionIds: form.optionIds, images: form.imageFileIds.split(",").map((id) => id.trim()).filter(Boolean).map((fileId, index) => ({fileId, isMain: index === 0}))}}); setForm({sku: "", model: "", listPrice: "", quantity: "0", warranty: "12", description: "", optionIds: [], imageFileIds: ""}); }
  return <Card><CardHeader><CardTitle>{t("variants")}</CardTitle><CardDescription>{t("variantDescription")}</CardDescription></CardHeader><CardContent className="space-y-6"><div className="space-y-3">{(product.variants ?? []).map((variant, index) => <div key={variant.id ?? index} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4"><div><p className="font-medium">{variant.sku ?? "—"}</p><p className="mt-1 text-sm text-muted-foreground">{formatMoney(variant.listPrice, "vi")} · stock {variant.quantity ?? 0} · {variant.warranty ?? "—"}</p><p className="mt-1 text-xs text-muted-foreground">{variant.options?.map((option) => `${option.type}: ${option.name}`).join(" · ") || t("noOptions")}</p></div>{variant.id ? <Button size="sm" variant="destructive" onClick={() => { if (window.confirm(t("confirmDelete"))) void remove.mutateAsync(variant.id!); }} disabled={remove.isPending}><Trash2 className="size-4" />{t("delete")}</Button> : null}</div>)}</div><form className="grid gap-4 rounded-xl border bg-muted/20 p-4 sm:grid-cols-2" onSubmit={(event) => void submit(event)}><div className="sm:col-span-2"><p className="font-medium">{t("createVariant")}</p></div><Field id="variant-sku" label="SKU" value={form.sku} onChange={(value) => setForm((current) => ({...current, sku: value}))} required /><Field id="variant-model" label={t("model")} value={form.model} onChange={(value) => setForm((current) => ({...current, model: value}))} /><Field id="variant-price" label={t("listPrice")} type="number" value={form.listPrice} onChange={(value) => setForm((current) => ({...current, listPrice: value}))} required /><Field id="variant-quantity" label={t("quantity")} type="number" value={form.quantity} onChange={(value) => setForm((current) => ({...current, quantity: value}))} required /><Field id="variant-warranty" label={t("warranty")} value={form.warranty} onChange={(value) => setForm((current) => ({...current, warranty: value}))} /><div className="space-y-2 sm:col-span-2"><Label htmlFor="variant-options">{t("options")}</Label><Select id="variant-options" multiple value={form.optionIds} onChange={(event) => setForm((current) => ({...current, optionIds: Array.from(event.target.selectedOptions).map((option) => option.value)}))} className="min-h-28">{(options.data ?? []).filter((option) => option.id && option.status === "ACTIVE").map((option) => <option key={option.id} value={option.id}>{option.type}: {option.name} ({option.value})</option>)}</Select><p className="text-xs text-muted-foreground">{t("optionTypeHint")}</p></div><div className="space-y-2 sm:col-span-2"><Label htmlFor="variant-files">{t("imageFileIds")}</Label><Input id="variant-files" value={form.imageFileIds} onChange={(event) => setForm((current) => ({...current, imageFileIds: event.target.value}))} placeholder="uuid, uuid" /></div><div className="space-y-2 sm:col-span-2"><Label htmlFor="variant-description">{t("description")}</Label><Textarea id="variant-description" value={form.description} onChange={(event) => setForm((current) => ({...current, description: event.target.value}))} /></div><div className="sm:col-span-2"><Button type="submit" disabled={create.isPending || !form.sku || !form.listPrice}><Plus className="size-4" />{t("create")}</Button></div><FormError error={create.error ?? remove.error} /></form></CardContent></Card>;
}

export function AdminCustomerDetailPage({customerId}: {customerId: string}) {
  const t = useTranslations("admin");
  const customer = useAdminCustomer(customerId);
  const orders = useAdminCustomerOrders(customerId);
  const status = useAdminCustomerStatus();
  if (customer.isPending) return <Loading />;
  if (customer.isError || !customer.data) return <><BackLink href="/admin/customers">{t("back")}</BackLink><Failure error={customer.error} /></>;
  const item = customer.data;
  return <div><BackLink href="/admin/customers">{t("back")}</BackLink><div className="mb-8 flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow">{t("customerDetail")}</p><h1 className="mt-2 text-3xl font-semibold">{item.fullName ?? item.email}</h1><p className="mt-2 text-sm text-muted-foreground">{item.accountId ?? item.id}</p></div><div className="flex items-center gap-3"><StatusBadge status={item.status} /><Select className="w-32" value={item.status ?? "ACTIVE"} onChange={(event) => void status.mutateAsync({id: customerId, status: event.target.value})}><option value="ACTIVE">ACTIVE</option><option value="LOCKED">LOCKED</option><option value="INACTIVE">INACTIVE</option></Select></div></div><div className="grid gap-6 lg:grid-cols-2"><Card><CardHeader><CardTitle>{t("customerInformation")}</CardTitle></CardHeader><CardContent className="space-y-2 text-sm"><p><strong>{t("email")}:</strong> {item.email ?? "—"}</p><p><strong>{t("phone")}:</strong> {item.phone ?? "—"}</p><p><strong>{t("gender")}:</strong> {item.gender ?? "—"}</p><p><strong>{t("birthday")}:</strong> {item.birthday ?? "—"}</p><p><strong>{t("totalOrders")}:</strong> {item.totalOrders ?? 0}</p><p><strong>{t("totalSpent")}:</strong> {formatMoney(item.totalSpent, "vi")}</p></CardContent></Card><Card><CardHeader><CardTitle>{t("addresses")}</CardTitle></CardHeader><CardContent className="space-y-3">{item.addresses?.length ? item.addresses.map((address, index) => <div key={address.id ?? index} className="rounded-lg border p-3 text-sm"><p className="font-medium">{address.recipientName} {address.default ? `· ${t("defaultAddress")}` : ""}</p><p className="text-muted-foreground">{address.phone} · {address.addressLine}</p></div>) : <p className="text-sm text-muted-foreground">{t("noAddresses")}</p>}</CardContent></Card></div><Card className="mt-6"><CardHeader><CardTitle>{t("customerOrders")}</CardTitle></CardHeader><CardContent>{orders.isPending ? <Loading /> : orders.isError ? <Failure error={orders.error} /> : orders.data?.length ? <div className="space-y-3">{orders.data.map((order, index) => <Link key={order.orderId ?? index} href={order.orderId ? `/admin/orders/${order.orderId}` : "/admin/orders"} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3 text-sm hover:bg-muted"><span>{order.orderId}</span><span className="text-muted-foreground">{order.status} · {formatMoney(order.totalAmount, "vi")}</span></Link>)}</div> : <p className="text-sm text-muted-foreground">{t("noOrders")}</p>}</CardContent></Card><FormError error={status.error} /></div>;
}

export function AdminEmployeeDetailPage({employeeId}: {employeeId: string}) {
  const t = useTranslations("admin");
  const employee = useAdminEmployee(employeeId);
  const roles = useRoles();
  const update = useUpdateAdminEmployee();
  const status = useAdminEmployeeStatus();
  if (employee.isPending) return <Loading />;
  if (employee.isError || !employee.data) return <><BackLink href="/admin/employees">{t("back")}</BackLink><Failure error={employee.error} /></>;
  return <div><BackLink href="/admin/employees">{t("back")}</BackLink><h1 className="mb-8 text-3xl font-semibold">{t("employeeDetail")}</h1><EmployeeForm employee={employee.data} roles={roles.data ?? []} onSubmit={(request) => update.mutateAsync({id: employeeId, request})} loading={update.isPending} error={update.error} status={employee.data.status} onStatus={(next) => status.mutateAsync({id: employeeId, status: next})} /></div>;
}

type EmployeeRequest = BackendSchema["UpdateEmployeeRequest"];
function EmployeeForm({employee, roles, onSubmit, loading, error, status: currentStatus, onStatus}: {employee: BackendSchema["EmployeeDetailResponse"]; roles: BackendSchema["RoleResponse"][]; onSubmit: (request: EmployeeRequest) => Promise<unknown>; loading: boolean; error: unknown; status?: string; onStatus: (status: string) => Promise<unknown>}) {
  const t = useTranslations("admin");
  const defaults = useMemo(() => ({fullName: employee.fullName ?? "", email: employee.email ?? "", phone: employee.phone ?? "", gender: employee.gender ?? "MALE", roleId: employee.roleId ?? "", salary: String(employee.salary ?? 0), joinedAt: employee.joinedAt ?? "", birthday: employee.birthday ?? "", address: employee.address ?? ""}), [employee]);
  const [form, setForm] = useState<typeof defaults | null>(null);
  const value = form ?? defaults;
  function set<K extends keyof typeof defaults>(key: K, next: string) { setForm((current) => ({...(current ?? defaults), [key]: next})); }
  async function submit(event: FormEvent) { event.preventDefault(); await onSubmit({fullName: value.fullName.trim(), roleId: value.roleId, email: value.email.trim() || undefined, phone: value.phone.trim() || undefined, gender: value.gender || undefined, salary: Number(value.salary), joinedAt: value.joinedAt || undefined, birthday: value.birthday || undefined, address: value.address.trim() || undefined}); }
  return <Card><CardHeader><CardTitle>{t("editEmployee")}</CardTitle></CardHeader><CardContent><form className="grid gap-4 sm:grid-cols-2" onSubmit={(event) => void submit(event)}><Field id="employee-name" label={t("fullName")} value={value.fullName} onChange={(next) => set("fullName", next)} required /><Field id="employee-email" label={t("email")} type="email" value={value.email} onChange={(next) => set("email", next)} /><Field id="employee-phone" label={t("phone")} value={value.phone} onChange={(next) => set("phone", next)} /><div className="space-y-2"><Label htmlFor="employee-role">{t("role")}</Label><Select id="employee-role" value={value.roleId} onChange={(event) => set("roleId", event.target.value)} required><option value="">{t("chooseRole")}</option>{roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}</Select></div><div className="space-y-2"><Label htmlFor="employee-gender">{t("gender")}</Label><Select id="employee-gender" value={value.gender} onChange={(event) => set("gender", event.target.value)}><option value="MALE">{t("male")}</option><option value="FEMALE">{t("female")}</option></Select></div><Field id="employee-salary" label={t("salary")} type="number" value={value.salary} onChange={(next) => set("salary", next)} /><Field id="employee-joined" label={t("joinedAt")} type="date" value={value.joinedAt} onChange={(next) => set("joinedAt", next)} /><Field id="employee-birthday" label={t("birthday")} type="date" value={value.birthday} onChange={(next) => set("birthday", next)} /><div className="space-y-2 sm:col-span-2"><Label htmlFor="employee-address">{t("address")}</Label><Textarea id="employee-address" value={value.address} onChange={(event) => set("address", event.target.value)} /></div><div className="flex flex-wrap gap-2 sm:col-span-2"><Button type="submit" disabled={loading}><Save className="size-4" />{t("save")}</Button><Select className="w-32" value={currentStatus ?? "ACTIVE"} onChange={(event) => void onStatus(event.target.value)}><option value="ACTIVE">ACTIVE</option><option value="LOCKED">LOCKED</option><option value="INACTIVE">INACTIVE</option></Select></div><FormError error={error} /></form></CardContent></Card>;
}

export function AdminDiscountDetailPage({discountId}: {discountId: string}) {
  const t = useTranslations("admin");
  const discount = useAdminDiscount(discountId);
  if (discount.isPending) return <Loading />;
  if (discount.isError || !discount.data) return <><BackLink href="/admin/discounts">{t("back")}</BackLink><Failure error={discount.error} /></>;
  return <div><BackLink href="/admin/discounts">{t("back")}</BackLink><h1 className="mb-8 text-3xl font-semibold">{t("discountDetail")}</h1><DiscountForm discount={discount.data} /></div>;
}

function DiscountForm({discount, create = false}: {discount?: BackendSchema["DiscountDetailResponse"]; create?: boolean}) {
  const t = useTranslations("admin");
  const categories = useCategories();
  const update = useUpdateAdminDiscount();
  const remove = useDeleteAdminDiscount();
  const status = useAdminDiscountStatus();
  const defaults = useMemo(() => ({title: discount?.title ?? "", code: discount?.code ?? "", discountType: discount?.discountType ?? "PERCENT", value: String(discount?.value ?? 10), applicationScope: discount?.applicationScope ?? "ORDER", minOrderAmount: String(discount?.minOrderAmount ?? 0), startAt: toDateTimeInput(discount?.startAt), endAt: toDateTimeInput(discount?.endAt), description: discount?.description ?? "", categoryIds: discount?.appliedCategoryIds ?? [], variantIds: discount?.appliedVariants?.flatMap((variant) => variant.id ? [variant.id] : []) ?? []}), [discount]);
  const [form, setForm] = useState<typeof defaults | null>(null);
  const [formError, setFormError] = useState("");
  const value = form ?? defaults;
  function set<K extends keyof typeof defaults>(key: K, next: (typeof defaults)[K]) { setForm((current) => ({...(current ?? defaults), [key]: next})); }
  async function submit(event: FormEvent) {
    event.preventDefault(); setFormError("");
    if ((value.applicationScope === "CATEGORY" && value.categoryIds.length === 0) || (value.applicationScope === "VARIANT" && value.variantIds.length === 0)) { setFormError(t("discountTargetRequired")); return; }
    const request = {title: value.title.trim(), code: value.code.trim() || undefined, discountType: value.discountType, value: Number(value.value), startAt: toIso(value.startAt), endAt: toIso(value.endAt), applicationScope: value.applicationScope, minOrderAmount: Number(value.minOrderAmount), description: value.description.trim() || undefined, appliedCategoryIds: value.applicationScope === "CATEGORY" ? value.categoryIds : [], appliedVariantIds: value.applicationScope === "VARIANT" ? value.variantIds : [], ...(discount && !create ? {status: discount.status} : {})};
    if (discount?.id) await update.mutateAsync({id: discount.id, request});
  }
  return <Card><CardHeader><CardTitle>{create ? t("createDiscount") : t("editDiscount")}</CardTitle><CardDescription>{t("discountTargetDescription")}</CardDescription></CardHeader><CardContent><form className="grid gap-4 sm:grid-cols-2" onSubmit={(event) => void submit(event)}><Field id="discount-title" label={t("titleField")} value={value.title} onChange={(next) => set("title", next)} required /><Field id="discount-code" label={t("code")} value={value.code} onChange={(next) => set("code", next)} /><div className="space-y-2"><Label htmlFor="discount-type">{t("discountType")}</Label><Select id="discount-type" value={value.discountType} onChange={(event) => set("discountType", event.target.value)}><option value="PERCENT">PERCENT</option><option value="FIXED">FIXED</option></Select></div><Field id="discount-value" label={t("value")} type="number" value={value.value} onChange={(next) => set("value", next)} required /><DateTimeField id="discount-start" label={t("startAt")} value={value.startAt} onChange={(next) => set("startAt", next)} required /><DateTimeField id="discount-end" label={t("endAt")} value={value.endAt} onChange={(next) => set("endAt", next)} required /><Field id="discount-min" label={t("minOrderAmount")} type="number" value={value.minOrderAmount} onChange={(next) => set("minOrderAmount", next)} /><div className="space-y-2"><Label htmlFor="discount-scope">{t("applicationScope")}</Label><Select id="discount-scope" value={value.applicationScope} onChange={(event) => set("applicationScope", event.target.value)}><option value="ORDER">ORDER</option><option value="ALL_ITEMS">ALL_ITEMS</option><option value="CATEGORY">CATEGORY</option><option value="VARIANT">VARIANT</option></Select></div>{value.applicationScope === "CATEGORY" ? <div className="space-y-2 sm:col-span-2"><Label htmlFor="discount-categories">{t("targetCategories")}</Label><Select id="discount-categories" multiple value={value.categoryIds} onChange={(event) => set("categoryIds", Array.from(event.target.selectedOptions).map((option) => option.value))} className="min-h-28">{flatten(categories.data ?? []).map((category) => <option key={category.id} value={category.id}>{category.label}</option>)}</Select></div> : null}{value.applicationScope === "VARIANT" ? <div className="space-y-2 sm:col-span-2"><Label htmlFor="discount-variants">{t("targetVariantIds")}</Label><Input id="discount-variants" value={value.variantIds.join(", ")} onChange={(event) => set("variantIds", event.target.value.split(",").map((id) => id.trim()).filter(Boolean))} placeholder="uuid, uuid" /></div> : null}<div className="space-y-2 sm:col-span-2"><Label htmlFor="discount-description">{t("description")}</Label><Textarea id="discount-description" value={value.description} onChange={(event) => set("description", event.target.value)} /></div><div className="flex flex-wrap gap-2 sm:col-span-2"><Button type="submit" disabled={update.isPending || !discount}><Save className="size-4" />{t("save")}</Button>{discount?.id ? <><Select className="w-36" value={discount.status ?? "ACTIVE"} onChange={(event) => void status.mutateAsync({id: discount.id!, status: event.target.value})}><option value="ACTIVE">ACTIVE</option><option value="INACTIVE">INACTIVE</option><option value="DISABLED">DISABLED</option><option value="EXPIRED">EXPIRED</option></Select><Button type="button" variant="destructive" onClick={() => {if (window.confirm(t("confirmDelete"))) void remove.mutateAsync(discount.id!);}}><Trash2 className="size-4" />{t("delete")}</Button></> : null}</div><FormError error={update.error ?? status.error ?? remove.error} formError={formError} /></form></CardContent></Card>;
}

export function AdminOrderDetailPage({orderId}: {orderId: string}) {
  const t = useTranslations("admin");
  const locale = useLocale();
  const order = useAdminOrder(orderId);
  const update = useAdminOrderStatus();
  const invoice = useOrderInvoice(orderId, order.data?.status === "COMPLETED");
  if (order.isPending) return <Loading />;
  if (order.isError || !order.data) return <><BackLink href="/admin/orders">{t("back")}</BackLink><Failure error={order.error} /></>;
  const item = order.data;
  return <div><BackLink href="/admin/orders">{t("back")}</BackLink><div className="mb-8 flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow">{t("orderDetail")}</p><h1 className="mt-2 text-3xl font-semibold">{item.id}</h1><p className="mt-2 text-sm text-muted-foreground">{item.customerName ?? item.customerEmail ?? "—"}</p></div><div className="flex items-center gap-3"><StatusBadge status={item.status} /><Select className="w-52" value={item.status ?? ""} onChange={(event) => void update.mutateAsync({id: orderId, status: event.target.value})}><option value="PENDING_PAYMENT">PENDING_PAYMENT</option><option value="PENDING_CONFIRMATION">PENDING_CONFIRMATION</option><option value="CONFIRMED">CONFIRMED</option><option value="SHIPPING">SHIPPING</option><option value="COMPLETED">COMPLETED</option><option value="CANCELLED">CANCELLED</option></Select></div></div><div className="grid gap-6 lg:grid-cols-[1fr_22rem]"><div className="space-y-6"><Card><CardHeader><CardTitle>{t("items")}</CardTitle></CardHeader><CardContent className="divide-y">{item.items?.map((line, index) => <div key={line.id ?? index} className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"><div><p className="font-medium">{line.productName ?? line.sku ?? "—"}</p><p className="text-sm text-muted-foreground">{line.quantity} × {formatMoney(line.unitPrice, locale)}</p></div><span className="font-medium">{formatMoney(line.totalAmount, locale)}</span></div>)}</CardContent></Card><Card><CardHeader><CardTitle>{t("paymentAttempts")}</CardTitle></CardHeader><CardContent className="space-y-3">{item.payments?.map((payment, index) => <div key={payment.id ?? index} className="flex items-center justify-between rounded-lg border p-3 text-sm"><span>{payment.paymentMethodCode ?? "—"}</span><span className="flex items-center gap-3">{formatMoney(payment.amount, locale)} <StatusBadge status={payment.status} /></span></div>)}</CardContent></Card><Card><CardHeader><CardTitle>{t("invoice")}</CardTitle></CardHeader><CardContent>{item.status !== "COMPLETED" ? <p className="text-sm text-muted-foreground">{t("invoiceUnavailable")}</p> : invoice.isPending ? <div className="h-12 animate-pulse rounded-lg bg-muted" /> : invoice.isError ? <Failure error={invoice.error} /> : invoice.data ? <div className="space-y-2 text-sm"><p><strong>{t("invoiceCode")}:</strong> {invoice.data.invoiceId ?? "—"}</p><p><strong>{t("paymentStatus")}:</strong> {invoice.data.paymentStatus ?? "—"}</p><p>{invoice.data.recipientName} · {invoice.data.recipientPhone}</p><p className="text-muted-foreground">{invoice.data.deliveryAddress}</p><SummaryLine label={t("subtotal")} value={formatMoney(invoice.data.subtotalAmount, locale)} /><SummaryLine label={t("discount")} value={`− ${formatMoney(invoice.data.discountAmount, locale)}`} /><SummaryLine label={t("shippingFee")} value={formatMoney(invoice.data.shippingFee, locale)} /><div className="border-t pt-2"><SummaryLine label={t("total")} value={formatMoney(invoice.data.totalAmount, locale)} strong /></div></div> : <p className="text-sm text-muted-foreground">{t("invoiceUnavailable")}</p>}</CardContent></Card></div><div className="space-y-6"><Card><CardHeader><CardTitle>{t("deliverySnapshot")}</CardTitle></CardHeader><CardContent className="space-y-2 text-sm"><p className="font-medium">{item.recipientName}</p><p>{item.recipientPhone}</p><p className="leading-6 text-muted-foreground">{item.deliveryAddress}</p><p className="pt-2 text-muted-foreground">{item.shippingMethodCode ?? "—"}</p></CardContent></Card><Card><CardHeader><CardTitle>{t("summary")}</CardTitle></CardHeader><CardContent className="space-y-3 text-sm"><SummaryLine label={t("subtotal")} value={formatMoney(item.subtotalAmount, locale)} /><SummaryLine label={t("discount")} value={`− ${formatMoney(item.discountAmount, locale)}`} /><SummaryLine label={t("shippingFee")} value={formatMoney(item.shippingFee, locale)} /><div className="border-t pt-3"><SummaryLine label={t("total")} value={formatMoney(item.totalAmount, locale)} strong /></div></CardContent></Card></div></div><FormError error={update.error} /></div>;
}

function SummaryLine({label, value, strong}: {label: string; value: string; strong?: boolean}) { return <div className={`flex justify-between gap-4 ${strong ? "font-semibold" : ""}`}><span className="text-muted-foreground">{label}</span><span>{value}</span></div>; }

export function AdminSupplierDetailPage({supplierId}: {supplierId: string}) {
  const t = useTranslations("admin");
  const supplier = useAdminSupplier(supplierId);
  const update = useUpdateAdminSupplier();
  const remove = useDeleteAdminSupplier();
  if (supplier.isPending) return <Loading />;
  if (supplier.isError || !supplier.data) return <><BackLink href="/admin/suppliers">{t("back")}</BackLink><Failure error={supplier.error} /></>;
  const item = supplier.data;
  const defaults = {name: item.name ?? "", email: item.email ?? "", phone: item.phone ?? "", address: item.address ?? "", description: item.description ?? "", status: item.status ?? "ACTIVE"};
  return <div><BackLink href="/admin/suppliers">{t("back")}</BackLink><h1 className="mb-8 text-3xl font-semibold">{t("supplierDetail")}</h1><SupplierForm defaults={defaults} onSave={(request) => update.mutateAsync({id: supplierId, request})} loading={update.isPending} error={update.error} onDelete={() => {if (window.confirm(t("confirmDelete"))) void remove.mutateAsync(supplierId);}} deleteError={remove.error} /></div>;
}

function SupplierForm({defaults, onSave, loading, error, onDelete, deleteError}: {defaults: {name: string; email: string; phone: string; address: string; description: string; status: string}; onSave: (request: BackendSchema["UpdateSupplierRequest"]) => Promise<unknown>; loading: boolean; error: unknown; onDelete: () => void; deleteError: unknown}) {
  const t = useTranslations("admin");
  const [form, setForm] = useState(defaults);
  async function submit(event: FormEvent) { event.preventDefault(); await onSave({name: form.name.trim(), email: form.email.trim() || undefined, phone: form.phone.trim() || undefined, address: form.address.trim() || undefined, description: form.description.trim() || undefined, status: form.status}); }
  return <Card><CardHeader><CardTitle>{t("editSupplier")}</CardTitle></CardHeader><CardContent><form className="grid gap-4 sm:grid-cols-2" onSubmit={(event) => void submit(event)}><Field id="supplier-name" label={t("name")} value={form.name} onChange={(next) => setForm((current) => ({...current, name: next}))} required /><Field id="supplier-email" label={t("email")} type="email" value={form.email} onChange={(next) => setForm((current) => ({...current, email: next}))} /><Field id="supplier-phone" label={t("phone")} value={form.phone} onChange={(next) => setForm((current) => ({...current, phone: next}))} /><Field id="supplier-address" label={t("address")} value={form.address} onChange={(next) => setForm((current) => ({...current, address: next}))} /><div className="space-y-2 sm:col-span-2"><Label htmlFor="supplier-description">{t("description")}</Label><Textarea id="supplier-description" value={form.description} onChange={(event) => setForm((current) => ({...current, description: event.target.value}))} /></div><div className="flex gap-2 sm:col-span-2"><Button type="submit" disabled={loading}><Save className="size-4" />{t("save")}</Button><Select className="w-32" value={form.status} onChange={(event) => setForm((current) => ({...current, status: event.target.value}))}><option value="ACTIVE">ACTIVE</option><option value="INACTIVE">INACTIVE</option></Select><Button type="button" variant="destructive" onClick={onDelete}><Trash2 className="size-4" />{t("delete")}</Button></div><FormError error={error ?? deleteError} /></form></CardContent></Card>;
}

export function AdminInvoicesPage() {
  const t = useTranslations("admin");
  const locale = useLocale();
  const [keyword, setKeyword] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [applied, setApplied] = useState({keyword: "", fromDate: "", toDate: ""});
  const invoices = useInvoices({limit: 30, keyword: applied.keyword || undefined, fromDate: applied.fromDate ? `${applied.fromDate}T00:00:00Z` : undefined, toDate: applied.toDate ? `${applied.toDate}T23:59:59Z` : undefined});
  return <div><h1 className="mb-8 text-3xl font-semibold">{t("invoices")}</h1><form className="mb-6 grid gap-3 sm:grid-cols-[1fr_10rem_10rem_auto]" onSubmit={(event) => {event.preventDefault(); setApplied({keyword: keyword.trim(), fromDate, toDate});}}><Input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder={t("searchInvoices")} /><Input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} /><Input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} /><Button type="submit">{t("search")}</Button></form>{invoices.isPending ? <Loading /> : invoices.isError ? <Failure error={invoices.error} /> : <div className="space-y-3">{(invoices.data?.items ?? []).map((invoice, index) => <Card key={invoice.invoiceId ?? invoice.orderId ?? index}><CardContent className="flex flex-wrap items-center justify-between gap-4 p-5"><div><p className="font-semibold">{invoice.invoiceId ?? "—"}</p><p className="mt-1 text-sm text-muted-foreground">{invoice.customerName ?? invoice.recipientName ?? "—"} · {invoice.issuedAt ? new Date(invoice.issuedAt).toLocaleDateString(locale === "vi" ? "vi-VN" : "en-US") : "—"}</p></div><div className="flex items-center gap-4"><span className="font-semibold">{formatMoney(invoice.totalAmount, locale)}</span>{invoice.orderId ? <Link href={`/admin/orders/${invoice.orderId}`} className="inline-flex items-center gap-2 text-sm text-primary hover:underline">{t("view")}</Link> : null}</div></CardContent></Card>)}</div>}</div>;
}

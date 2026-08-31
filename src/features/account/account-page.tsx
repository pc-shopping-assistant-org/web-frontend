"use client";

import {LogOut, Pencil, Plus, Save, ShieldCheck, Trash2, X} from "lucide-react";
import {useTranslations} from "next-intl";
import {useMemo, useState, type FormEvent} from "react";

import {Button} from "@/components/ui/button";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {ErrorMessage} from "@/components/ui/error-message";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Select} from "@/components/ui/select";
import {Textarea} from "@/components/ui/textarea";
import {Link, useRouter} from "@/i18n/navigation";
import type {CustomerAddressRequest} from "@/lib/api/types";

import {useChangePassword, useLogout, useProfile, useRequestChangePasswordOtp, useUpdateProfile} from "@/features/auth/queries";
import {useAddresses, useCreateAddress, useDeleteAddress, useSetDefaultAddress, useUpdateAddress} from "./queries";

type ProfileDraft = {fullName: string; email: string; phone: string; gender: string; birthday: string; address: string};
type AddressDraft = CustomerAddressRequest & {id?: string};

export function AccountPage() {
  const t = useTranslations("account");
  const common = useTranslations("common");
  const router = useRouter();
  const profile = useProfile();
  const addresses = useAddresses();
  const updateProfile = useUpdateProfile();
  const logout = useLogout();
  const [profileDraft, setProfileDraft] = useState<ProfileDraft | null>(null);
  const [addressDraft, setAddressDraft] = useState<AddressDraft | null>(null);

  const profileDefaults = useMemo<ProfileDraft>(() => ({fullName: profile.data?.fullName ?? "", email: profile.data?.email ?? "", phone: profile.data?.phone ?? "", gender: profile.data?.gender ?? "", birthday: profile.data?.birthday ?? "", address: profile.data?.address ?? ""}), [profile.data]);
  const draft = profileDraft ?? profileDefaults;

  async function saveProfile(event: FormEvent) {
    event.preventDefault();
    const saved = await updateProfile.mutateAsync({...draft, email: draft.email || undefined, phone: draft.phone || undefined, gender: draft.gender || undefined, birthday: draft.birthday || undefined, address: draft.address || undefined});
    setProfileDraft({fullName: saved.fullName ?? draft.fullName, email: saved.email ?? draft.email, phone: saved.phone ?? draft.phone, gender: saved.gender ?? draft.gender, birthday: saved.birthday ?? draft.birthday, address: saved.address ?? draft.address});
  }

  async function signOut() {
    try { await logout.mutateAsync(); } finally { router.push("/"); router.refresh(); }
  }

  return <section className="page-wrap py-12 sm:py-16"><div className="mb-10 flex flex-wrap items-end justify-between gap-4"><div className="space-y-3"><p className="eyebrow">{t("profile")}</p><h1 className="text-4xl font-semibold tracking-tight">{t("title")}</h1><p className="text-muted-foreground">{t("description")}</p></div><Button variant="outline" onClick={() => void signOut()} disabled={logout.isPending}><LogOut className="size-4" />{t("logout")}</Button></div>
    {profile.isPending ? <div className="h-60 animate-pulse rounded-2xl bg-muted" /> : profile.isError ? <ErrorMessage error={profile.error} /> : <div className="grid gap-6 lg:grid-cols-[1fr_1fr]"><Card><CardHeader><CardTitle>{t("profile")}</CardTitle><CardDescription>{t("profileDescription")}</CardDescription></CardHeader><CardContent><form className="space-y-4" onSubmit={(event) => void saveProfile(event)}><div className="grid gap-4 sm:grid-cols-2"><Field id="full-name" label={t("fullName")} value={draft.fullName} onChange={(value) => setProfileDraft((current) => ({...(current ?? profileDefaults), fullName: value}))} required /><Field id="email" label={t("email")} type="email" value={draft.email} onChange={(value) => setProfileDraft((current) => ({...(current ?? profileDefaults), email: value}))} /><Field id="phone" label={t("phone")} value={draft.phone} onChange={(value) => setProfileDraft((current) => ({...(current ?? profileDefaults), phone: value}))} /></div><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="gender">{t("gender")}</Label><Select id="gender" value={draft.gender} onChange={(event) => setProfileDraft((current) => ({...(current ?? profileDefaults), gender: event.target.value}))}><option value="">—</option><option value="MALE">{t("male")}</option><option value="FEMALE">{t("female")}</option><option value="OTHER">{t("other")}</option></Select></div><Field id="birthday" label={t("birthday")} type="date" value={draft.birthday} onChange={(value) => setProfileDraft((current) => ({...(current ?? profileDefaults), birthday: value}))} /></div><div className="space-y-2"><Label htmlFor="profile-address">{t("legacyAddress")}</Label><Textarea id="profile-address" value={draft.address} onChange={(event) => setProfileDraft((current) => ({...(current ?? profileDefaults), address: event.target.value}))} /></div>{updateProfile.isError ? <ErrorMessage error={updateProfile.error} /> : null}{updateProfile.isSuccess ? <p className="text-sm text-emerald-700">{t("saved")}</p> : null}<Button type="submit" disabled={updateProfile.isPending}><Save className="size-4" />{updateProfile.isPending ? common("loading") : t("save")}</Button></form></CardContent></Card>
      <div className="space-y-6"><AddressCard addresses={addresses.data ?? []} loading={addresses.isPending} error={addresses.error} onAdd={() => setAddressDraft({recipientName: "", phone: "", addressLine: "", default: false})} onEdit={(address) => setAddressDraft({...address, recipientName: address.recipientName ?? "", phone: address.phone ?? "", addressLine: address.addressLine ?? "", default: address.default ?? false})} /></div>
    </div>}
    <ChangePasswordCard />
    <div className="mt-8 flex flex-wrap gap-3"><Link href="/orders" className="inline-flex h-9 items-center rounded-lg border px-3 text-sm font-medium hover:bg-muted">{t("orders")}</Link><Link href="/cart" className="inline-flex h-9 items-center rounded-lg border px-3 text-sm font-medium hover:bg-muted">{t("cart")}</Link></div>
    {addressDraft ? <AddressDialog draft={addressDraft} onClose={() => setAddressDraft(null)} /> : null}
  </section>;
}

function Field({id, label, value, onChange, type = "text", required}: {id: string; label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean}) { return <div className="space-y-2"><Label htmlFor={id}>{label}</Label><Input id={id} type={type} value={value} onChange={(event) => onChange(event.target.value)} required={required} /></div>; }

function AddressCard({addresses, loading, error, onAdd, onEdit}: {addresses: import("@/lib/api/types").CustomerAddress[]; loading: boolean; error: unknown; onAdd: () => void; onEdit: (address: import("@/lib/api/types").CustomerAddress) => void}) {
  const t = useTranslations("account");
  const create = useCreateAddress();
  const setDefault = useSetDefaultAddress();
  const remove = useDeleteAddress();
  return <Card><CardHeader className="flex-row items-center justify-between"><div><CardTitle>{t("addresses")}</CardTitle><CardDescription>{t("addressesDescription")}</CardDescription></div><Button size="sm" onClick={onAdd}><Plus className="size-4" />{t("addAddress")}</Button></CardHeader><CardContent>{loading ? <div className="h-24 animate-pulse rounded-xl bg-muted" /> : error ? <ErrorMessage error={error} /> : addresses.length === 0 ? <p className="text-sm text-muted-foreground">{t("noAddresses")}</p> : <div className="space-y-3">{addresses.map((address) => <div key={address.id} className="rounded-xl border p-4"><div className="flex items-start justify-between gap-3"><div><div className="flex items-center gap-2"><p className="font-medium">{address.recipientName}</p>{address.default ? <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">{t("defaultAddress")}</span> : null}</div><p className="mt-1 text-sm text-muted-foreground">{address.phone}</p><p className="mt-1 text-sm leading-6">{address.addressLine}</p></div><div className="flex gap-1"><Button size="icon-sm" variant="ghost" aria-label={t("editAddress")} onClick={() => onEdit(address)}><Pencil className="size-4" /></Button><Button size="icon-sm" variant="ghost" className="text-destructive hover:text-destructive" aria-label={t("removeAddress")} onClick={() => address.id && void remove.mutateAsync(address.id)}><Trash2 className="size-4" /></Button></div></div>{!address.default && address.id ? <Button size="sm" variant="outline" className="mt-3" onClick={() => void setDefault.mutateAsync(address.id!)} disabled={setDefault.isPending}><ShieldCheck className="size-4" />{t("makeDefault")}</Button> : null}</div>)}</div>}{create.isError || setDefault.isError || remove.isError ? <div className="mt-4"><ErrorMessage error={create.error ?? setDefault.error ?? remove.error} /></div> : null}</CardContent></Card>;
}

function AddressDialog({draft, onClose}: {draft: AddressDraft; onClose: () => void}) {
  const t = useTranslations("account");
  const create = useCreateAddress();
  const update = useUpdateAddress();
  const [form, setForm] = useState<AddressDraft>(draft);
  const editing = Boolean(draft.id);
  async function submit(event: FormEvent) { event.preventDefault(); const request: CustomerAddressRequest = {recipientName: form.recipientName, phone: form.phone, addressLine: form.addressLine, default: form.default}; if (editing && form.id) await update.mutateAsync({addressId: form.id, request}); else await create.mutateAsync(request); onClose(); }
  const error = create.error ?? update.error;
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"><div className="w-full max-w-lg rounded-2xl border bg-card p-6 shadow-xl"><div className="mb-5 flex items-center justify-between"><h2 className="text-lg font-semibold">{editing ? t("editAddress") : t("addAddress")}</h2><Button variant="ghost" size="icon" onClick={onClose} aria-label={t("close")}><X className="size-4" /></Button></div><form className="space-y-4" onSubmit={(event) => void submit(event)}><Field id="recipient-name" label={t("recipientName")} value={form.recipientName} onChange={(value) => setForm((current) => ({...current, recipientName: value}))} required /><Field id="address-phone" label={t("phone")} value={form.phone} onChange={(value) => setForm((current) => ({...current, phone: value}))} required /><div className="space-y-2"><Label htmlFor="address-line">{t("addressLine")}</Label><Textarea id="address-line" value={form.addressLine} onChange={(event) => setForm((current) => ({...current, addressLine: event.target.value}))} required /></div><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={Boolean(form.default)} onChange={(event) => setForm((current) => ({...current, default: event.target.checked}))} />{t("makeDefault")}</label>{error ? <ErrorMessage error={error} /> : null}<div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={onClose}>{t("cancel")}</Button><Button type="submit" disabled={create.isPending || update.isPending}>{t("save")}</Button></div></form></div></div>;
}

function ChangePasswordCard() {
  const t = useTranslations("account");
  const common = useTranslations("common");
  const requestOtp = useRequestChangePasswordOtp();
  const change = useChangePassword();
  const [values, setValues] = useState({oldPassword: "", newPassword: "", otp: ""});
  async function submit(event: FormEvent) { event.preventDefault(); await change.mutateAsync(values); setValues({oldPassword: "", newPassword: "", otp: ""}); }
  return <Card className="mt-6"><CardHeader><CardTitle>{t("changePassword")}</CardTitle><CardDescription>{t("changePasswordDescription")}</CardDescription></CardHeader><CardContent><form className="grid gap-4 sm:grid-cols-3" onSubmit={(event) => void submit(event)}><Field id="old-password" label={t("oldPassword")} type="password" value={values.oldPassword} onChange={(value) => setValues((current) => ({...current, oldPassword: value}))} required /><Field id="new-password-account" label={t("newPassword")} type="password" value={values.newPassword} onChange={(value) => setValues((current) => ({...current, newPassword: value}))} required /><Field id="change-otp" label={t("otp")} value={values.otp} onChange={(value) => setValues((current) => ({...current, otp: value}))} required /><div className="flex flex-wrap items-center gap-2 sm:col-span-3"><Button type="button" variant="outline" onClick={() => void requestOtp.mutateAsync()} disabled={requestOtp.isPending}>{requestOtp.isPending ? common("loading") : t("sendOtp")}</Button><Button type="submit" disabled={change.isPending}>{change.isPending ? common("loading") : t("changePassword")}</Button></div>{change.isError || requestOtp.isError ? <div className="sm:col-span-3"><ErrorMessage error={change.error ?? requestOtp.error} /></div> : null}{change.isSuccess ? <p className="text-sm text-emerald-700 sm:col-span-3">{t("passwordChanged")}</p> : null}</form></CardContent></Card>;
}

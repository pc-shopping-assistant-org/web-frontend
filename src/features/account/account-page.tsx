"use client";

import {
  KeyRound,
  LoaderCircle,
  LogOut,
  Pencil,
  Plus,
  Save,
  ShieldCheck,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useMemo, useState, type ChangeEvent, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ConfirmAction } from "@/components/ui/confirm-action";
import { ErrorMessage } from "@/components/ui/error-message";
import { AccountPageSkeleton } from "@/components/ui/loading-skeletons";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Link, useRouter } from "@/i18n/navigation";
import { ApiClientError } from "@/lib/api/envelope";
import type {CustomerAddress} from "@/features/account/contracts/responses";
import type {CustomerAddressRequest} from "@/features/account/contracts/requests";
import type {FileResponse} from "@/features/admin/contracts/responses";
import { isStaffRole } from "@/lib/auth/roles";
import {Gender} from "@/lib/domain/account-enums";

import {
  useChangePassword,
  useLogout,
  useProfile,
  useRequestChangePasswordOtp,
  useUpdateProfile,
  useUploadProfileAvatar,
} from "@/features/auth/queries";
import {
  useAddresses,
  useCreateAddress,
  useDeleteAddress,
  useSetDefaultAddress,
  useUpdateAddress,
} from "./queries";

type ProfileDraft = {
  fullName: string;
  email: string;
  phone: string;
  gender: Gender | "";
  birthday: string;
  avatarFileId?: string;
};

type AddressDraft = CustomerAddressRequest & { id?: string };

export function AccountPage() {
  const t = useTranslations("account");
  const nav = useTranslations("nav");
  const common = useTranslations("common");
  const router = useRouter();
  const profile = useProfile();
  const role = profile.data?.role?.toUpperCase();
  const isStaff = isStaffRole(role);
  const addresses = useAddresses(Boolean(profile.data) && !isStaff);
  const updateProfile = useUpdateProfile();
  const logout = useLogout();
  const [profileDraft, setProfileDraft] = useState<ProfileDraft | null>(null);
  const [addressDraft, setAddressDraft] = useState<AddressDraft | null>(null);

  const profileDefaults = useMemo<ProfileDraft>(
    () => ({
      fullName: profile.data?.fullName ?? "",
      email: profile.data?.email ?? "",
      phone: profile.data?.phone ?? "",
      gender: (profile.data?.gender as Gender | undefined) ?? "",
      birthday: profile.data?.birthday ?? "",
      avatarFileId: profile.data?.avatarFileId,
    }),
    [profile.data],
  );
  const draft = profileDraft ?? profileDefaults;

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await updateProfile.mutateAsync({
      ...draft,
      fullName: draft.fullName.trim(),
      email: draft.email.trim() || undefined,
      phone: draft.phone.trim() || undefined,
      gender: draft.gender || undefined,
      birthday: draft.birthday || undefined,
    });
  }

  async function signOut() {
    try {
      await logout.mutateAsync();
    } finally {
      router.push("/");
      router.refresh();
    }
  }

  if (profile.isPending) {
    return <AccountPageSkeleton />;
  }

  const requiresLogin =
    profile.isError &&
    profile.error instanceof ApiClientError &&
    profile.error.status === 401;

  if (profile.isError && !requiresLogin) {
    return (
      <section className="page-wrap py-16">
        <ErrorMessage error={profile.error} />
      </section>
    );
  }

  if (requiresLogin) {
    return (
      <section className="page-wrap py-16">
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <KeyRound className="size-7" />
            </span>
            <h1 className="mt-5 text-2xl font-semibold">{t("loginRequired")}</h1>
            <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              {t("description")}
            </p>
            <Link
              href="/login?redirect=%2Faccount"
              className="mt-6 inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/85"
            >
              {nav("login")}
            </Link>
          </CardContent>
        </Card>
      </section>
    );
  }

  function updateDraft<K extends keyof ProfileDraft>(
    key: K,
    value: ProfileDraft[K],
  ) {
    setProfileDraft((current) => ({
      ...(current ?? profileDefaults),
      [key]: value,
    }));
  }

  return (
    <section className="page-wrap py-12 sm:py-16">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-3">
          <p className="eyebrow">{t("profile")}</p>
          <h1 className="text-4xl font-semibold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground">{t("description")}</p>
        </div>
        <Button
          variant="outline"
          onClick={() => void signOut()}
          disabled={logout.isPending}
        >
          <LogOut className="size-4" />
          {t("logout")}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader>
            <CardTitle>{t("profile")}</CardTitle>
            <CardDescription>{t("profileDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-6"
              onSubmit={(event) => void saveProfile(event)}
            >
              <AvatarPicker
                fileId={draft.avatarFileId}
                onUploaded={(file) => updateDraft("avatarFileId", file.id)}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  id="profile-full-name"
                  label={t("fullName")}
                  value={draft.fullName}
                  onChange={(value) => updateDraft("fullName", value)}
                  required
                />
                <Field
                  id="profile-email"
                  label={t("email")}
                  type="email"
                  value={draft.email}
                  onChange={(value) => updateDraft("email", value)}
                />
                <Field
                  id="profile-phone"
                  label={t("phone")}
                  value={draft.phone}
                  onChange={(value) => updateDraft("phone", value)}
                />
                <div className="space-y-2">
                  <Label htmlFor="profile-gender">{t("gender")}</Label>
                  <Select
                    id="profile-gender"
                    value={draft.gender}
                    onChange={(event) => updateDraft("gender", event.target.value as ProfileDraft["gender"])}
                  >
                    <option value="">—</option>
                    <option value={Gender.Male}>{t("male")}</option>
                    <option value={Gender.Female}>{t("female")}</option>
                    <option value={Gender.Other}>{t("other")}</option>
                  </Select>
                </div>
                <Field
                  id="profile-birthday"
                  label={t("birthday")}
                  type="date"
                  value={draft.birthday}
                  onChange={(value) => updateDraft("birthday", value)}
                />
              </div>
              {updateProfile.isError ? (
                <ErrorMessage error={updateProfile.error} />
              ) : null}
              {updateProfile.isSuccess ? (
                <p className="text-sm text-emerald-700">{t("saved")}</p>
              ) : null}
              <Button
                type="submit"
                disabled={
                  updateProfile.isPending || draft.fullName.trim().length < 2
                }
              >
                <Save className="size-4" />
                {updateProfile.isPending ? common("loading") : t("save")}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <AddressCard
            addresses={addresses.data ?? []}
            loading={addresses.isPending}
            error={addresses.error}
            staff={isStaff}
            onAdd={() =>
              setAddressDraft({
                recipientName: "",
                phone: "",
                addressLine: "",
                default: false,
              })
            }
            onEdit={(address) =>
              setAddressDraft({
                id: address.id,
                recipientName: address.recipientName ?? "",
                phone: address.phone ?? "",
                addressLine: address.addressLine ?? "",
                default: address.default ?? false,
              })
            }
          />
          <ChangePasswordCard />
        </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        {isStaff ? (
          <Link
            href="/admin"
            className="inline-flex h-9 items-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            {t("openAdmin")}
          </Link>
        ) : (
          <>
            <Link
              href="/orders"
              className="inline-flex h-9 items-center rounded-lg border px-3 text-sm font-medium hover:bg-muted"
            >
              {t("orders")}
            </Link>
            <Link
              href="/cart"
              className="inline-flex h-9 items-center rounded-lg border px-3 text-sm font-medium hover:bg-muted"
            >
              {t("cart")}
            </Link>
          </>
        )}
      </div>

      {addressDraft ? (
        <AddressDialog draft={addressDraft} onClose={() => setAddressDraft(null)} />
      ) : null}
    </section>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  type = "text",
  required,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
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
      />
    </div>
  );
}

function AvatarPicker({
  fileId,
  onUploaded,
}: {
  fileId?: string;
  onUploaded: (file: FileResponse) => void;
}) {
  const t = useTranslations("account");
  const upload = useUploadProfileAvatar();
  const [error, setError] = useState<unknown>(null);
  const src = fileId
    ? `/api/backend/files/${encodeURIComponent(fileId)}/content`
    : null;

  async function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setError(null);
    try {
      onUploaded(await upload.mutateAsync(file));
    } catch (cause) {
      setError(cause);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-2xl border bg-muted/20 p-4">
      <div className="relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-primary/10 text-xl font-semibold text-primary">
        {src ? (
          <Image
            src={src}
            alt=""
            fill
            sizes="64px"
            unoptimized
            className="object-cover"
          />
        ) : (
          <span aria-hidden="true">{t("profile").charAt(0)}</span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{t("avatar")}</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          {t("avatarHint")}
        </p>
        <label
          htmlFor="profile-avatar"
          className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-lg border bg-background px-3 py-2 text-xs font-medium transition hover:border-primary/40 hover:bg-primary/5"
        >
          {upload.isPending ? (
            <LoaderCircle className="size-3.5 animate-spin" />
          ) : (
            <Upload className="size-3.5" />
          )}
          {upload.isPending ? t("uploadingAvatar") : t("chooseAvatar")}
        </label>
        <input
          id="profile-avatar"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="sr-only"
          onChange={(event) => void handleChange(event)}
          disabled={upload.isPending}
        />
      </div>
      {error ? (
        <div className="w-full">
          <ErrorMessage error={error} />
        </div>
      ) : null}
    </div>
  );
}

function AddressCard({
  addresses,
  loading,
  error,
  staff,
  onAdd,
  onEdit,
}: {
  addresses: CustomerAddress[];
  loading: boolean;
  error: unknown;
  staff: boolean;
  onAdd: () => void;
  onEdit: (address: CustomerAddress) => void;
}) {
  const t = useTranslations("account");
  const create = useCreateAddress();
  const setDefault = useSetDefaultAddress();
  const remove = useDeleteAddress();

  if (staff) {
    return (
      <Card className="border-primary/20 bg-primary/[0.03]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="size-5 text-primary" />
            {t("staffProfileTitle")}
          </CardTitle>
          <CardDescription>{t("staffProfileDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Link
            href="/admin"
            className="inline-flex h-9 items-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
          >
            {t("openAdmin")}
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-3">
        <div className="min-w-0">
          <CardTitle>{t("addresses")}</CardTitle>
          <CardDescription>{t("addressesDescription")}</CardDescription>
        </div>
        <Button size="sm" onClick={onAdd}>
          <Plus className="size-4" />
          {t("addAddress")}
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-24 rounded-xl" />
        ) : error ? (
          <ErrorMessage error={error} />
        ) : addresses.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("noAddresses")}</p>
        ) : (
          <div className="space-y-3">
            {addresses.map((address) => (
              <div key={address.id} className="rounded-xl border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{address.recipientName}</p>
                      {address.default ? (
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                          {t("defaultAddress")}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{address.phone}</p>
                    <p className="mt-1 text-sm leading-6">{address.addressLine}</p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      aria-label={t("editAddress")}
                      onClick={() => onEdit(address)}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    {address.id ? (
                      <ConfirmAction
                        title={t("confirmRemoveAddressTitle")}
                        description={t("confirmRemoveAddressDescription")}
                        confirmLabel={t("removeAddress")}
                        cancelLabel={t("cancel")}
                        onConfirm={() => remove.mutateAsync(address.id!)}
                        size="icon-sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        ariaLabel={t("removeAddress")}
                      >
                        <Trash2 className="size-4" />
                      </ConfirmAction>
                    ) : null}
                  </div>
                </div>
                {!address.default && address.id ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-3"
                    onClick={() => void setDefault.mutateAsync(address.id!)}
                    disabled={setDefault.isPending}
                  >
                    <ShieldCheck className="size-4" />
                    {t("makeDefault")}
                  </Button>
                ) : null}
              </div>
            ))}
          </div>
        )}
        {create.isError || setDefault.isError || remove.isError ? (
          <div className="mt-4">
            <ErrorMessage error={create.error ?? setDefault.error ?? remove.error} />
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function AddressDialog({
  draft,
  onClose,
}: {
  draft: AddressDraft;
  onClose: () => void;
}) {
  const t = useTranslations("account");
  const create = useCreateAddress();
  const update = useUpdateAddress();
  const [form, setForm] = useState<AddressDraft>(draft);
  const editing = Boolean(draft.id);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const request: CustomerAddressRequest = {
      recipientName: form.recipientName.trim(),
      phone: form.phone.trim(),
      addressLine: form.addressLine.trim(),
      default: form.default,
    };
    if (editing && form.id) {
      await update.mutateAsync({ addressId: form.id, request });
    } else {
      await create.mutateAsync(request);
    }
    onClose();
  }

  const error = create.error ?? update.error;
  const pending = create.isPending || update.isPending;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !pending) onClose();
      }}
    >
      <div
        className="w-full max-w-lg rounded-2xl border bg-card p-6 shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="address-dialog-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 id="address-dialog-title" className="text-lg font-semibold">
            {editing ? t("editAddress") : t("addAddress")}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            disabled={pending}
            aria-label={t("close")}
          >
            <X className="size-4" />
          </Button>
        </div>
        <form className="space-y-4" onSubmit={(event) => void submit(event)}>
          <Field
            id="recipient-name"
            label={t("recipientName")}
            value={form.recipientName}
            onChange={(value) => setForm((current) => ({ ...current, recipientName: value }))}
            required
          />
          <Field
            id="address-phone"
            label={t("phone")}
            value={form.phone}
            onChange={(value) => setForm((current) => ({ ...current, phone: value }))}
            required
          />
          <div className="space-y-2">
            <Label htmlFor="address-line">{t("addressLine")}</Label>
            <Textarea
              id="address-line"
              value={form.addressLine}
              onChange={(event) => setForm((current) => ({ ...current, addressLine: event.target.value }))}
              required
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={Boolean(form.default)}
              onChange={(event) => setForm((current) => ({ ...current, default: event.target.checked }))}
            />
            {t("makeDefault")}
          </label>
          {error ? <ErrorMessage error={error} /> : null}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={pending}>
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? t("saving") : t("save")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ChangePasswordCard() {
  const t = useTranslations("account");
  const common = useTranslations("common");
  const requestOtp = useRequestChangePasswordOtp();
  const change = useChangePassword();
  const [values, setValues] = useState({ oldPassword: "", newPassword: "", otp: "" });
  const passwordReady = /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z]).{8,}$/.test(values.newPassword);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await change.mutateAsync(values);
    setValues({ oldPassword: "", newPassword: "", otp: "" });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("changePassword")}</CardTitle>
        <CardDescription>{t("changePasswordDescription")}</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={(event) => void submit(event)}>
          <Field
            id="old-password"
            label={t("oldPassword")}
            type="password"
            value={values.oldPassword}
            onChange={(value) => setValues((current) => ({ ...current, oldPassword: value }))}
            required
          />
          <Field
            id="new-password-account"
            label={t("newPassword")}
            type="password"
            value={values.newPassword}
            onChange={(value) => setValues((current) => ({ ...current, newPassword: value }))}
            required
          />
          <Field
            id="change-otp"
            label={t("otp")}
            value={values.otp}
            onChange={(value) => setValues((current) => ({ ...current, otp: value.replace(/\D/g, "").slice(0, 6) }))}
            required
          />
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                requestOtp.reset();
                void requestOtp.mutateAsync();
              }}
              disabled={requestOtp.isPending}
            >
              {requestOtp.isPending ? common("loading") : t("sendOtp")}
            </Button>
            <Button
              type="submit"
              disabled={
                change.isPending ||
                values.otp.length !== 6 ||
                !values.oldPassword ||
                !passwordReady
              }
            >
              {change.isPending ? common("loading") : t("changePassword")}
            </Button>
          </div>
          {requestOtp.isSuccess ? (
            <p className="text-sm text-emerald-700">{t("otpSent")}</p>
          ) : null}
          <p className="text-xs leading-5 text-muted-foreground">
            {t("passwordHint")}
          </p>
          {change.isError || requestOtp.isError ? (
            <ErrorMessage error={change.error ?? requestOtp.error} />
          ) : null}
          {change.isSuccess ? (
            <p className="text-sm text-emerald-700">{t("passwordChanged")}</p>
          ) : null}
        </form>
      </CardContent>
    </Card>
  );
}

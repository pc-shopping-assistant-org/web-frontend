"use client";

import {ClipboardList, KeyRound, LoaderCircle, MapPin, Pencil, Plus, Save, ShieldCheck, User, Lock, X} from "lucide-react";
import {useTranslations} from "next-intl";
import {useMemo, useState, type ChangeEvent, type FormEvent, type ReactNode} from "react";

import {Button} from "@/components/ui/button";
import {Card, CardContent} from "@/components/ui/card";
import {ConfirmAction} from "@/components/ui/confirm-action";
import {ErrorMessage} from "@/components/ui/error-message";
import {AccountPageSkeleton} from "@/components/ui/loading-skeletons";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {PersonAvatar} from "@/components/ui/person-avatar";
import {Skeleton} from "@/components/ui/skeleton";
import {Textarea} from "@/components/ui/textarea";
import {Link} from "@/i18n/navigation";
import {ApiClientError} from "@/lib/api/envelope";
import {cn} from "@/lib/utils";
import type {CustomerAddress} from "@/features/account/contracts/responses";
import type {CustomerAddressRequest} from "@/features/account/contracts/requests";
import type {UploadedImage} from "@/features/auth/models";
import {isStaffRole} from "@/lib/auth/roles";
import {Gender} from "@/lib/domain/account-enums";

import {
  useChangePassword,
  useProfile,
  useUpdateProfile,
  useUploadAvatar,
  useVerifyPasswordChange,
} from "@/features/auth/queries";
import {useAddresses, useCreateAddress, useDeleteAddress, useSetDefaultAddress, useUpdateAddress} from "./queries";

type ProfileDraft = {
  firstName: string;
  lastName: string;
  phone: string;
  gender: Gender | "";
  birthday: string;
  avatarFileId?: string;
  avatarUrl?: string;
};

type AddressDraft = CustomerAddressRequest & {id?: string};

type Section = "profile" | "addresses" | "password";

const TAB_PARAM = "tab";

/** The section named by the address of the page, so a link can open the addresses or the password directly. */
function requestedSection(): string | null {
  return typeof window === "undefined" ? null : new URLSearchParams(window.location.search).get(TAB_PARAM);
}

const NAV_ITEM = "flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm transition hover:text-primary";

export function AccountPage() {
  const t = useTranslations("account");
  const nav = useTranslations("nav");
  const common = useTranslations("common");
  const profile = useProfile();
  const role = profile.data?.role?.toUpperCase();
  const isStaff = isStaffRole(role);
  const addresses = useAddresses(Boolean(profile.data) && !isStaff);
  const updateProfile = useUpdateProfile();
  const [profileDraft, setProfileDraft] = useState<ProfileDraft | null>(null);
  const [addressDraft, setAddressDraft] = useState<AddressDraft | null>(null);
  const [requested, setRequested] = useState<string | null>(requestedSection);
  // An employee has no delivery addresses
  const sections: Section[] = isStaff ? ["profile", "password"] : ["profile", "addresses", "password"];
  const section = sections.find((candidate) => candidate === requested) ?? "profile";

  function openSection(next: Section) {
    setRequested(next);
    const url = new URL(window.location.href);
    if (next === "profile") {
      url.searchParams.delete(TAB_PARAM);
    } else {
      url.searchParams.set(TAB_PARAM, next);
    }
    window.history.replaceState(null, "", url);
  }

  const profileDefaults = useMemo<ProfileDraft>(
    () => ({
      firstName: profile.data?.firstName ?? "",
      lastName: profile.data?.lastName ?? "",
      phone: profile.data?.phone ?? "",
      gender: (profile.data?.gender as Gender | undefined) ?? "",
      birthday: profile.data?.birthday ?? "",
      avatarFileId: profile.data?.avatarFileId,
      avatarUrl: profile.data?.avatarUrl,
    }),
    [profile.data],
  );
  const draft = profileDraft ?? profileDefaults;

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await updateProfile
      .mutateAsync({
        firstName: draft.firstName.trim(),
        lastName: draft.lastName.trim(),
        phone: draft.phone.trim() || undefined,
        gender: draft.gender || undefined,
        birthday: draft.birthday || undefined,
        avatarFileId: draft.avatarFileId,
      })
      .catch(() => undefined);
  }

  if (profile.isPending) {
    return <AccountPageSkeleton />;
  }

  const requiresLogin = profile.isError && profile.error instanceof ApiClientError && profile.error.status === 401;

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
            <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">{t("description")}</p>
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

  function updateDraft<K extends keyof ProfileDraft>(key: K, value: ProfileDraft[K]) {
    setProfileDraft((current) => ({
      ...(current ?? profileDefaults),
      [key]: value,
    }));
  }

  const hasPassword = profile.data?.hasPassword ?? true;
  const displayName = profile.data?.fullName ?? profile.data?.email ?? nav("account");
  const person = {avatarUrl: profile.data?.avatarUrl, firstName: profile.data?.firstName || displayName};
  const heading: Record<Section, {title: string; description: string}> = {
    profile: {title: t("profile"), description: t("profileDescription")},
    addresses: {title: t("addresses"), description: t("addressesDescription")},
    password: {title: t("changePassword"), description: hasPassword ? t("changePasswordDescription") : t("setPasswordDescription")},
  };
  const sectionIcon: Record<Section, ReactNode> = {
    profile: <User className="size-4" aria-hidden="true" />,
    addresses: <MapPin className="size-4" aria-hidden="true" />,
    password: <Lock className="size-4" aria-hidden="true" />,
  };

  return (
    <section className="page-wrap py-6 sm:py-10">
      <div className="grid gap-5 lg:grid-cols-[15rem_minmax(0,1fr)] lg:items-start lg:gap-8">
        <aside className="min-w-0">
          <div className="flex items-center gap-3 pb-4 lg:border-b lg:pb-5">
            <PersonAvatar person={person} className="size-12 text-lg" />
            <div className="min-w-0">
              <p title={displayName} className="truncate text-sm font-semibold">
                {displayName}
              </p>
              <button
                type="button"
                onClick={() => openSection("profile")}
                className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground transition hover:text-primary"
              >
                <Pencil className="size-3" aria-hidden="true" />
                {t("editProfile")}
              </button>
            </div>
          </div>

          <nav aria-label={nav("myAccount")} className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0 lg:pt-4">
            <p className="hidden items-center gap-2 px-3 pb-1 text-sm font-semibold lg:flex">
              <User className="size-4 text-primary" aria-hidden="true" />
              {nav("myAccount")}
            </p>
            {sections.map((item) => (
              <button
                key={item}
                type="button"
                aria-current={item === section ? "page" : undefined}
                onClick={() => openSection(item)}
                className={cn(
                  NAV_ITEM,
                  "lg:pl-9",
                  item === section ? "bg-primary/10 font-medium text-primary" : "text-muted-foreground",
                )}
              >
                <span className="lg:hidden">{sectionIcon[item]}</span>
                {heading[item].title}
              </button>
            ))}
            {!isStaff ? (
              <Link href="/orders" className={cn(NAV_ITEM, "text-muted-foreground lg:mt-1 lg:font-semibold lg:text-foreground")}>
                <ClipboardList className="size-4 lg:text-primary" aria-hidden="true" />
                {nav("myOrders")}
              </Link>
            ) : (
              <Link href="/admin" className={cn(NAV_ITEM, "font-medium text-primary lg:mt-1")}>
                <ShieldCheck className="size-4" aria-hidden="true" />
                {t("openAdmin")}
              </Link>
            )}
          </nav>
        </aside>

        <main className="min-w-0 rounded-xl border bg-card">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4 sm:px-8 sm:py-5">
            <div className="min-w-0">
              <h1 className="text-lg font-semibold">{heading[section].title}</h1>
              <p className="mt-1 text-sm text-muted-foreground">{heading[section].description}</p>
            </div>
            {section === "addresses" ? (
              <Button
                size="sm"
                onClick={() =>
                  setAddressDraft({
                    recipientName: "",
                    phone: "",
                    addressLine: "",
                    default: false,
                  })
                }
              >
                <Plus className="size-4" />
                {t("addAddress")}
              </Button>
            ) : null}
          </div>

          <div className="px-5 py-6 sm:px-8 sm:py-8">
            {section === "profile" ? (
              <form className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_15rem]" onSubmit={(event) => void saveProfile(event)}>
                <div className="space-y-5">
                  <FormRow label={t("email")}>
                    <p className="break-all text-sm">{profile.data?.email}</p>
                  </FormRow>
                  <FormRow label={t("lastName")} htmlFor="profile-last-name">
                    <Input
                      id="profile-last-name"
                      value={draft.lastName}
                      onChange={(event) => updateDraft("lastName", event.target.value)}
                      required
                      className="max-w-md"
                    />
                  </FormRow>
                  <FormRow label={t("firstName")} htmlFor="profile-first-name">
                    <Input
                      id="profile-first-name"
                      value={draft.firstName}
                      onChange={(event) => updateDraft("firstName", event.target.value)}
                      required
                      className="max-w-md"
                    />
                  </FormRow>
                  <FormRow label={t("phone")} htmlFor="profile-phone">
                    <Input
                      id="profile-phone"
                      value={draft.phone}
                      onChange={(event) => updateDraft("phone", event.target.value)}
                      className="max-w-md"
                    />
                    {profile.data && !profile.data.phone ? (
                      <p className="mt-2 max-w-md text-xs leading-5 text-muted-foreground">{t("phoneMissingHint")}</p>
                    ) : null}
                  </FormRow>
                  <FormRow label={t("gender")}>
                    <div role="radiogroup" aria-label={t("gender")} className="flex flex-wrap items-center gap-x-5 gap-y-2">
                      {[
                        {value: Gender.Male, label: t("male")},
                        {value: Gender.Female, label: t("female")},
                        {value: Gender.Other, label: t("other")},
                      ].map((option) => (
                        <label key={option.value} className="inline-flex cursor-pointer items-center gap-2 text-sm">
                          <input
                            type="radio"
                            name="profile-gender"
                            value={option.value}
                            checked={draft.gender === option.value}
                            onChange={() => updateDraft("gender", option.value)}
                            className="size-4 accent-primary"
                          />
                          {option.label}
                        </label>
                      ))}
                    </div>
                  </FormRow>
                  <FormRow label={t("birthday")} htmlFor="profile-birthday">
                    <Input
                      id="profile-birthday"
                      type="date"
                      value={draft.birthday}
                      onChange={(event) => updateDraft("birthday", event.target.value)}
                      className="max-w-md"
                    />
                  </FormRow>
                  <FormRow>
                    <div className="space-y-3">
                      {updateProfile.isError ? <ErrorMessage error={updateProfile.error} /> : null}
                      {updateProfile.isSuccess ? <p className="text-sm text-emerald-700">{t("saved")}</p> : null}
                      <Button type="submit" disabled={updateProfile.isPending || !draft.firstName.trim() || !draft.lastName.trim()}>
                        <Save className="size-4" />
                        {updateProfile.isPending ? common("loading") : t("save")}
                      </Button>
                    </div>
                  </FormRow>
                </div>
                <AvatarPicker
                  person={{avatarUrl: draft.avatarUrl, firstName: draft.firstName || displayName}}
                  onUploaded={(image) =>
                    setProfileDraft((current) => ({...(current ?? profileDefaults), avatarFileId: image.id, avatarUrl: image.url}))
                  }
                />
              </form>
            ) : null}

            {section === "addresses" ? (
              <AddressList
                addresses={addresses.data ?? []}
                loading={addresses.isPending}
                error={addresses.error}
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
            ) : null}

            {section === "password" ? <ChangePasswordForm hasPassword={hasPassword} /> : null}
          </div>
        </main>
      </div>

      {addressDraft ? <AddressDialog draft={addressDraft} onClose={() => setAddressDraft(null)} /> : null}
    </section>
  );
}

/** One line of a form: the label on the left from the small breakpoint up, above the input before that; without a label it aligns with the inputs. */
function FormRow({label, htmlFor, children}: {label?: string; htmlFor?: string; children: ReactNode}) {
  return (
    <div className="grid gap-2 sm:grid-cols-[8.5rem_minmax(0,1fr)] sm:items-start sm:gap-6">
      {label ? (
        <Label htmlFor={htmlFor} className="font-normal text-muted-foreground sm:pt-2.5 sm:text-right">
          {label}
        </Label>
      ) : (
        <span className="hidden sm:block" aria-hidden="true" />
      )}
      <div className="min-w-0 sm:pt-0.5">{children}</div>
    </div>
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
      <Input id={id} type={type} value={value} onChange={(event) => onChange(event.target.value)} required={required} />
    </div>
  );
}

function AvatarPicker({person, onUploaded}: {person: {avatarUrl?: string; firstName: string}; onUploaded: (image: UploadedImage) => void}) {
  const t = useTranslations("account");
  const upload = useUploadAvatar();
  const [error, setError] = useState<unknown>(null);

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
    <div className="order-first flex flex-col items-center gap-4 border-b pb-6 text-center lg:order-last lg:border-b-0 lg:border-l lg:pb-0 lg:pl-8">
      <PersonAvatar person={person} className="size-28 text-4xl" />
      <label
        htmlFor="profile-avatar"
        className="inline-flex cursor-pointer items-center gap-2 rounded-lg border bg-background px-4 py-2 text-sm font-medium transition hover:border-primary/40 hover:bg-primary/5"
      >
        {upload.isPending ? <LoaderCircle className="size-4 animate-spin" /> : null}
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
      <p className="text-xs leading-5 text-muted-foreground">{t("avatarHint")}</p>
      {error ? <ErrorMessage error={error} /> : null}
    </div>
  );
}

function AddressList({
  addresses,
  loading,
  error,
  onEdit,
}: {
  addresses: CustomerAddress[];
  loading: boolean;
  error: unknown;
  onEdit: (address: CustomerAddress) => void;
}) {
  const t = useTranslations("account");
  const create = useCreateAddress();
  const setDefault = useSetDefaultAddress();
  const remove = useDeleteAddress();

  return (
    <div>
      {loading ? (
        <Skeleton className="h-24 rounded-xl" />
      ) : error ? (
        <ErrorMessage error={error} />
      ) : addresses.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">{t("noAddresses")}</p>
      ) : (
        <ul className="divide-y">
          {addresses.map((address) => (
            <li key={address.id} className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3 py-5 first:pt-0 last:pb-0">
              <div className="min-w-0 flex-1 basis-64 space-y-1">
                <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="font-medium">{address.recipientName}</span>
                  <span className="text-sm text-muted-foreground">{address.phone}</span>
                </p>
                <p className="text-sm leading-6 text-muted-foreground">{address.addressLine}</p>
                {address.default ? (
                  <span className="mt-1 inline-block rounded border border-primary/40 px-2 py-0.5 text-xs font-medium text-primary">
                    {t("defaultAddress")}
                  </span>
                ) : null}
              </div>
              <div className="flex shrink-0 flex-col items-end gap-2">
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="ghost" className="text-primary hover:text-primary" onClick={() => onEdit(address)}>
                    {t("editAddress")}
                  </Button>
                  {address.id ? (
                    <ConfirmAction
                      title={t("confirmRemoveAddressTitle")}
                      description={t("confirmRemoveAddressDescription")}
                      confirmLabel={t("removeAddress")}
                      cancelLabel={t("cancel")}
                      onConfirm={() => remove.mutateAsync(address.id!)}
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      ariaLabel={t("removeAddress")}
                    >
                      {t("removeAddress")}
                    </ConfirmAction>
                  ) : null}
                </div>
                {!address.default && address.id ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void setDefault.mutateAsync(address.id!).catch(() => undefined)}
                    disabled={setDefault.isPending}
                  >
                    {t("makeDefault")}
                  </Button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
      {create.isError || setDefault.isError || remove.isError ? (
        <div className="mt-4">
          <ErrorMessage error={create.error ?? setDefault.error ?? remove.error} />
        </div>
      ) : null}
    </div>
  );
}

function AddressDialog({draft, onClose}: {draft: AddressDraft; onClose: () => void}) {
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
    try {
      if (editing && form.id) {
        await update.mutateAsync({addressId: form.id, request});
      } else {
        await create.mutateAsync(request);
      }
    } catch {
      return;
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
          <Button variant="ghost" size="icon" onClick={onClose} disabled={pending} aria-label={t("close")}>
            <X className="size-4" />
          </Button>
        </div>
        <form className="space-y-4" onSubmit={(event) => void submit(event)}>
          <Field
            id="recipient-name"
            label={t("recipientName")}
            value={form.recipientName}
            onChange={(value) => setForm((current) => ({...current, recipientName: value}))}
            required
          />
          <Field
            id="address-phone"
            label={t("phone")}
            value={form.phone}
            onChange={(value) => setForm((current) => ({...current, phone: value}))}
            required
          />
          <div className="space-y-2">
            <Label htmlFor="address-line">{t("addressLine")}</Label>
            <Textarea
              id="address-line"
              value={form.addressLine}
              onChange={(event) => setForm((current) => ({...current, addressLine: event.target.value}))}
              required
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={Boolean(form.default)}
              onChange={(event) => setForm((current) => ({...current, default: event.target.checked}))}
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

function ChangePasswordForm({hasPassword}: {hasPassword: boolean}) {
  const t = useTranslations("account");
  const common = useTranslations("common");
  const change = useChangePassword();
  const confirm = useVerifyPasswordChange();
  const [values, setValues] = useState({currentPassword: "", newPassword: ""});
  const [otp, setOtp] = useState("");
  const passwordReady = /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z]).{8,}$/.test(values.newPassword);
  const awaitingOtp = change.isSuccess && !confirm.isSuccess;

  async function requestOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    confirm.reset();
    setOtp("");
    await change.mutateAsync(hasPassword ? values : {newPassword: values.newPassword}).catch(() => undefined);
  }

  async function submitOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      await confirm.mutateAsync({otp});
    } catch {
      return;
    }
    setValues({currentPassword: "", newPassword: ""});
    setOtp("");
    change.reset();
  }

  if (awaitingOtp) {
    return (
      <form method="post" className="space-y-5" onSubmit={(event) => void submitOtp(event)}>
        <FormRow>
          <p className="text-sm text-emerald-700">{t("otpSent")}</p>
        </FormRow>
        <FormRow label={t("otp")} htmlFor="change-otp">
          <Input
            id="change-otp"
            value={otp}
            inputMode="numeric"
            onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
            required
            className="max-w-md"
          />
        </FormRow>
        <FormRow>
          <div className="space-y-3">
            {confirm.isError ? <ErrorMessage error={confirm.error} /> : null}
            <div className="flex flex-wrap items-center gap-2">
              <Button type="submit" disabled={confirm.isPending || otp.length !== 6}>
                {confirm.isPending ? common("loading") : t("confirmChange")}
              </Button>
              <Button type="button" variant="outline" onClick={() => change.reset()} disabled={confirm.isPending}>
                {t("cancel")}
              </Button>
            </div>
          </div>
        </FormRow>
      </form>
    );
  }

  return (
    <form method="post" className="space-y-5" onSubmit={(event) => void requestOtp(event)}>
      {hasPassword ? (
        <FormRow label={t("oldPassword")} htmlFor="old-password">
          <Input
            id="old-password"
            type="password"
            value={values.currentPassword}
            onChange={(event) => setValues((current) => ({...current, currentPassword: event.target.value}))}
            required
            className="max-w-md"
          />
        </FormRow>
      ) : null}
      <FormRow label={t("newPassword")} htmlFor="new-password-account">
        <Input
          id="new-password-account"
          type="password"
          value={values.newPassword}
          onChange={(event) => setValues((current) => ({...current, newPassword: event.target.value}))}
          required
          className="max-w-md"
        />
        <p className="mt-2 max-w-md text-xs leading-5 text-muted-foreground">{t("passwordHint")}</p>
      </FormRow>
      <FormRow>
        <div className="space-y-3">
          {change.isError ? <ErrorMessage error={change.error} /> : null}
          {confirm.isSuccess ? <p className="text-sm text-emerald-700">{t("passwordChanged")}</p> : null}
          <Button type="submit" disabled={change.isPending || (hasPassword && !values.currentPassword) || !passwordReady}>
            {change.isPending ? common("loading") : t("sendOtp")}
          </Button>
        </div>
      </FormRow>
    </form>
  );
}

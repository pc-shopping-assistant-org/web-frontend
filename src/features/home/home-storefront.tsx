"use client";

import {
  IconArrowRight,
  IconArrowUpRight,
  IconArrowsLeftRight,
  IconChevronRight,
  IconCircleCheck,
  IconClipboardList,
  IconCpu,
  IconDeviceGamepad2,
  IconDeviceLaptop,
  IconDesk,
  IconLayoutGrid,
  IconLayoutDashboard,
  IconMessageCircle,
  IconRobot,
  IconSearch,
  IconShoppingCart,
  IconSparkles,
  IconTags,
  IconTruckDelivery,
  IconUserCircle,
} from "@tabler/icons-react";
import {useLocale, useTranslations} from "next-intl";
import Image from "next/image";

import {Badge} from "@/components/ui/badge";
import {Card, CardContent} from "@/components/ui/card";
import {Skeleton} from "@/components/ui/skeleton";
import {Link} from "@/i18n/navigation";
import type {CategoryTree, ProductSummary} from "@/features/catalog/contracts/responses";
import {formatMoney, formatRating} from "@/lib/format";
import {cn} from "@/lib/utils";
import {isStaffRole} from "@/lib/auth/roles";
import {ResourceStatus} from "@/lib/domain/catalog-enums";

import {useProfile} from "@/features/auth/queries";
import {useCategories, useProducts} from "@/features/catalog/queries";
import {CatalogCategoryIcon} from "@/features/catalog/components/catalog-category-icon";
import {FeaturedProducts} from "@/features/catalog/components/featured-products";
import {HomeSearch} from "./home-search";

export function HomeStorefront() {
  const t = useTranslations("home");
  const profile = useProfile();
  const categories = useCategories();
  const products = useProducts({limit: 100});
  const isStaff = isStaffRole(profile.data?.role);
  const categoryLinks = getActiveCategories(categories.data ?? []);
  const featuredProducts = products.data?.items ?? [];
  const categoryCounts = getCategoryCounts(featuredProducts, categories.data ?? []);

  return (
    <section className="border-b bg-[radial-gradient(circle_at_10%_0%,rgba(34,211,238,.11),transparent_28rem),radial-gradient(circle_at_92%_8%,rgba(99,102,241,.09),transparent_30rem)]">
      <div className="storefront-wrap py-8 sm:py-12">
        <HomeUtilityNav isStaff={isStaff} />
        <div className="mb-6 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-2xl space-y-3">
            <Badge className="gap-2 border-primary/20 bg-primary/5 px-3 py-1.5 text-primary">
              <IconSparkles className="size-3.5" aria-hidden="true" />
              {t("eyebrow")}
            </Badge>
            <h1 className="text-3xl font-semibold leading-[1.08] tracking-[-0.045em] sm:text-4xl lg:text-5xl">{t("title")}</h1>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">{t("description")}</p>
          </div>
          <div className="w-full xl:max-w-2xl 2xl:max-w-3xl">
            <HomeSearch />
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[clamp(17rem,19vw,22rem)_minmax(0,1fr)] xl:grid-cols-[clamp(17rem,19vw,22rem)_minmax(0,1fr)_clamp(17rem,20vw,22rem)]">
          <CategoryMenu categories={categoryLinks} counts={categoryCounts} pending={categories.isPending} error={categories.isError} />
          <FeaturedSpotlight product={featuredProducts[0]} pending={products.isPending} unavailable={products.isError} />
          <div className="grid gap-4 sm:grid-cols-2 lg:col-span-2 xl:col-span-1 xl:grid-cols-1">
            {products.isPending ? (
              Array.from({length: 2}, (_, index) => <Skeleton key={index} className="min-h-36 rounded-2xl" />)
            ) : featuredProducts.slice(1, 3).map((product, index) => <SideProductCard key={product.id ?? index} product={product} index={index} />)}
            {!products.isPending && featuredProducts.length <= 1 ? <CatalogFallback unavailable={products.isError} /> : null}
            <div className="sm:col-span-2 xl:col-span-1"><AssistantTile /></div>
          </div>
        </div>

        <PopularProductRail
          products={featuredProducts.slice(0, 4)}
          pending={products.isPending}
          unavailable={products.isError}
        />

        {/* Keep the decision path above the long catalog so the primary
            compare/consult/cart use cases are visible before the customer
            starts browsing a large result set. */}
        <FinderFlow isStaff={isStaff} />

        <StorefrontQuickActions isStaff={isStaff} />

        <section className="mt-12 border-t border-border/60 pt-10" aria-labelledby="featured-products-title">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl space-y-1.5">
              <p className="eyebrow">{t("featuredEyebrow")}</p>
              <h2 id="featured-products-title" className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("catalogTitle")}</h2>
              <p className="text-sm leading-6 text-muted-foreground">{t("featuredDescription")}</p>
            </div>
            <Link href="/products" className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-primary hover:underline">
              {t("browseAllProducts")}
              <IconArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
          <FeaturedProducts />
        </section>

        <CategoryExplorer categories={categoryLinks} counts={categoryCounts} pending={categories.isPending} error={categories.isError} />
        <ShopByGoal />

        <div className="mt-4 grid gap-px overflow-hidden rounded-2xl border bg-border sm:grid-cols-4">
          <TrustItem icon={IconCircleCheck} title={t("trustCatalog")} description={t("trustCatalogDescription")} />
          <TrustItem icon={IconTags} title={t("trustPricing")} description={t("trustPricingDescription")} />
          <TrustItem icon={IconTruckDelivery} title={t("trustDelivery")} description={t("trustDeliveryDescription")} />
          <TrustItem icon={IconMessageCircle} title={t("trustSupport")} description={t("trustSupportDescription")} />
        </div>
      </div>
    </section>
  );
}

function ShopByGoal() {
  const t = useTranslations("home");
  const goals = [
    {key: "gaming", href: "/products?keyword=gaming", icon: IconDeviceGamepad2, tone: "from-violet-500/15 to-fuchsia-500/5 text-violet-700"},
    {key: "work", href: "/products?keyword=laptop", icon: IconDeviceLaptop, tone: "from-sky-500/15 to-cyan-500/5 text-sky-700"},
    {key: "creator", href: "/products?keyword=creator", icon: IconDesk, tone: "from-amber-500/15 to-orange-500/5 text-amber-700"},
    {key: "build", href: "/assistant?mode=CONSULT", icon: IconCpu, tone: "from-emerald-500/15 to-teal-500/5 text-emerald-700"},
  ] as const;

  return (
    <section className="mt-9" aria-labelledby="shop-by-goal-title">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">{t("goalEyebrow")}</p>
          <h2 id="shop-by-goal-title" className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">{t("goalTitle")}</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">{t("goalDescription")}</p>
        </div>
        <Link href="/assistant?mode=CONSULT" className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-primary hover:underline">
          {t("talkToAssistant")}
          <IconArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {goals.map(({key, href, icon: Icon, tone}) => (
          <Link key={key} href={href} className="group">
            <Card className={cn("h-full overflow-hidden border-border/70 bg-gradient-to-br transition duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md", tone)}>
              <CardContent className="flex min-h-32 items-center gap-4 p-5">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-background/80 shadow-sm transition group-hover:scale-105">
                  <Icon className="size-6" strokeWidth={1.7} aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block text-base font-semibold text-foreground">{t(`goal.${key}.title`)}</span>
                  <span className="mt-1 block text-sm leading-5 text-muted-foreground">{t(`goal.${key}.description`)}</span>
                  <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary">{t("exploreCategory")}<IconArrowUpRight className="size-3.5 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></span>
                </span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}

function FinderFlow({isStaff}: {isStaff: boolean}) {
  const t = useTranslations("home");
  const steps = [
    {icon: IconSearch, title: t("finderStepSearch"), href: "/products" as const},
    {icon: IconArrowsLeftRight, title: t("finderStepCompare"), href: "/assistant?mode=COMPARE" as const},
    isStaff
      ? {icon: IconClipboardList, title: t("finderStepAdminOrders"), href: "/admin/orders" as const}
      : {icon: IconShoppingCart, title: t("finderStepOrder"), href: "/cart" as const},
  ];

  return (
    <section className="relative mt-9 overflow-hidden rounded-[2rem] bg-slate-950 p-5 text-white shadow-xl shadow-slate-950/10 sm:p-7" aria-labelledby="finder-flow-title">
      <div className="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full bg-blue-500/20 blur-3xl" />
      <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{t("finderEyebrow")}</p>
          <h2 id="finder-flow-title" className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("finderTitle")}</h2>
          <p className="text-sm leading-6 text-slate-300">{t("finderDescription")}</p>
        </div>
        <Link href="/assistant?mode=CONSULT" className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-slate-100">
          {t("finderCta")}
          <IconArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
      <div className="relative mt-6 grid gap-3 md:grid-cols-3">
        {steps.map(({icon: Icon, title, href}, index) => (
          <Link key={href} href={href} className="group rounded-2xl border border-white/10 bg-white/7 p-4 transition hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/12">
            <div className="flex items-center justify-between gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-white/10 text-cyan-200"><Icon className="size-5" aria-hidden="true" /></span>
              <span className="text-xs font-semibold tracking-[0.16em] text-slate-500">0{index + 1}</span>
            </div>
            <p className="mt-5 text-sm font-semibold leading-5 text-white">{title}</p>
            <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-cyan-200">{t("exploreCategory")}<IconArrowUpRight className="size-3.5 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function StorefrontQuickActions({isStaff}: {isStaff: boolean}) {
  const t = useTranslations("home");
  const actions = [
    {
      href: "/products" as const,
      icon: IconLayoutGrid,
      title: t("quickAction.catalogTitle"),
      description: t("quickAction.catalogDescription"),
      tone: "bg-sky-50 text-sky-700",
    },
    {
      href: "/assistant?mode=SEARCH" as const,
      icon: IconSearch,
      title: t("quickAction.searchTitle"),
      description: t("quickAction.searchDescription"),
      tone: "bg-cyan-50 text-cyan-700",
    },
    {
      href: "/assistant?mode=COMPARE" as const,
      icon: IconArrowsLeftRight,
      title: t("quickAction.compareTitle"),
      description: t("quickAction.compareDescription"),
      tone: "bg-violet-50 text-violet-700",
    },
    {
      href: "/assistant?mode=CONSULT" as const,
      icon: IconRobot,
      title: t("quickAction.assistantTitle"),
      description: t("quickAction.assistantDescription"),
      tone: "bg-emerald-50 text-emerald-700",
    },
    isStaff
      ? {
          href: "/admin/orders" as const,
          icon: IconLayoutDashboard,
          title: t("quickAction.adminOrdersTitle"),
          description: t("quickAction.adminOrdersDescription"),
          tone: "bg-amber-50 text-amber-700",
        }
      : {
          href: "/orders" as const,
          icon: IconClipboardList,
          title: t("quickAction.ordersTitle"),
          description: t("quickAction.ordersDescription"),
          tone: "bg-amber-50 text-amber-700",
        },
    {
      href: "/account" as const,
      icon: IconUserCircle,
      title: t("quickAction.accountTitle"),
      description: t("quickAction.accountDescription"),
      tone: "bg-rose-50 text-rose-700",
    },
  ];

  return (
    <section className="mt-6" aria-label={t("quickActionsTitle")}>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {actions.map(({href, icon: Icon, title, description, tone}) => (
          <Link key={href} href={href} className="group">
            <Card className="h-full rounded-2xl border-border/70 bg-background/80 transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md">
              <CardContent className="flex items-center gap-3 p-4">
                <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", tone)}>
                  <Icon className="size-5" strokeWidth={1.8} aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">{title}</span>
                  <span className="mt-0.5 block truncate text-xs text-muted-foreground">{description}</span>
                </span>
                <IconArrowUpRight className="size-4 shrink-0 text-muted-foreground transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" aria-hidden="true" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}

function PopularProductRail({
  products,
  pending,
  unavailable,
}: {
  products: ProductSummary[];
  pending: boolean;
  unavailable: boolean;
}) {
  const t = useTranslations("home");
  const locale = useLocale();

  if (pending) {
    return (
      <section className="mt-9" aria-label={t("popularTitle")}>
        <div className="mb-4 h-8 w-64 animate-pulse rounded-lg bg-muted" />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({length: 4}, (_, index) => <Skeleton key={index} className="h-28 rounded-2xl" />)}
        </div>
      </section>
    );
  }
  if (unavailable || products.length === 0) return null;

  return (
    <section className="mt-9" aria-labelledby="popular-products-title">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">{t("popularEyebrow")}</p>
          <h2 id="popular-products-title" className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">{t("popularTitle")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("popularDescription")}</p>
        </div>
        <Link href="/products" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
          {t("browseAllProducts")}
          <IconArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {products.map((product, index) => {
          const name = product.name ?? t("productUnavailable");
          const href = product.seoName ? `/products/${encodeURIComponent(product.seoName)}` : "/products";
          return (
            <Link key={product.id ?? product.seoName ?? index} href={href} className="group">
              <Card className="h-full rounded-2xl border-border/70 bg-background transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md">
                <CardContent className="flex items-center gap-3 p-3.5">
                  <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted/50 p-1">
                    <ProductArtwork product={product} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{product.brandName ?? product.categoryName ?? "gearPC"}</p>
                    <h3 className="mt-1 line-clamp-2 text-sm font-semibold leading-5 group-hover:text-primary">{name}</h3>
                    <p className="mt-2 text-sm font-semibold">{formatMoney(product.minPrice ?? product.maxPrice, locale)}</p>
                  </div>
                  <IconArrowUpRight className="size-4 shrink-0 text-muted-foreground transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" aria-hidden="true" />
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function CategoryExplorer({categories, counts, pending, error}: {categories: {id: string; name: string}[]; counts: Map<string, number>; pending: boolean; error: boolean}) {
  const t = useTranslations("home");

  if (error || (!pending && categories.length === 0)) return null;

  return (
    <section className="mt-8" aria-labelledby="category-explorer-title">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl space-y-1">
          <p className="eyebrow">{t("categoryEyebrow")}</p>
          <h2 id="category-explorer-title" className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("categoryTitle")}</h2>
          <p className="text-sm leading-6 text-muted-foreground">{t("categoryDescription")}</p>
        </div>
        <Link href="/products" className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-primary hover:underline">
          {t("browseAllProducts")}
          <IconArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>

      {pending ? (
        <div className="flex flex-wrap gap-2 rounded-2xl border border-border/70 bg-card/60 p-3">
          {Array.from({length: 12}, (_, index) => <Skeleton key={index} className="h-10 w-36 rounded-xl" />)}
        </div>
      ) : (
        <div className="flex flex-wrap gap-2 rounded-2xl border border-border/70 bg-card/60 p-3">
          {categories.map((category) => (
            <Link key={category.id} href={`/products?categoryId=${encodeURIComponent(category.id)}`} className="group inline-flex min-w-0 items-center gap-2 rounded-xl border border-border/70 bg-background px-3 py-2.5 text-sm font-medium transition hover:-translate-y-0.5 hover:border-primary/30 hover:bg-primary/5 hover:text-primary">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
                <CatalogCategoryIcon categoryName={category.name} className="size-4" strokeWidth={1.7} />
              </span>
              <span className="max-w-48 truncate" title={category.name}>{category.name}</span>
              <span className="shrink-0 text-xs tabular-nums text-muted-foreground group-hover:text-primary/70">{counts.get(category.id) ?? 0}</span>
              <IconArrowUpRight className="size-3.5 shrink-0 text-muted-foreground transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" aria-hidden="true" />
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

function CategoryMenu({categories, counts, pending, error}: {categories: HomeCategoryLink[]; counts: Map<string, number>; pending: boolean; error: boolean}) {
  const t = useTranslations("home");

  return (
    <Card className="h-full rounded-2xl border-border/70 shadow-sm">
      <CardContent className="p-3">
        <div className="flex items-center justify-between gap-2 px-2 pb-2">
          <div className="flex min-w-0 items-center gap-2">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <IconLayoutGrid className="size-4" aria-hidden="true" />
            </span>
            <h2 className="whitespace-nowrap text-sm font-semibold">{t("categoryMenuTitle")}</h2>
          </div>
          <Link href="/products" className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-primary transition hover:bg-primary/10" aria-label={t("browseAllProducts")} title={t("browseAllProducts")}>
            <IconArrowUpRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
        {pending ? (
          <div className="space-y-2 p-2">
            {Array.from({length: 5}, (_, index) => <Skeleton key={index} className="h-8" />)}
          </div>
        ) : categories.length > 0 ? (
          <div className="max-h-[22rem] space-y-0.5 overflow-y-auto pr-1 [scrollbar-width:thin]">
            {categories.map((category) => {
              return (
                <Link
                  key={category.id}
                  href={`/products?categoryId=${encodeURIComponent(category.id)}`}
                  className="group flex items-center gap-2.5 rounded-xl px-2 py-2 text-sm transition hover:bg-primary/5 hover:text-primary"
                  style={{paddingLeft: `${0.5 + Math.min(category.depth, 2) * 0.65}rem`}}
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted/80 text-muted-foreground transition group-hover:bg-primary/10 group-hover:text-primary">
                    <CatalogCategoryIcon categoryName={category.name} className="size-4.5" strokeWidth={1.8} />
                  </span>
                  <span className="min-w-0 flex-1 truncate" title={category.name}>{category.name}</span>
                  <span className="shrink-0 text-[0.7rem] tabular-nums text-muted-foreground/70">{counts.get(category.id) ?? 0}</span>
                  <IconChevronRight className="size-3.5 shrink-0 text-muted-foreground/70" aria-hidden="true" />
                </Link>
              );
            })}
          </div>
        ) : (
          <p className="p-2 text-xs leading-5 text-muted-foreground">{error ? t("catalogUnavailable") : t("noCategories")}</p>
        )}
        <div className="mt-2 border-t pt-2">
          <Link href="/assistant" className="group flex items-center gap-2.5 rounded-xl px-2 py-2 text-sm transition hover:bg-primary/5 hover:text-primary">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <IconRobot className="size-4" aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1 truncate">{t("aiMenuLink")}</span>
            <IconArrowUpRight className="size-4 shrink-0 text-muted-foreground/70" aria-hidden="true" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

function FeaturedSpotlight({product, pending, unavailable}: {product?: ProductSummary; pending: boolean; unavailable: boolean}) {
  const t = useTranslations("home");
  const locale = useLocale();

  if (pending) return <Skeleton className="min-h-[clamp(18rem,20vw,24rem)] rounded-2xl" />;
  if (!product) return <CatalogFallback unavailable={unavailable} />;

  const name = product.name ?? t("productUnavailable");
  const slug = product.seoName
    ? encodeURIComponent(product.seoName)
    : undefined;
  const price = product.minPrice ?? product.maxPrice;
  const category = product.categoryName ?? t("catalogTitle");

  return (
    <Card className="group relative overflow-hidden rounded-2xl border-slate-800 bg-[linear-gradient(135deg,#101827,#1c2942_48%,#353c91)] text-white shadow-md transition hover:shadow-xl">
      <div className="pointer-events-none absolute inset-y-0 right-0 w-[56%] bg-[radial-gradient(circle_at_55%_45%,rgba(96,165,250,0.46),transparent_42%),radial-gradient(circle_at_90%_90%,rgba(129,140,248,0.34),transparent_42%)]" />
      <CardContent className="relative grid min-h-[clamp(18rem,20vw,24rem)] grid-cols-[minmax(0,1.1fr)_minmax(8rem,.9fr)] items-center gap-4 p-5 sm:gap-6 sm:p-7 lg:p-8 2xl:p-9">
        <div className="flex min-h-full flex-col justify-between gap-8 py-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="border-white/20 bg-white/10 text-white">{t("featuredBadge")}</Badge>
            {product.status === ResourceStatus.Active ? <Badge className="border-emerald-300/40 bg-emerald-300/15 text-emerald-100">{t("activeCatalog")}</Badge> : null}
          </div>
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/60">{product.brandName ?? category}</p>
            <h2 className="text-2xl font-semibold leading-tight tracking-tight sm:text-3xl lg:text-4xl 2xl:text-5xl">{name}</h2>
            <p className="max-w-md text-sm leading-6 text-white/65">{t("featuredSubtitle")}</p>
          </div>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs text-white/60">{t("from")}</p>
              <p className="text-xl font-semibold tracking-tight sm:text-2xl">{formatMoney(price, locale)}</p>
              <p className="mt-1 text-xs text-white/60">★ {formatRating(product.ratingAverage)} · {product.reviewCount ?? 0} {t("reviews")}</p>
            </div>
            {slug ? <Link href={`/products/${slug}`} className="inline-flex items-center gap-1 text-sm font-medium text-white underline-offset-4 hover:underline">{t("viewProduct")}<IconArrowUpRight className="size-4 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" /></Link> : null}
          </div>
        </div>
        <div className="relative flex h-full min-h-48 items-center justify-center">
          <div className="absolute size-44 rounded-[2.25rem] border border-white/15 bg-white/10 shadow-2xl shadow-black/20 backdrop-blur sm:size-52 xl:size-60 2xl:size-64" />
          <div className="relative">
            <ProductArtwork product={product} large />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SideProductCard({product, index}: {product: ProductSummary; index: number}) {
  const t = useTranslations("home");
  const locale = useLocale();
  const name = product.name ?? t("productUnavailable");
  const slug = product.seoName
    ? encodeURIComponent(product.seoName)
    : undefined;
  const artworkBackgrounds = [
    "bg-[radial-gradient(circle_at_75%_30%,rgba(14,165,233,0.26),transparent_42%),#eff6ff]",
    "bg-[radial-gradient(circle_at_75%_30%,rgba(245,158,11,0.3),transparent_42%),#fffbeb]",
  ];

  const content = (
    <Card className="group overflow-hidden rounded-2xl border-border/70 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
      <CardContent className="flex min-h-36 gap-3 p-3">
        <div className={`flex size-[5.25rem] shrink-0 items-center justify-center overflow-hidden rounded-xl px-2 ${artworkBackgrounds[index % artworkBackgrounds.length]}`}>
          <ProductArtwork product={product} />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1.5 py-0.5">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-xs font-medium uppercase tracking-wider text-muted-foreground">{product.brandName ?? product.categoryName ?? "PC"}</p>
            <Badge className="shrink-0 border-primary/15 bg-background/80 px-1.5 py-0 text-xs text-muted-foreground">{t("featuredBadge")}</Badge>
          </div>
          <h3 className="line-clamp-2 text-sm font-semibold leading-5">{name}</h3>
          <div className="mt-auto flex items-center justify-between gap-2">
            <span className="text-sm font-semibold">{formatMoney(product.minPrice ?? product.maxPrice, locale)}</span>
            {slug ? <span className="inline-flex items-center gap-1 text-xs font-medium text-primary" aria-hidden="true"><IconArrowRight className="size-4 transition group-hover:translate-x-0.5" /></span> : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
  return slug ? <Link href={`/products/${slug}`} className="block" aria-label={`${t("viewProduct")}: ${name}`}>{content}</Link> : content;
}

function AssistantTile() {
  const t = useTranslations("home");
  return (
    <Link href="/assistant" className="group relative flex min-h-28 flex-col justify-between overflow-hidden rounded-2xl bg-primary p-4 text-primary-foreground shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="pointer-events-none absolute -right-8 -top-10 size-32 rounded-full bg-white/15 blur-2xl" />
      <div className="relative flex items-center justify-between gap-3">
        <IconRobot className="size-5" aria-hidden="true" />
        <Badge className="border-white/20 bg-white/10 text-xs text-white">{t("assistantBadge")}</Badge>
      </div>
      <div className="relative mt-4">
        <p className="text-sm font-semibold">{t("assistantTileTitle")}</p>
        <span className="mt-1.5 inline-flex items-center gap-1 text-xs text-primary-foreground/75 group-hover:underline">{t("assistantTileCta")}<IconArrowRight className="size-3.5 transition group-hover:translate-x-0.5" aria-hidden="true" /></span>
      </div>
    </Link>
  );
}

function HomeUtilityNav({isStaff}: {isStaff: boolean}) {
  const t = useTranslations("home");
  const nav = useTranslations("nav");
  const links = [
    {href: "/products" as const, label: t("utilityCatalog"), icon: IconLayoutGrid},
    {href: "/assistant" as const, label: t("utilityAssistant"), icon: IconRobot},
    ...(isStaff
      ? [{href: "/admin/orders" as const, label: nav("adminOrders"), icon: IconLayoutDashboard}]
      : [
          {href: "/cart" as const, label: nav("cart"), icon: IconShoppingCart},
          {href: "/orders" as const, label: nav("orders"), icon: IconClipboardList},
        ]),
    {href: "/account" as const, label: nav("account"), icon: IconUserCircle},
  ];

  return (
    <nav className="mb-7 flex items-center gap-2 overflow-x-auto border-b pb-3" aria-label={t("utilityNavLabel")}>
      {links.map(({href, label, icon: Icon}, index) => (
        <Link key={href} href={href} className={`inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition hover:bg-background hover:text-primary ${index === 0 ? "bg-background text-primary shadow-sm" : "text-muted-foreground"}`}>
          <Icon className="size-4" aria-hidden="true" />
          {label}
        </Link>
      ))}
    </nav>
  );
}

function CatalogFallback({unavailable = true}: {unavailable?: boolean}) {
  const t = useTranslations("home");
  return (
    <Card className="flex min-h-44 items-center justify-center rounded-2xl border-dashed shadow-none">
      <CardContent className="space-y-3 p-5 text-center">
        <p className="text-sm text-muted-foreground">{unavailable ? t("catalogUnavailable") : t("noProducts")}</p>
        <Link href="/products" className="inline-flex h-8 items-center rounded-lg border px-2.5 text-sm font-medium transition hover:bg-muted">{t("browseAllProducts")}</Link>
      </CardContent>
    </Card>
  );
}

function ProductArtwork({product, large = false}: {product: ProductSummary; large?: boolean}) {
  const iconClass = large ? "size-14 sm:size-16" : "size-7";
  const category = `${product.categoryName ?? ""} ${product.name ?? ""}`;
  const isLaptop = /laptop|notebook/i.test(category);
  const isMonitor = /màn hình|monitor|display/i.test(category);
  const isDesktop = /pc|desktop|case|main|cpu|vga|nguồn|tản/i.test(category);
  const isAudio = /loa|micro|webcam|tai nghe|audio/i.test(category);
  const isAccessory = /bàn phím|chuột|phụ kiện|console/i.test(category);

  return (
    <div className={`relative flex items-center justify-center ${large ? "size-32 sm:size-40 xl:size-48 2xl:size-52" : "size-14"}`}>
      {product.imageUrl ? (
        <Image src={product.imageUrl} alt={product.name ?? ""} fill sizes={large ? "240px" : "64px"} unoptimized className="object-contain p-1" />
      ) : large ? (
        <div className="relative flex size-full items-center justify-center" aria-hidden="true">
          <span className="absolute inset-3 rounded-full bg-cyan-300/20 blur-3xl" />
          <span className="absolute inset-x-2 bottom-1 h-8 rounded-[50%] bg-black/25 blur-xl" />
          {isLaptop ? (
            <>
              <span className="absolute top-5 h-28 w-48 rounded-[1.35rem] border-[5px] border-slate-300/70 bg-slate-950/80 shadow-2xl shadow-black/30 sm:h-32 sm:w-56">
                <span className="absolute inset-2 rounded-lg bg-[linear-gradient(135deg,#082f49,#0f766e_52%,#312e81)] opacity-90" />
                <span className="absolute inset-x-8 bottom-3 h-1 rounded-full bg-white/35" />
              </span>
              <span className="absolute bottom-4 h-3 w-60 rounded-full bg-slate-300/75 shadow-xl shadow-black/30 sm:w-72" />
              <span className="absolute bottom-2 h-1.5 w-20 rounded-full bg-white/45" />
            </>
          ) : isMonitor ? (
            <>
              <span className="absolute top-5 h-28 w-52 rounded-2xl border-[5px] border-slate-300/70 bg-slate-950/80 shadow-2xl shadow-black/30 sm:h-32 sm:w-60">
                <span className="absolute inset-2 rounded-lg bg-[linear-gradient(135deg,#172554,#1d4ed8_48%,#0f766e)] opacity-90" />
              </span>
              <span className="absolute bottom-5 h-8 w-2 rounded-full bg-slate-300/70" />
              <span className="absolute bottom-2 h-2 w-20 rounded-full bg-slate-300/70" />
            </>
          ) : isDesktop ? (
            <>
              <span className="absolute top-3 h-36 w-28 rounded-2xl border-[5px] border-slate-300/65 bg-slate-950/80 shadow-2xl shadow-black/30 sm:h-40 sm:w-32">
                <span className="absolute left-3 top-5 size-2 rounded-full bg-cyan-300 shadow-[0_0_18px_5px_rgba(34,211,238,.65)]" />
                <span className="absolute inset-x-3 bottom-4 h-1 rounded-full bg-violet-300/85" />
                <span className="absolute inset-x-3 bottom-8 h-1 rounded-full bg-cyan-300/40" />
              </span>
              <span className="absolute bottom-2 h-2 w-40 rounded-full bg-slate-300/60" />
            </>
          ) : isAudio ? (
            <span className="absolute top-5 size-32 rounded-full border-[10px] border-slate-300/60 bg-slate-950/80 shadow-2xl shadow-black/30 sm:size-36">
              <span className="absolute inset-5 rounded-full border-4 border-white/20" />
              <span className="absolute inset-10 rounded-full bg-cyan-300/40 shadow-[0_0_28px_10px_rgba(34,211,238,.3)]" />
            </span>
          ) : isAccessory ? (
            <>
              <span className="absolute top-14 h-16 w-56 rounded-[1.5rem] border-[5px] border-slate-300/60 bg-slate-950/80 shadow-2xl shadow-black/30 sm:w-64" />
              <span className="absolute bottom-7 h-1 w-28 rounded-full bg-pink-300/80" />
            </>
          ) : (
            <span className="absolute top-5 size-32 rounded-[2rem] border-[5px] border-slate-300/60 bg-slate-950/80 shadow-2xl shadow-black/30" />
          )}
          <span className="relative z-10 flex size-14 items-center justify-center rounded-2xl border border-white/50 bg-white/75 text-slate-800 shadow-xl backdrop-blur sm:size-16">
            <CatalogCategoryIcon categoryName={product.categoryName ?? product.name} className="size-8 sm:size-9" strokeWidth={1.55} />
          </span>
          <span className="absolute bottom-0 z-10 rounded-full bg-slate-950/75 px-2.5 py-1 text-[0.56rem] font-bold uppercase tracking-[0.18em] text-white/80">
            {product.categoryName ?? "gearPC"}
          </span>
        </div>
      ) : (
        <div className={`relative flex flex-col items-center justify-center overflow-hidden rounded-3xl border ${large ? "border-white/15 bg-white/10 text-white/75" : "border-primary/10 bg-background/60 text-primary/55"}`} aria-hidden="true">
          <span className={`pointer-events-none absolute -right-5 -top-6 rounded-full blur-2xl ${large ? "size-24 bg-cyan-300/20" : "size-16 bg-primary/10"}`} />
          <CatalogCategoryIcon categoryName={product.categoryName ?? product.name} className={`relative ${iconClass}`} strokeWidth={1.5} />
          {large ? <span className="relative mt-2 max-w-32 truncate text-[0.55rem] font-semibold uppercase tracking-[0.16em] text-white/55">{product.categoryName ?? "gearPC"}</span> : null}
        </div>
      )}
    </div>
  );
}

function TrustItem({icon: Icon, title, description}: {icon: typeof IconCircleCheck; title: string; description: string}) {
  return (
    <div className="flex gap-3 bg-background px-4 py-3 sm:px-5">
      <Icon className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

type HomeCategoryLink = {id: string; name: string; depth: number};

function getActiveCategories(categories: CategoryTree[], depth = 0): HomeCategoryLink[] {
  return categories.flatMap((category) => {
    if (category.status === ResourceStatus.Inactive || category.status === ResourceStatus.Deleted) return [];
    const current = category.id && category.name ? [{id: category.id, name: category.name, depth}] : [];
    return [...current, ...getActiveCategories(category.children ?? [], depth + 1)];
  });
}

function getCategoryCounts(products: ProductSummary[], categories: CategoryTree[]): Map<string, number> {
  const counts = new Map<string, number>();
  const parentById = new Map<string, string | undefined>();
  function index(nodes: CategoryTree[], inheritedParentId?: string) {
    for (const category of nodes) {
      if (category.id) parentById.set(category.id, category.parentId ?? inheritedParentId);
      index(category.children ?? [], category.id);
    }
  }
  index(categories);
  for (const product of products) {
    let categoryId = product.categoryId;
    const visited = new Set<string>();
    while (categoryId && !visited.has(categoryId)) {
      visited.add(categoryId);
      counts.set(categoryId, (counts.get(categoryId) ?? 0) + 1);
      categoryId = parentById.get(categoryId);
    }
  }
  return counts;
}

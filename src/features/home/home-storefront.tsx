"use client";

import {
  IconArrowRight,
  IconArrowUpRight,
  IconChevronRight,
  IconCircleCheck,
  IconCpu,
  IconDeviceGamepad2,
  IconDeviceLaptop,
  IconDesk,
  IconLayoutGrid,
  IconMessageCircle,
  IconRobot,
  IconSparkles,
  IconTags,
  IconTruckDelivery,
} from "@tabler/icons-react";
import {useLocale, useTranslations} from "next-intl";
import Image from "next/image";
import dynamic from "next/dynamic";
import {useState} from "react";

import {Badge} from "@/components/ui/badge";
import {Card, CardContent} from "@/components/ui/card";
import {Skeleton} from "@/components/ui/skeleton";
import {Link} from "@/i18n/navigation";
import type {CategoryTree, ProductSummary} from "@/features/catalog/contracts/responses";
import {formatMoney, formatRating} from "@/lib/format";
import {cn} from "@/lib/utils";
import {ResourceStatus} from "@/lib/domain/catalog-enums";

import {useCategories, useProducts} from "@/features/catalog/queries";
import {CatalogCategoryIcon} from "@/features/catalog/components/catalog-category-icon";
import {FeaturedProductsSkeleton} from "@/components/ui/loading-skeletons";
import {HomeSearch} from "./home-search";

// The category shelves are below the hero and contain the largest client-side
// catalog surface on the home route. Keep the hero interactive first and load
// this section as a separate chunk while its layout-preserving fallback shows.
const FeaturedProducts = dynamic(
  () => import("@/features/catalog/components/featured-products").then((module) => module.FeaturedProducts),
  {loading: () => <FeaturedProductsSkeleton />},
);

export function HomeStorefront() {
  const t = useTranslations("home");
  const categories = useCategories();
  const products = useProducts({limit: 100});
  const categoryTree = getActiveCategoryTree(categories.data ?? []);
  const featuredProducts = products.data?.items ?? [];
  const categoryCounts = getCategoryCounts(categories.data ?? []);
  // Only the top-level categories that have products, the fullest first: every category as a chip is a wall of tags
  const topCategories = categoryTree
    .filter((category) => (categoryCounts.get(category.id) ?? 0) > 0)
    .sort((left, right) => (categoryCounts.get(right.id) ?? 0) - (categoryCounts.get(left.id) ?? 0))
    .slice(0, TOP_CATEGORY_COUNT);

  return (
    <section className="border-b bg-[radial-gradient(circle_at_10%_0%,rgba(34,211,238,.11),transparent_28rem),radial-gradient(circle_at_92%_8%,rgba(99,102,241,.09),transparent_30rem)]">
      <div className="storefront-wrap py-8 sm:py-12">
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
            <HeroCategoryChips categories={topCategories} counts={categoryCounts} pending={categories.isPending || products.isPending} />
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[clamp(17rem,19vw,22rem)_minmax(0,1fr)]">
          <CategoryMenu categories={categoryTree} counts={categoryCounts} pending={categories.isPending} error={categories.isError} />
          <FeaturedSpotlight product={featuredProducts[0]} pending={products.isPending} unavailable={products.isError} />
        </div>

        <section className="mt-12 border-t border-border/60 pt-10" aria-labelledby="featured-products-title">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl space-y-1.5">
              <p className="eyebrow">{t("featuredEyebrow")}</p>
              <h2 id="featured-products-title" className="text-2xl font-semibold tracking-tight sm:text-3xl">
                {t("catalogTitle")}
              </h2>
              <p className="text-sm leading-6 text-muted-foreground">{t("featuredDescription")}</p>
            </div>
            <Link href="/products" className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-primary hover:underline">
              {t("browseAllProducts")}
              <IconArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
          <FeaturedProducts products={featuredProducts} pending={products.isPending} unavailable={products.isError} />
        </section>

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

/** The fullest top-level categories under the search box: where most people start. The whole tree is in the menu below. */
function HeroCategoryChips({categories, counts, pending}: {categories: HomeCategoryNode[]; counts: Map<string, number>; pending: boolean}) {
  const t = useTranslations("home");
  if (!pending && categories.length === 0) return null;
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2" aria-label={t("categoryTitle")}>
      {pending
        ? Array.from({length: 5}, (_, index) => <Skeleton key={index} className="h-8 w-28 rounded-full" />)
        : categories.map((category) => (
            <Link
              key={category.id}
              href={`/products?categoryId=${encodeURIComponent(category.id)}`}
              className="inline-flex max-w-48 items-center gap-1.5 rounded-full border border-border/70 bg-background px-3 py-1.5 text-xs font-medium transition hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
            >
              <span className="truncate" title={category.name}>
                {category.name}
              </span>
              <span className="tabular-nums text-muted-foreground">{counts.get(category.id) ?? 0}</span>
            </Link>
          ))}
    </div>
  );
}

function ShopByGoal() {
  const t = useTranslations("home");
  const goals = [
    {
      key: "gaming",
      href: "/products?keyword=gaming",
      icon: IconDeviceGamepad2,
      tone: "from-violet-500/15 to-fuchsia-500/5 text-violet-700",
    },
    {key: "work", href: "/products?keyword=laptop", icon: IconDeviceLaptop, tone: "from-sky-500/15 to-cyan-500/5 text-sky-700"},
    {key: "creator", href: "/products?keyword=creator", icon: IconDesk, tone: "from-amber-500/15 to-orange-500/5 text-amber-700"},
    {key: "build", href: "/assistant", icon: IconCpu, tone: "from-emerald-500/15 to-teal-500/5 text-emerald-700"},
  ] as const;

  return (
    <section className="mt-9" aria-labelledby="shop-by-goal-title">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">{t("goalEyebrow")}</p>
          <h2 id="shop-by-goal-title" className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
            {t("goalTitle")}
          </h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">{t("goalDescription")}</p>
        </div>
        <Link href="/assistant" className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-primary hover:underline">
          {t("talkToAssistant")}
          <IconArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {goals.map(({key, href, icon: Icon, tone}) => (
          <Link key={key} href={href} className="group">
            <Card
              className={cn(
                "h-full overflow-hidden border-border/70 bg-gradient-to-br transition duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md",
                tone,
              )}
            >
              <CardContent className="flex min-h-32 items-center gap-4 p-5">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-background/80 shadow-sm transition group-hover:scale-105">
                  <Icon className="size-6" strokeWidth={1.7} aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block text-base font-semibold text-foreground">{t(`goal.${key}.title`)}</span>
                  <span className="mt-1 block text-sm leading-5 text-muted-foreground">{t(`goal.${key}.description`)}</span>
                  <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary">
                    {t("exploreCategory")}
                    <IconArrowUpRight className="size-3.5 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </span>
                </span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}

function CategoryMenu({
  categories,
  counts,
  pending,
  error,
}: {
  categories: HomeCategoryNode[];
  counts: Map<string, number>;
  pending: boolean;
  error: boolean;
}) {
  const t = useTranslations("home");
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(new Set());
  const toggle = (id: string) =>
    setExpanded((current) => {
      const next = new Set(current);
      if (!next.delete(id)) next.add(id);
      return next;
    });

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
          <Link
            href="/products"
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-primary transition hover:bg-primary/10"
            aria-label={t("browseAllProducts")}
            title={t("browseAllProducts")}
          >
            <IconArrowUpRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
        {pending ? (
          <div className="space-y-2 p-2">
            {Array.from({length: 5}, (_, index) => (
              <Skeleton key={index} className="h-8" />
            ))}
          </div>
        ) : categories.length > 0 ? (
          <ul className="max-h-[22rem] space-y-0.5 overflow-y-auto pr-1 [scrollbar-width:thin]">
            {categories.map((category) => {
              const open = expanded.has(category.id);
              const hasChildren = category.children.length > 0;
              return (
                <li key={category.id}>
                  <div className="group flex items-center rounded-xl transition hover:bg-primary/5">
                    <Link
                      href={`/products?categoryId=${encodeURIComponent(category.id)}`}
                      className="flex min-w-0 flex-1 items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition group-hover:text-primary"
                    >
                      <span className="min-w-0 flex-1 truncate font-medium" title={category.name}>
                        {category.name}
                      </span>
                      <span className="shrink-0 text-[0.7rem] tabular-nums text-muted-foreground/70">{counts.get(category.id) ?? 0}</span>
                    </Link>
                    {hasChildren ? (
                      <button
                        type="button"
                        onClick={() => toggle(category.id)}
                        aria-expanded={open}
                        aria-label={t(open ? "collapseCategory" : "expandCategory", {name: category.name})}
                        className="mr-1 flex size-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-primary/10 hover:text-primary"
                      >
                        <IconChevronRight className={cn("size-3.5 transition-transform", open && "rotate-90")} aria-hidden="true" />
                      </button>
                    ) : (
                      <span className="mr-1 size-7 shrink-0" aria-hidden="true" />
                    )}
                  </div>
                  {hasChildren && open ? <CategoryBranch nodes={category.children} counts={counts} /> : null}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="p-2 text-xs leading-5 text-muted-foreground">{error ? t("catalogUnavailable") : t("noCategories")}</p>
        )}
        <div className="mt-2 border-t pt-2">
          <Link
            href="/assistant"
            className="group flex items-center gap-2.5 rounded-xl px-2 py-2 text-sm transition hover:bg-primary/5 hover:text-primary"
          >
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

/** The sub-categories of one category: a guide line down the left, no icon box, so they read as part of their parent. */
function CategoryBranch({nodes, counts}: {nodes: HomeCategoryNode[]; counts: Map<string, number>}) {
  return (
    <ul className="ml-6 mt-0.5 space-y-0.5 border-l border-border/80 pl-2">
      {nodes.map((node) => (
        <li key={node.id}>
          <Link
            href={`/products?categoryId=${encodeURIComponent(node.id)}`}
            className="group flex items-center gap-2 rounded-lg px-2 py-1.5 text-[0.82rem] text-muted-foreground transition hover:bg-primary/5 hover:text-primary"
          >
            <span className="min-w-0 flex-1 truncate" title={node.name}>
              {node.name}
            </span>
            <span className="shrink-0 text-[0.7rem] tabular-nums text-muted-foreground/70">{counts.get(node.id) ?? 0}</span>
          </Link>
          {node.children.length > 0 ? <CategoryBranch nodes={node.children} counts={counts} /> : null}
        </li>
      ))}
    </ul>
  );
}

function FeaturedSpotlight({product, pending, unavailable}: {product?: ProductSummary; pending: boolean; unavailable: boolean}) {
  const t = useTranslations("home");
  const locale = useLocale();

  if (pending) return <Skeleton className="min-h-[clamp(18rem,20vw,24rem)] rounded-2xl" />;
  if (!product) return <CatalogFallback unavailable={unavailable} />;

  const name = product.name ?? t("productUnavailable");
  const slug = product.seoName ? encodeURIComponent(product.seoName) : undefined;
  const price = product.minPrice ?? product.maxPrice;
  const category = product.categoryName ?? t("catalogTitle");

  return (
    <Card className="group relative overflow-hidden rounded-2xl border-slate-800 bg-[linear-gradient(135deg,#101827,#1c2942_48%,#353c91)] text-white shadow-md transition hover:shadow-xl">
      <div className="pointer-events-none absolute inset-y-0 right-0 w-[56%] bg-[radial-gradient(circle_at_55%_45%,rgba(96,165,250,0.46),transparent_42%),radial-gradient(circle_at_90%_90%,rgba(129,140,248,0.34),transparent_42%)]" />
      <CardContent className="relative grid min-h-[clamp(18rem,20vw,24rem)] grid-cols-[minmax(0,1.1fr)_minmax(8rem,.9fr)] items-center gap-4 p-5 sm:gap-6 sm:p-7 lg:p-8 2xl:p-9">
        <div className="flex min-h-full flex-col justify-between gap-8 py-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="border-white/20 bg-white/10 text-white">{t("featuredBadge")}</Badge>
            {product.status === ResourceStatus.Active ? (
              <Badge className="border-emerald-300/40 bg-emerald-300/15 text-emerald-100">{t("activeCatalog")}</Badge>
            ) : null}
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
              <p className="mt-1 text-xs text-white/60">
                ★ {formatRating(product.ratingAverage)} · {product.reviewCount ?? 0} {t("reviews")}
              </p>
            </div>
            {slug ? (
              <Link
                href={`/products/${slug}`}
                prefetch={false}
                className="inline-flex items-center gap-1 text-sm font-medium text-white underline-offset-4 hover:underline"
              >
                {t("viewProduct")}
                <IconArrowUpRight
                  className="size-4 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </Link>
            ) : null}
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

function CatalogFallback({unavailable = true}: {unavailable?: boolean}) {
  const t = useTranslations("home");
  return (
    <Card className="flex min-h-44 items-center justify-center rounded-2xl border-dashed shadow-none">
      <CardContent className="space-y-3 p-5 text-center">
        <p className="text-sm text-muted-foreground">{unavailable ? t("catalogUnavailable") : t("noProducts")}</p>
        <Link
          href="/products"
          className="inline-flex h-8 items-center rounded-lg border px-2.5 text-sm font-medium transition hover:bg-muted"
        >
          {t("browseAllProducts")}
        </Link>
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
        <Image
          src={product.imageUrl}
          alt={product.name ?? ""}
          fill
          sizes={large ? "240px" : "64px"}
          priority={large}
          unoptimized
          className="object-contain p-1"
        />
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
        <div
          className={`relative flex flex-col items-center justify-center overflow-hidden rounded-3xl border ${large ? "border-white/15 bg-white/10 text-white/75" : "border-primary/10 bg-background/60 text-primary/55"}`}
          aria-hidden="true"
        >
          <span
            className={`pointer-events-none absolute -right-5 -top-6 rounded-full blur-2xl ${large ? "size-24 bg-cyan-300/20" : "size-16 bg-primary/10"}`}
          />
          <CatalogCategoryIcon categoryName={product.categoryName ?? product.name} className={`relative ${iconClass}`} strokeWidth={1.5} />
          {large ? (
            <span className="relative mt-2 max-w-32 truncate text-[0.55rem] font-semibold uppercase tracking-[0.16em] text-white/55">
              {product.categoryName ?? "gearPC"}
            </span>
          ) : null}
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

/** Most category chips on the home page; the full tree is one tap away in the menu. */
const TOP_CATEGORY_COUNT = 8;

type HomeCategoryNode = {id: string; name: string; children: HomeCategoryNode[]};

/** The active categories as a tree, for the menu that folds a category's children under it. */
function getActiveCategoryTree(categories: CategoryTree[]): HomeCategoryNode[] {
  return categories.flatMap((category) => {
    if (category.status === ResourceStatus.Inactive || category.status === ResourceStatus.Deleted) return [];
    const children = getActiveCategoryTree(category.children ?? []);
    return category.id && category.name ? [{id: category.id, name: category.name, children}] : children;
  });
}

/** The products the shop lists in each category, its sub-categories included, as the catalog counted them. */
function getCategoryCounts(categories: CategoryTree[]): Map<string, number> {
  const counts = new Map<string, number>();
  function collect(nodes: CategoryTree[]) {
    for (const category of nodes) {
      if (category.id) counts.set(category.id, category.productCount ?? 0);
      collect(category.children ?? []);
    }
  }
  collect(categories);
  return counts;
}

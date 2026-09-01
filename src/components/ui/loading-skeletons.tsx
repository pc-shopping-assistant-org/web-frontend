import type {ReactNode} from "react";

import {Skeleton} from "@/components/ui/skeleton";
import {cn} from "@/lib/utils";

/**
 * Layout-preserving loading states for route and query boundaries.
 *
 * These components intentionally contain no data fetching or translations, so
 * they are safe to render from App Router `loading.tsx` files and from client
 * query fallbacks alike.
 */
function LoadingFrame({
  children,
  className,
  label = "Loading",
}: {
  children: ReactNode;
  className?: string;
  label?: string;
}) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label={label}
      className={cn("animate-in fade-in duration-200", className)}
    >
      {children}
      <span className="sr-only">{label}...</span>
    </div>
  );
}

export function ProductCardSkeleton({compact = false}: {compact?: boolean} = {}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/70 bg-card">
      <Skeleton className={cn(compact ? "h-40 rounded-none" : "h-56 rounded-none")} />
      <div className={cn("space-y-4", compact ? "min-h-40 p-4" : "min-h-48 p-5")}>
        <Skeleton className="h-3 w-24" />
        <Skeleton className={cn("h-5", compact ? "w-4/5" : "w-11/12")} />
        <Skeleton className="h-5 w-2/5" />
        <div className="flex items-center justify-between gap-3 border-t pt-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-9 w-24 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function ProductGridSkeleton({
  count = 8,
  compact = false,
}: {
  count?: number;
  compact?: boolean;
} = {}) {
  return (
    <LoadingFrame>
      <div
        className={cn(
          "grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5",
          compact && "gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4",
        )}
      >
        {Array.from({length: count}, (_, index) => (
          <ProductCardSkeleton key={index} compact={compact} />
        ))}
      </div>
    </LoadingFrame>
  );
}

export function StorefrontPageSkeleton() {
  return (
    <LoadingFrame className="storefront-wrap space-y-8 py-8 sm:py-12">
      <div className="grid gap-4 lg:grid-cols-[clamp(17rem,19vw,22rem)_minmax(0,1fr)] xl:grid-cols-[clamp(17rem,19vw,22rem)_minmax(0,1fr)_clamp(17rem,20vw,22rem)]">
        <Skeleton className="min-h-[30rem] rounded-2xl" />
        <Skeleton className="min-h-[30rem] rounded-2xl" />
        <div className="grid gap-4 sm:grid-cols-2 lg:col-span-2 xl:col-span-1 xl:grid-cols-1">
          <Skeleton className="min-h-36 rounded-2xl" />
          <Skeleton className="min-h-36 rounded-2xl" />
          <Skeleton className="min-h-24 rounded-2xl" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({length: 4}, (_, index) => (
          <Skeleton key={index} className="h-28 rounded-2xl" />
        ))}
      </div>
      <ProductGridSkeleton count={8} compact />
    </LoadingFrame>
  );
}

export function CatalogPageSkeleton() {
  return (
    <LoadingFrame className="page-wrap space-y-8 py-12 sm:py-16">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="w-full max-w-2xl space-y-3">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-5 w-full max-w-xl" />
        </div>
        <Skeleton className="h-11 w-full max-w-lg rounded-xl" />
      </div>
      <Skeleton className="h-12 rounded-2xl" />
      <div className="space-y-5 rounded-2xl border bg-card p-5">
        <Skeleton className="h-5 w-28" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {Array.from({length: 5}, (_, index) => (
            <Skeleton key={index} className="h-10 rounded-lg" />
          ))}
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-28 rounded-lg" />
          <Skeleton className="h-9 w-28 rounded-lg" />
        </div>
      </div>
      <ProductGridSkeleton count={8} />
    </LoadingFrame>
  );
}

export function ProductDetailPageSkeleton() {
  return (
    <LoadingFrame className="page-wrap space-y-10 py-12 sm:py-16">
      <Skeleton className="h-5 w-32" />
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(22rem,0.9fr)]">
        <Skeleton className="min-h-[30rem] rounded-3xl" />
        <div className="space-y-5 rounded-3xl border bg-card p-6 sm:p-8">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-10 w-11/12" />
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-24 w-full" />
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-12 rounded-xl" />
            <Skeleton className="h-12 rounded-xl" />
          </div>
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      </div>
      <div className="space-y-4">
        <Skeleton className="h-8 w-56" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
        </div>
      </div>
    </LoadingFrame>
  );
}

export function AccountPageSkeleton() {
  return (
    <LoadingFrame className="page-wrap space-y-6 py-12 sm:py-16">
      <Skeleton className="h-28 rounded-3xl" />
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Skeleton className="h-[28rem] rounded-2xl" />
        <Skeleton className="h-[28rem] rounded-2xl" />
      </div>
    </LoadingFrame>
  );
}

export function CartPageSkeleton() {
  return (
    <LoadingFrame className="page-wrap space-y-8 py-12 sm:py-16">
      <div className="space-y-3">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-10 w-56" />
        <Skeleton className="h-5 w-full max-w-xl" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <Skeleton className="h-[30rem] rounded-2xl" />
        <Skeleton className="h-52 rounded-2xl" />
      </div>
    </LoadingFrame>
  );
}

export function CheckoutPageSkeleton() {
  return (
    <LoadingFrame className="page-wrap space-y-8 py-12 sm:py-16">
      <div className="space-y-3">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-10 w-64" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <Skeleton className="h-[42rem] rounded-2xl" />
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    </LoadingFrame>
  );
}

export function OrdersPageSkeleton() {
  return (
    <LoadingFrame className="page-wrap space-y-7 py-12 sm:py-16">
      <div className="space-y-3">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-10 w-52" />
        <Skeleton className="h-5 w-full max-w-xl" />
      </div>
      <Skeleton className="h-16 rounded-2xl" />
      <div className="space-y-3">
        {Array.from({length: 5}, (_, index) => (
          <Skeleton key={index} className="h-24 rounded-2xl" />
        ))}
      </div>
    </LoadingFrame>
  );
}

export function OrderDetailPageSkeleton() {
  return (
    <LoadingFrame className="page-wrap space-y-7 py-12 sm:py-16">
      <Skeleton className="h-5 w-32" />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-3">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-4 w-40" />
        </div>
        <Skeleton className="h-9 w-28 rounded-full" />
      </div>
      <Skeleton className="h-20 rounded-2xl" />
      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-6">
          <Skeleton className="h-72 rounded-2xl" />
          <Skeleton className="h-44 rounded-2xl" />
        </div>
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    </LoadingFrame>
  );
}

export function AssistantPageSkeleton() {
  return (
    <LoadingFrame className="page-wrap space-y-7 py-8 sm:py-12">
      <Skeleton className="h-72 rounded-[2rem]" />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <Skeleton className="h-[30rem] rounded-2xl" />
        <Skeleton className="h-[30rem] rounded-2xl" />
      </div>
    </LoadingFrame>
  );
}

export function AdminPageSkeleton() {
  return (
    <LoadingFrame className="space-y-7 p-5 sm:p-8 lg:p-10">
      <div className="space-y-3 border-b border-border/70 pb-6">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-5 w-full max-w-2xl" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({length: 4}, (_, index) => (
          <Skeleton key={index} className="h-32 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-[28rem] rounded-2xl" />
    </LoadingFrame>
  );
}

export function AuthPageSkeleton() {
  return (
    <LoadingFrame className="page-wrap grid max-w-6xl gap-12 py-16 lg:grid-cols-[1fr_30rem] lg:py-24">
      <div className="space-y-5">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-14 w-full max-w-xl" />
        <Skeleton className="h-20 w-full max-w-md" />
      </div>
      <Skeleton className="h-[34rem] rounded-3xl" />
    </LoadingFrame>
  );
}

export function AuthFormSkeleton({
  variant = "login",
}: {
  variant?: "login" | "register" | "recovery";
} = {}) {
  const minHeight = {
    login: "min-h-64",
    register: "min-h-[34rem]",
    recovery: "min-h-72",
  }[variant];

  return (
    <LoadingFrame className={cn("space-y-5", minHeight)} label="Loading form">
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-full rounded-lg" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-10 w-full rounded-lg" />
      </div>
      <Skeleton className="h-10 w-full rounded-lg" />
    </LoadingFrame>
  );
}

export function FeaturedProductsSkeleton() {
  return (
    <LoadingFrame className="space-y-5">
      <Skeleton className="h-16 rounded-2xl" />
      <ProductGridSkeleton count={8} compact />
    </LoadingFrame>
  );
}

import type {Metadata} from "next";

import {getServerEnv} from "@/lib/config/env";

import {ProductDetailRouteClient} from "../../catalog-route-client";

type Props = {params: Promise<{slug: string}>};

const METADATA_REVALIDATE_SECONDS = 60;

/** The product name with its accents, from the public catalog; the slug has none, so it is only the fallback. */
async function productName(slug: string): Promise<string | null> {
  try {
    const response = await fetch(`${getServerEnv().BACKEND_API_URL}/catalog-service/products/slug/${encodeURIComponent(slug)}`, {
      next: {revalidate: METADATA_REVALIDATE_SECONDS},
    });
    if (!response.ok) {
      return null;
    }
    const body = (await response.json()) as {data?: {name?: string}};
    return body.data?.name ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({params}: Props): Promise<Metadata> {
  const {slug} = await params;
  return {title: (await productName(slug)) ?? slug.replaceAll("-", " ")};
}

export default async function ProductPage({params}: Props) {
  const {slug} = await params;
  return <ProductDetailRouteClient slug={slug} />;
}

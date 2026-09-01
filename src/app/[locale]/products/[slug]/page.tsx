import type {Metadata} from "next";

import {ProductDetailRouteClient} from "../../catalog-route-client";

type Props = {params: Promise<{slug: string}>};

export async function generateMetadata({params}: Props): Promise<Metadata> {
  const {slug} = await params;
  return {title: slug.replaceAll("-", " ")};
}

export default async function ProductPage({params}: Props) {
  const {slug} = await params;
  return <ProductDetailRouteClient slug={slug} />;
}

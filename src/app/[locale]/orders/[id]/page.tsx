import type {Metadata} from "next";

import {OrderDetailRouteClient} from "../../customer-route-client";

export const metadata: Metadata = {title: "Order details"};
export default async function OrderRoute({params}: {params: Promise<{id: string}>}) { const {id} = await params; return <OrderDetailRouteClient orderId={id} />; }

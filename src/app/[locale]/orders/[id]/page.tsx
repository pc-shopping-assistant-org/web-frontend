import type {Metadata} from "next";

import {OrderDetailPage} from "@/features/orders/order-detail-page";

export const metadata: Metadata = {title: "Order details"};
export default async function OrderRoute({params}: {params: Promise<{id: string}>}) { const {id} = await params; return <OrderDetailPage orderId={id} />; }

import type {Metadata} from "next";

import {OrdersPage} from "@/features/orders/orders-page";

export const metadata: Metadata = {title: "Orders"};
export default function OrdersRoute() { return <OrdersPage />; }

import type {Metadata} from "next";

import {OrdersRouteClient} from "../customer-route-client";

export const metadata: Metadata = {title: "Orders"};
export default function OrdersRoute() { return <OrdersRouteClient />; }

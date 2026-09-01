import type {Metadata} from "next";

import {CartRouteClient} from "../customer-route-client";

export const metadata: Metadata = {title: "Cart"};

export default function CartRoute() {
  return <CartRouteClient />;
}

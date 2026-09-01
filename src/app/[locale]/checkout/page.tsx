import type {Metadata} from "next";

import {CheckoutRouteClient} from "../customer-route-client";

export const metadata: Metadata = {title: "Checkout"};

export default function CheckoutRoute() { return <CheckoutRouteClient />; }

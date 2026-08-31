import type {Metadata} from "next";

import {CheckoutPage} from "@/features/orders/checkout-page";

export const metadata: Metadata = {title: "Checkout"};

export default function CheckoutRoute() { return <CheckoutPage />; }

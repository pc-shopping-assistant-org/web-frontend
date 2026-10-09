import type {Metadata} from "next";
import {Suspense} from "react";

import {VnpayReturnPage} from "@/features/orders/vnpay-return-page";

export const metadata: Metadata = {title: "Payment result"};

export default function VnpayReturnRoute() {
  return <Suspense fallback={null}><VnpayReturnPage /></Suspense>;
}

import type {Metadata} from "next";

import {AdminInvoicesRouteClient} from "../admin-route-client";

export const metadata: Metadata = {title: "Invoices"};

export default function AdminInvoicesRoute() {
  return <AdminInvoicesRouteClient />;
}

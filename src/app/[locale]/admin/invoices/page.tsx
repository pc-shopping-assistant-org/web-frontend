import type {Metadata} from "next";

import {AdminInvoicesPage} from "@/features/admin/detail-pages";

export const metadata: Metadata = {title: "Invoices"};

export default function AdminInvoicesRoute() {
  return <AdminInvoicesPage />;
}

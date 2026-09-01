import type {Metadata} from "next";

import {AccountRouteClient} from "../customer-route-client";

export const metadata: Metadata = {title: "Account"};

export default function AccountPage() {
  return <AccountRouteClient />;
}

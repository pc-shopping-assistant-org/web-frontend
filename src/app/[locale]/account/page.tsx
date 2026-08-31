import type {Metadata} from "next";
import {AccountPage as AccountDashboard} from "@/features/account/account-page";

export const metadata: Metadata = {title: "Account"};

export default function AccountPage() {
  return <AccountDashboard />;
}

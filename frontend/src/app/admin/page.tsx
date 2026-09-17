import type { Metadata } from "next";
import { AdminConsole } from "@/components/admin-console";
import { SITE_NAME } from "@/lib/config";

export const metadata: Metadata = {
  title: `Ops · ${SITE_NAME}`,
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <AdminConsole />;
}

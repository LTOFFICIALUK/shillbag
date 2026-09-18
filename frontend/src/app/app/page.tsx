import { RaidApp } from "@/components/raid-app";
import { SiteFooter } from "@/components/site-footer";
import { SiteNav } from "@/components/site-nav";

export default function AppPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteNav />
      <main className="flex-1">
        <RaidApp />
      </main>
      <SiteFooter />
    </div>
  );
}

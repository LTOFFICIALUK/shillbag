import { RaidApp } from "@/components/raid-app";
import { SiteFooter } from "@/components/site-footer";
import { SiteNav } from "@/components/site-nav";

export default function AppPage() {
  return (
    <div>
      <SiteNav />
      <main>
        <RaidApp />
      </main>
      <SiteFooter />
    </div>
  );
}

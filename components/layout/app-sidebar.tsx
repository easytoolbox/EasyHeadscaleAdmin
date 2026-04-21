import Link from "next/link";
import { Cable } from "lucide-react";

import { SidebarLink } from "@/components/layout/sidebar-link";
import { Card } from "@/components/ui/card";
import { getI18n } from "@/lib/i18n/server";

const items = [
  { href: "/", labelKey: "sidebar.dashboard", icon: "dashboard" },
  { href: "/users", labelKey: "sidebar.users", icon: "users" },
  { href: "/nodes", labelKey: "sidebar.nodes", icon: "nodes" },
  { href: "/preauthkeys", labelKey: "sidebar.preauthkeys", icon: "preauthkeys" },
  { href: "/apikeys", labelKey: "sidebar.apikeys", icon: "apikeys" },
  { href: "/routes", labelKey: "sidebar.routes", icon: "routes" },
  { href: "/acl", labelKey: "sidebar.acl", icon: "acl" },
  { href: "/dns", labelKey: "sidebar.dns", icon: "dns" },
  { href: "/derp", labelKey: "sidebar.derp", icon: "derp" },
  { href: "/audit-logs", labelKey: "sidebar.audit", icon: "audit" },
  { href: "/settings", labelKey: "sidebar.settings", icon: "settings" }
] as const;

export async function AppSidebar() {
  const { t } = await getI18n();

  return (
    <aside className="hidden w-72 shrink-0 xl:block">
      <Card className="sticky top-6 p-5">
        <Link href="/" className="mb-6 flex items-center gap-3">
          <div className="rounded-2xl bg-primary/10 p-3 text-primary">
            <Cable className="h-6 w-6" />
          </div>
          <div>
            <p className="font-display text-lg font-semibold">EasyHeadscaleAdmin</p>
            <p className="text-sm text-muted-foreground">{t("sidebar.tagline")}</p>
          </div>
        </Link>

        <nav className="space-y-2">
          {items.map((item) => (
            <SidebarLink key={item.href} href={item.href} label={t(item.labelKey)} icon={item.icon} />
          ))}
        </nav>

        <div className="mt-6 rounded-2xl bg-secondary/70 p-4">
          <p className="text-sm font-medium">{t("sidebar.mvpTitle")}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("sidebar.mvpBody")}
          </p>
        </div>
      </Card>
    </aside>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FileCheck2,
  Globe2,
  History,
  KeyRound,
  LayoutDashboard,
  Network,
  Radar,
  Route,
  Settings2,
  ShieldCheck,
  Users2
} from "lucide-react";

import { cn } from "@/lib/utils";

const iconMap = {
  dashboard: LayoutDashboard,
  users: Users2,
  nodes: Network,
  preauthkeys: ShieldCheck,
  apikeys: KeyRound,
  routes: Route,
  acl: FileCheck2,
  dns: Globe2,
  derp: Radar,
  audit: History,
  settings: Settings2
} as const;

export function SidebarLink({
  href,
  label,
  icon
}: {
  href: string;
  label: string;
  icon: keyof typeof iconMap;
}) {
  const pathname = usePathname();
  const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
  const Icon = iconMap[icon];

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition",
        active ? "bg-primary text-primary-foreground shadow-soft" : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );
}

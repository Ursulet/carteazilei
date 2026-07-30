"use client";

import {
  Archive,
  BarChart3,
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  FileSearch,
  ImageIcon,
  LayoutDashboard,
  LibraryBig,
  ListTree,
  Network,
  Settings,
  FileText,
  Mail,
  ShieldCheck,
  KeyRound,
  MenuSquare,
  Activity,
  ShoppingBag,
  Tags,
  Users,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import type { AdminSection, AdminSectionId } from "@/lib/auth/access";

const sectionIcons: Record<AdminSectionId, LucideIcon> = {
  dashboard: LayoutDashboard,
  readiness: ClipboardCheck,
  books: BookOpen,
  authors: LibraryBig,
  "daily-features": CalendarDays,
  lists: ListTree,
  taxonomies: Tags,
  relationships: Network,
  pages: FileText,
  recommendations: BarChart3,
  messages: Mail,
  media: ImageIcon,
  seo: FileSearch,
  retailers: ShoppingBag,
  editors: Users,
  roles: ShieldCheck,
  permissions: KeyRound,
  settings: Settings,
  navigation: MenuSquare,
  audit: Archive,
  system: Activity,
};

export function AdminNavigation({
  sections,
  onNavigate,
}: {
  sections: readonly AdminSection[];
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <nav className="grid gap-5" aria-label="Navigare administrare">
      {[...new Set(sections.map((section) => section.group))].map((group) => <div key={group} className="grid gap-1">
        <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-muted">{group}</p>
        {sections.filter((section) => section.group === group).map((section) => {
        const Icon = sectionIcons[section.id];
        const active =
          section.href === "/admin"
            ? pathname === section.href
            : pathname === section.href || pathname.startsWith(`${section.href}/`);

        return (
          <Link
            key={section.id}
            href={section.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors ${
              active
                ? "bg-accent-soft text-brand"
                : "text-muted hover:bg-paper hover:text-foreground"
            }`}
          >
            <Icon aria-hidden="true" className="size-[1.125rem] shrink-0" />
            {section.label}
          </Link>
        );
        })}
      </div>)}
    </nav>
  );
}

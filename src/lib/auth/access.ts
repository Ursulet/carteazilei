import type { PermissionCode } from "./permissions";
import { hasPermission } from "./permissions";

export type RoleCode = string;

export const roleLabels: Record<string, string> = {
  super_admin: "Super Admin",
  admin: "Administrator",
  editor: "Editor",
  commercial_manager: "Manager comercial",
  support: "Support",
  analyst: "Analist",
};

export const adminSections = [
  { id: "dashboard", group: "General", href: "/admin", label: "Dashboard", description: "Starea editorială și operațională", viewPermission: "dashboard.view", mutationPermission: "dashboard.view" },
  { id: "books", group: "Conținut", href: "/admin/books", label: "Cărți", description: "Catalogul editorial", viewPermission: "books.view", mutationPermission: "books.update" },
  { id: "readiness", group: "Conținut", href: "/admin/readiness", label: "Calitatea catalogului", description: "Cărți și pagini de completat", viewPermission: "books.view", mutationPermission: "books.update" },
  { id: "authors", group: "Conținut", href: "/admin/authors", label: "Autori", description: "Profiluri și surse", viewPermission: "authors.manage", mutationPermission: "authors.manage" },
  { id: "daily-features", group: "Conținut", href: "/admin/daily-features", label: "Cartea Zilei", description: "Calendarul selecțiilor", viewPermission: "daily_features.manage", mutationPermission: "daily_features.manage" },
  { id: "lists", group: "Conținut", href: "/admin/lists", label: "Liste editoriale", description: "Liste, hub-uri și ghiduri", viewPermission: "lists.manage", mutationPermission: "lists.manage" },
  { id: "pages", group: "Conținut", href: "/admin/pages", label: "Pagini", description: "Pagini statice și legale", viewPermission: "pages.manage", mutationPermission: "pages.manage" },
  { id: "taxonomies", group: "Conținut", href: "/admin/taxonomies", label: "Taxonomii", description: "Genuri, teme și audiențe", viewPermission: "taxonomies.manage", mutationPermission: "taxonomies.manage" },
  { id: "relationships", group: "Conținut", href: "/admin/relationships", label: "Relații între cărți", description: "Similaritate și next reads", viewPermission: "relationships.manage", mutationPermission: "relationships.manage" },
  { id: "recommendations", group: "Analiză", href: "/admin/recommendations", label: "Recomandări și performanță", description: "Sesiuni, rezultate și configurare", viewPermission: "recommendations.view", mutationPermission: "recommendations.configure" },
  { id: "retailers", group: "Comercial", href: "/admin/retailers", label: "Parteneri și oferte", description: "Parteneri, oferte și afiliere", viewPermission: "partners.manage", mutationPermission: "partners.manage" },
  { id: "messages", group: "Comunicare", href: "/admin/messages", label: "Mesaje", description: "Inbox-ul formularului de contact", viewPermission: "contact_messages.view", mutationPermission: "contact_messages.manage" },
  { id: "media", group: "Resurse", href: "/admin/media", label: "Bibliotecă media", description: "Imagini și atribuiri", viewPermission: "media.view", mutationPermission: "media.manage" },
  { id: "editors", group: "Utilizatori și acces", href: "/admin/editors", label: "Utilizatori și editori", description: "Conturi, profiluri, status și sesiuni", viewPermission: "users.view", mutationPermission: "users.update" },
  { id: "roles", group: "Utilizatori și acces", href: "/admin/roles", label: "Roluri și permisiuni", description: "Matricea RBAC", viewPermission: "roles.view", mutationPermission: "roles.manage" },
  { id: "permissions", group: "Utilizatori și acces", href: "/admin/permissions", label: "Permisiuni", description: "Catalogul drepturilor de sistem", viewPermission: "permissions.view", mutationPermission: "permissions.manage" },
  { id: "settings", group: "Configurare", href: "/admin/settings", label: "Setări site", description: "Identitate, branding și funcționalități", viewPermission: "site_settings.view", mutationPermission: "site_settings.update" },
  { id: "seo", group: "Configurare", href: "/admin/seo", label: "SEO", description: "Indexare și metadata", viewPermission: "seo.view", mutationPermission: "seo.manage" },
  { id: "navigation", group: "Configurare", href: "/admin/navigation", label: "Navigație", description: "Meniul principal și footer", viewPermission: "navigation.manage", mutationPermission: "navigation.manage" },
  { id: "audit", group: "Sistem", href: "/admin/audit", label: "Audit log", description: "Istoricul operațiilor sensibile", viewPermission: "audit_logs.view", mutationPermission: "audit_logs.view" },
  { id: "system", group: "Sistem", href: "/admin/system", label: "Status sistem", description: "Storage și stare operațională", viewPermission: "system.view", mutationPermission: "system.view" },
] as const satisfies ReadonlyArray<{
  id: string;
  group: string;
  href: string;
  label: string;
  description: string;
  viewPermission: PermissionCode;
  mutationPermission: PermissionCode;
}>;

export type AdminSectionId = (typeof adminSections)[number]["id"];
export type AdminSection = (typeof adminSections)[number];

export const adminNavigationSections = adminSections.filter(
  (section) => section.id !== "permissions",
);

export function canAccessSection(
  permissions: readonly string[],
  sectionId: AdminSectionId,
  isSuperAdmin = false,
) {
  const section = adminSections.find((item) => item.id === sectionId);
  return Boolean(section && hasPermission(permissions, section.viewPermission, isSuperAdmin));
}

export function canMutateSection(
  permissions: readonly string[],
  sectionId: AdminSectionId,
  isSuperAdmin = false,
) {
  const section = adminSections.find((item) => item.id === sectionId);
  return Boolean(section && hasPermission(permissions, section.mutationPermission, isSuperAdmin));
}

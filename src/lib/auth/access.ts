export type RoleCode = "admin" | "editor" | "analyst";

export const roleLabels: Record<RoleCode, string> = {
  admin: "Administrator",
  editor: "Editor",
  analyst: "Analist",
};

export const adminSections = [
  {
    id: "dashboard",
    href: "/admin",
    label: "Dashboard",
    description: "Starea editorială și operațională",
    roles: ["admin", "editor", "analyst"],
  },
  {
    id: "books",
    href: "/admin/books",
    label: "Cărți",
    description: "Catalogul editorial",
    roles: ["admin", "editor"],
  },
  {
    id: "readiness",
    href: "/admin/readiness",
    label: "Readiness editorial",
    description: "Lipsuri de conținut și pregătirea lansării",
    roles: ["admin", "editor"],
  },
  {
    id: "authors",
    href: "/admin/authors",
    label: "Autori",
    description: "Profiluri și surse",
    roles: ["admin", "editor"],
  },
  {
    id: "daily-features",
    href: "/admin/daily-features",
    label: "Cartea Zilei",
    description: "Calendarul selecțiilor",
    roles: ["admin", "editor"],
  },
  {
    id: "lists",
    href: "/admin/lists",
    label: "Liste editoriale",
    description: "Liste, hub-uri și ghiduri",
    roles: ["admin", "editor"],
  },
  {
    id: "taxonomies",
    href: "/admin/taxonomies",
    label: "Taxonomii",
    description: "Genuri, teme și audiențe",
    roles: ["admin", "editor"],
  },
  {
    id: "relationships",
    href: "/admin/relationships",
    label: "Relații între cărți",
    description: "Similaritate și next reads",
    roles: ["admin", "editor"],
  },
  {
    id: "recommendations",
    href: "/admin/recommendations",
    label: "Recomandări",
    description: "Feedback și performanța motorului",
    roles: ["admin", "analyst"],
  },
  {
    id: "media",
    href: "/admin/media",
    label: "Media",
    description: "Coperte și atribuiri",
    roles: ["admin", "editor"],
  },
  {
    id: "seo",
    href: "/admin/seo",
    label: "SEO",
    description: "Indexare și metadata",
    roles: ["admin", "editor"],
  },
  {
    id: "retailers",
    href: "/admin/retailers",
    label: "Parteneri comerciali",
    description: "Parteneri, oferte și afiliere",
    roles: ["admin"],
  },
  {
    id: "editors",
    href: "/admin/editors",
    label: "Utilizatori și editori",
    description: "Roluri și profile interne",
    roles: ["admin"],
  },
  {
    id: "settings",
    href: "/admin/settings",
    label: "Setări",
    description: "Configurare operațională",
    roles: ["admin"],
  },
  {
    id: "audit",
    href: "/admin/audit",
    label: "Audit log",
    description: "Istoricul operațiilor sensibile",
    roles: ["admin"],
  },
] as const satisfies ReadonlyArray<{
  id: string;
  href: string;
  label: string;
  description: string;
  roles: readonly RoleCode[];
}>;

export type AdminSectionId = (typeof adminSections)[number]["id"];
export type AdminSection = (typeof adminSections)[number];

export function canAccessSection(roles: readonly RoleCode[], sectionId: AdminSectionId) {
  const section = adminSections.find((item) => item.id === sectionId);
  return Boolean(
    section &&
      roles.some((role) => (section.roles as readonly RoleCode[]).includes(role)),
  );
}

export function canMutateSection(roles: readonly RoleCode[], sectionId: AdminSectionId) {
  if (roles.includes("admin")) {
    return true;
  }

  if (roles.includes("analyst")) {
    return false;
  }

  return canAccessSection(roles, sectionId) && sectionId !== "recommendations";
}

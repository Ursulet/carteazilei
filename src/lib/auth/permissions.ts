export const permissionDefinitions = [
  ["dashboard.view", "Dashboard", "Vizualizare sumar operațional", "Dashboard", false],
  ["users.view", "Vizualizare utilizatori", "Listă, detalii și activitate", "Utilizatori", false],
  ["users.create", "Creare utilizatori", "Creare și invitare conturi", "Utilizatori", false],
  ["users.update", "Editare utilizatori", "Date, roluri și status", "Utilizatori", true],
  ["users.suspend", "Suspendare utilizatori", "Suspendare și revocare sesiuni", "Utilizatori", true],
  ["users.delete", "Arhivare utilizatori", "Arhivare sau ștergere logică", "Utilizatori", true],
  ["roles.view", "Vizualizare roluri", "Roluri și matrice permisiuni", "Acces", false],
  ["roles.manage", "Administrare roluri", "Creare roluri și asignare permisiuni", "Acces", true],
  ["permissions.view", "Vizualizare permisiuni", "Catalogul permisiunilor", "Acces", false],
  ["permissions.manage", "Administrare permisiuni", "Modificarea permisiunilor de sistem", "Acces", true],
  ["books.view", "Vizualizare cărți", "Catalog editorial", "Conținut", false],
  ["books.create", "Creare cărți", "Adăugare titluri", "Conținut", false],
  ["books.update", "Editare cărți", "Fișă editorială și ediții", "Conținut", false],
  ["books.publish", "Publicare cărți", "Schimbarea statusului public", "Conținut", true],
  ["books.delete", "Arhivare cărți", "Ștergere logică", "Conținut", true],
  ["authors.manage", "Administrare autori", "Profiluri de autor", "Conținut", false],
  ["daily_features.manage", "Cartea Zilei", "Planificare și publicare", "Conținut", false],
  ["lists.manage", "Liste editoriale", "Creare și publicare liste", "Conținut", false],
  ["pages.manage", "Pagini statice", "Creare și publicare pagini", "Conținut", false],
  ["taxonomies.manage", "Taxonomii", "Genuri, teme și audiențe", "Conținut", false],
  ["relationships.manage", "Relații între cărți", "Similaritate și lecturi următoare", "Conținut", false],
  ["recommendations.view", "Vizualizare recomandări", "Sesiuni, rezultate și feedback", "Recomandări", false],
  ["recommendations.configure", "Configurare recomandări", "Ponderi și praguri algoritm", "Recomandări", true],
  ["partners.manage", "Administrare parteneri", "Edituri, librării și marketplace-uri", "Comercial", false],
  ["offers.manage", "Administrare oferte", "Prețuri și linkuri comerciale", "Comercial", false],
  ["commercial.analytics", "Rapoarte comerciale", "Clickuri și CTR", "Comercial", false],
  ["analytics.view", "Vizualizare analytics", "Rapoarte de produs și SEO", "Analytics", false],
  ["media.view", "Vizualizare Media", "Biblioteca de fișiere", "Media", false],
  ["media.manage", "Administrare Media", "Încărcare și metadate", "Media", false],
  ["media.delete", "Ștergere Media", "Arhivarea fișierelor nefolosite", "Media", true],
  ["seo.view", "Vizualizare SEO", "Stare indexare și performanță SEO", "Configurare", false],
  ["seo.manage", "Administrare SEO", "Metadate și indexare", "Configurare", false],
  ["site_settings.view", "Vizualizare setări", "Setările globale ale site-ului", "Configurare", false],
  ["site_settings.update", "Modificare setări", "Identitate, branding și funcționalități", "Configurare", true],
  ["navigation.manage", "Administrare navigație", "Header și footer", "Configurare", false],
  ["whatsapp.manage", "Administrare WhatsApp", "Buton, program și tracking", "Comunicare", false],
  ["contact_messages.view", "Vizualizare mesaje", "Inbox contact", "Comunicare", false],
  ["contact_messages.reply", "Răspuns mesaje", "Răspunsuri și note interne", "Comunicare", false],
  ["contact_messages.manage", "Gestionare mesaje", "Status, atribuire și spam", "Comunicare", false],
  ["contact_messages.delete", "Ștergere mesaje", "Ștergere conform retenției", "Comunicare", true],
  ["audit_logs.view", "Vizualizare audit", "Jurnalul operațiunilor sensibile", "Sistem", true],
  ["system.view", "Status sistem", "Stocare și stare operațională", "Sistem", false],
] as const;

export type PermissionCode = (typeof permissionDefinitions)[number][0];

export const allPermissionCodes = permissionDefinitions.map((item) => item[0]);

export const defaultRoleDefinitions: Array<{
  code: string;
  name: string;
  description: string;
  isSuperAdmin?: boolean;
  permissions: readonly PermissionCode[];
}> = [
  { code: "super_admin", name: "Super Admin", description: "Control complet asupra platformei și accesului.", isSuperAdmin: true, permissions: allPermissionCodes },
  { code: "admin", name: "Administrator", description: "Administrare operațională fără modificarea accesului critic.", permissions: allPermissionCodes.filter((code) => !["roles.manage", "permissions.manage", "system.view"].includes(code)) },
  { code: "editor", name: "Editor", description: "Catalog, publicare și conținut editorial.", permissions: ["dashboard.view", "books.view", "books.create", "books.update", "books.publish", "authors.manage", "daily_features.manage", "lists.manage", "pages.manage", "taxonomies.manage", "relationships.manage", "media.view", "media.manage", "seo.view", "seo.manage"] },
  { code: "commercial_manager", name: "Manager comercial", description: "Parteneri, oferte și rapoarte comerciale.", permissions: ["dashboard.view", "partners.manage", "offers.manage", "commercial.analytics", "media.view", "media.manage"] },
  { code: "support", name: "Support", description: "Mesaje, răspunsuri și relația cu vizitatorii.", permissions: ["dashboard.view", "contact_messages.view", "contact_messages.reply", "contact_messages.manage"] },
  { code: "analyst", name: "Analist", description: "Acces read-only la rapoarte și performanță.", permissions: ["dashboard.view", "recommendations.view", "commercial.analytics", "analytics.view", "seo.view"] },
];

export function hasPermission(
  permissions: readonly string[],
  permission: PermissionCode,
  isSuperAdmin = false,
) {
  return isSuperAdmin || permissions.includes(permission);
}

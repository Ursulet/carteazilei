import { sql } from "drizzle-orm";

import { createCliDatabaseConnection } from "@/db/cli";
import {
  audiences,
  genres,
  moods,
  permissions,
  readingTraits,
  rolePermissions,
  roles,
  themes,
} from "@/db/schema";
import { defaultRoleDefinitions, permissionDefinitions } from "@/lib/auth/permissions";

const genreSeed = [
  ["Ficțiune", "fictiune"],
  ["Fantasy", "fantasy"],
  ["Science-fiction", "science-fiction"],
  ["Thriller", "thriller"],
  ["Crime", "crime"],
  ["Romance", "romance"],
  ["Istorie", "istorie"],
  ["Business", "business"],
  ["Psihologie", "psihologie"],
  ["Dezvoltare personală", "dezvoltare-personala"],
  ["Parenting", "parenting"],
  ["Memorii", "memorii"],
  ["Acțiune și aventură", "actiune-si-aventura"],
  ["Artă și design", "arta-si-design"],
  ["Benzi desenate și romane grafice", "benzi-desenate-si-romane-grafice"],
  ["Biografie", "biografie"],
  ["Călătorii", "calatorii"],
  ["Cărți pentru copii", "carti-pentru-copii"],
  ["Distopie", "distopie"],
  ["Dramaturgie", "dramaturgie"],
  ["Economie și finanțe", "economie-si-finante"],
  ["Eseu", "eseu"],
  ["Ficțiune istorică", "fictiune-istorica"],
  ["Filosofie", "filosofie"],
  ["Gastronomie", "gastronomie"],
  ["Horror", "horror"],
  ["Literatură clasică", "literatura-clasica"],
  ["Literatură contemporană", "literatura-contemporana"],
  ["Mister", "mister"],
  ["Non-ficțiune", "non-fictiune"],
  ["Poezie", "poezie"],
  ["Politică și societate", "politica-si-societate"],
  ["Religie și spiritualitate", "religie-si-spiritualitate"],
  ["Sănătate și wellbeing", "sanatate-si-wellbeing"],
  ["Știință", "stiinta"],
  ["Tehnologie", "tehnologie"],
  ["True crime", "true-crime"],
  ["Umor și satiră", "umor-si-satira"],
] as const;

const themeSeed = [
  ["Sens", "sens"],
  ["Identitate", "identitate"],
  ["Putere", "putere"],
  ["Familie", "familie"],
  ["Doliu", "doliu"],
  ["Leadership", "leadership"],
  ["Productivitate", "productivitate"],
  ["Anxietate", "anxietate"],
] as const;

const moodSeed = [
  ["Captivant", "captivant"],
  ["Relaxant", "relaxant"],
  ["Emoționant", "emotionant"],
  ["Provocator", "provocator"],
  ["Optimist", "optimist"],
  ["Întunecat", "intunecat"],
  ["Inspirațional", "inspirational"],
] as const;

const audienceSeed = [
  { name: "Adulți", slug: "adulti", minimumAge: 18, maximumAge: null },
  { name: "Young adult", slug: "young-adult", minimumAge: 13, maximumAge: 18 },
  { name: "Copii 9–12 ani", slug: "copii-9-12", minimumAge: 9, maximumAge: 12 },
  { name: "Copii 6–8 ani", slug: "copii-6-8", minimumAge: 6, maximumAge: 8 },
  { name: "Lectură împreună", slug: "lectura-impreuna", minimumAge: 0, maximumAge: 8 },
] as const;

const readingTraitSeed = [
  ["pace", "Ritm"],
  ["complexity", "Complexitate"],
  ["emotional_intensity", "Intensitate emoțională"],
  ["world_building", "World-building"],
  ["romance", "Romance"],
  ["violence", "Violență"],
  ["philosophical_depth", "Profunzime filozofică"],
  ["practical_density", "Densitate practică"],
  ["ambiguity", "Ambiguitate"],
  ["humor", "Umor"],
] as const;

async function seed() {
  const { db, client } = createCliDatabaseConnection();

  try {
    await db.transaction(async (transaction) => {
      await transaction
        .insert(permissions)
        .values(permissionDefinitions.map(([code, name, description, group, dangerous]) => ({ code, name, description, group, dangerous })))
        .onConflictDoUpdate({ target: permissions.code, set: { name: sql`excluded.name`, description: sql`excluded.description`, group: sql`excluded.group_name`, dangerous: sql`excluded.dangerous`, updatedAt: new Date() } });

      await transaction
        .insert(roles)
        .values(defaultRoleDefinitions.map((role) => ({ code: role.code, name: role.name, description: role.description, isSystem: true, isSuperAdmin: role.isSuperAdmin ?? false, active: true })))
        .onConflictDoUpdate({
          target: roles.code,
          set: {
            name: sql`excluded.name`,
            description: sql`excluded.description`,
            isSystem: true,
            isSuperAdmin: sql`excluded.is_super_admin`,
            updatedAt: new Date(),
          },
        });

      const [seededRoles, seededPermissions] = await Promise.all([
        transaction.select({ id: roles.id, code: roles.code }).from(roles),
        transaction.select({ id: permissions.id, code: permissions.code }).from(permissions),
      ]);
      const roleIds = new Map(seededRoles.map((role) => [role.code, role.id]));
      const permissionIds = new Map(seededPermissions.map((permission) => [permission.code, permission.id]));
      await transaction.insert(rolePermissions).values(defaultRoleDefinitions.flatMap((role) => role.permissions.map((permission) => ({ roleId: roleIds.get(role.code)!, permissionId: permissionIds.get(permission)! })))).onConflictDoNothing();

      await transaction
        .insert(genres)
        .values(genreSeed.map(([name, slug]) => ({ name, slug })))
        .onConflictDoUpdate({
          target: genres.slug,
          set: { name: sql`excluded.name`, updatedAt: new Date() },
        });

      await transaction
        .insert(themes)
        .values(themeSeed.map(([name, slug]) => ({ name, slug })))
        .onConflictDoUpdate({
          target: themes.slug,
          set: { name: sql`excluded.name`, updatedAt: new Date() },
        });

      await transaction
        .insert(moods)
        .values(moodSeed.map(([name, slug]) => ({ name, slug })))
        .onConflictDoUpdate({
          target: moods.slug,
          set: { name: sql`excluded.name`, updatedAt: new Date() },
        });

      await transaction
        .insert(audiences)
        .values(audienceSeed.map((audience) => ({ ...audience })))
        .onConflictDoUpdate({
          target: audiences.slug,
          set: {
            name: sql`excluded.name`,
            minimumAge: sql`excluded.minimum_age`,
            maximumAge: sql`excluded.maximum_age`,
            updatedAt: new Date(),
          },
        });

      await transaction
        .insert(readingTraits)
        .values(readingTraitSeed.map(([code, name]) => ({ code, name })))
        .onConflictDoUpdate({
          target: readingTraits.code,
          set: { name: sql`excluded.name`, updatedAt: new Date() },
        });
    });
  } finally {
    await client.end({ timeout: 5 });
  }
}

seed().catch((error: unknown) => {
  console.error("Seed-ul taxonomiilor a eșuat.", error);
  process.exitCode = 1;
});

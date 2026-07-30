import "server-only";

import { asc, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";

import { getDb } from "@/db";
import { permissions, rolePermissions, roles, userRoles } from "@/db/schema";
import { EditorialServiceError } from "@/domain/editorial/action-state";
import { optionalStringValue, stringValue, zodFieldErrors } from "@/domain/editorial/form-data";
import { writeAuditLog } from "@/lib/audit/service";
import { slugify } from "@/lib/slug";

const roleInputSchema = z.object({
  name: z.string().trim().min(2, "Numele rolului este obligatoriu.").max(100),
  description: z.string().trim().max(500).optional(),
  permissionIds: z.array(z.uuid()).min(1, "Alege cel puțin o permisiune."),
  active: z.boolean(),
});

export function parseRoleFormData(formData: FormData) {
  const parsed = roleInputSchema.safeParse({
    name: stringValue(formData, "name"),
    description: optionalStringValue(formData, "description"),
    permissionIds: formData.getAll("permissionIds").map(String),
    active: formData.has("active"),
  });
  if (!parsed.success) throw new EditorialServiceError("Corectează câmpurile rolului.", zodFieldErrors(parsed.error));
  return parsed.data;
}

export async function getRoleAdministration() {
  const db = getDb();
  const [roleRows, permissionRows, assignmentRows] = await Promise.all([
    db.select({ id: roles.id, code: roles.code, name: roles.name, description: roles.description, active: roles.active, isSystem: roles.isSystem, isSuperAdmin: roles.isSuperAdmin, createdAt: roles.createdAt, users: sql<number>`count(distinct ${userRoles.userId})::int` })
      .from(roles).leftJoin(userRoles, eq(userRoles.roleId, roles.id)).groupBy(roles.id).orderBy(asc(roles.name)),
    db.select().from(permissions).orderBy(asc(permissions.group), asc(permissions.name)),
    db.select({ roleId: rolePermissions.roleId, permissionId: rolePermissions.permissionId }).from(rolePermissions),
  ]);
  const permissionMap = new Map<string, string[]>();
  for (const row of assignmentRows) permissionMap.set(row.roleId, [...(permissionMap.get(row.roleId) ?? []), row.permissionId]);
  return { roles: roleRows.map((role) => ({ ...role, permissionIds: permissionMap.get(role.id) ?? [] })), permissions: permissionRows };
}

export async function getAdminRole(roleId: string) {
  const parsed = z.uuid().safeParse(roleId);
  if (!parsed.success) return null;
  const data = await getRoleAdministration();
  return data.roles.find((role) => role.id === parsed.data) ?? null;
}

export async function saveRole(input: z.infer<typeof roleInputSchema>, actorUserId: string, roleId?: string) {
  const db = getDb();
  return db.transaction(async (transaction) => {
    const existing = roleId ? (await transaction.select().from(roles).where(eq(roles.id, roleId)).limit(1))[0] : null;
    if (roleId && !existing) throw new EditorialServiceError("Rolul nu mai există.");
    if (existing?.isSuperAdmin) throw new EditorialServiceError("Rolul Super Admin este protejat și nu poate fi modificat.");

    const selectedPermissions = await transaction.select({ id: permissions.id }).from(permissions).where(inArray(permissions.id, input.permissionIds));
    if (selectedPermissions.length !== new Set(input.permissionIds).size) throw new EditorialServiceError("Una dintre permisiuni nu mai există.");

    let savedId: string;
    if (existing) {
      const [saved] = await transaction.update(roles).set({ name: input.name, description: input.description ?? null, active: input.active, updatedAt: new Date() }).where(eq(roles.id, existing.id)).returning({ id: roles.id });
      savedId = saved!.id;
      await transaction.delete(rolePermissions).where(eq(rolePermissions.roleId, savedId));
    } else {
      const baseCode = slugify(input.name).replaceAll("-", "_");
      const [saved] = await transaction.insert(roles).values({ code: `${baseCode}_${crypto.randomUUID().slice(0, 6)}`, name: input.name, description: input.description ?? null, active: input.active, isSystem: false, createdBy: actorUserId }).returning({ id: roles.id });
      savedId = saved!.id;
    }
    await transaction.insert(rolePermissions).values(selectedPermissions.map((permission) => ({ roleId: savedId, permissionId: permission.id, assignedBy: actorUserId })));
    await writeAuditLog({ actorUserId, action: existing ? "role.edit" : "role.create", entityType: "role", entityId: savedId, diff: { name: input.name, active: input.active, permissionIds: input.permissionIds } }, transaction);
    return savedId;
  });
}

export async function deleteRole(roleId: string, actorUserId: string) {
  const db = getDb();
  await db.transaction(async (transaction) => {
    const [role] = await transaction.select().from(roles).where(eq(roles.id, roleId)).limit(1);
    if (!role) throw new EditorialServiceError("Rolul nu mai există.");
    if (role.isSystem || role.isSuperAdmin) throw new EditorialServiceError("Rolurile de sistem nu pot fi șterse.");
    const [usage] = await transaction.select({ userId: userRoles.userId }).from(userRoles).where(eq(userRoles.roleId, roleId)).limit(1);
    if (usage) throw new EditorialServiceError("Rolul este atribuit unor utilizatori. Elimină mai întâi atribuirile.");
    await transaction.delete(roles).where(eq(roles.id, roleId));
    await writeAuditLog({ actorUserId, action: "role.delete", entityType: "role", entityId: roleId, diff: { name: role.name, code: role.code } }, transaction);
  });
}

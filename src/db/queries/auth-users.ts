import { and, eq, isNull, sql } from "drizzle-orm";

import type { Database } from "@/db";
import { permissions, rolePermissions, roles, userRoles, users } from "@/db/schema";

type AuthUserLookup = {
  id: string;
  email: string;
  name: string;
  passwordHash: string | null;
  sessionVersion: number;
  roles: string[];
  roleNames: string[];
  permissions: string[];
  isSuperAdmin: boolean;
  mustResetPassword: boolean;
};

function uniqueStrings(values: Array<string | null>): string[] {
  return [...new Set(values.filter((value): value is string => value !== null))];
}

async function selectAuthUser(db: Database, predicate: ReturnType<typeof eq>) {
  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      passwordHash: users.passwordHash,
      sessionVersion: users.sessionVersion,
      mustResetPassword: users.mustResetPassword,
      role: roles.code,
      roleName: roles.name,
      isSuperAdmin: roles.isSuperAdmin,
      permission: permissions.code,
    })
    .from(users)
    .leftJoin(userRoles, eq(users.id, userRoles.userId))
    .leftJoin(roles, eq(userRoles.roleId, roles.id))
    .leftJoin(rolePermissions, eq(rolePermissions.roleId, roles.id))
    .leftJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
    .where(and(
      predicate,
      eq(users.active, true),
      isNull(users.deletedAt),
      sql`(${users.status} = 'active' or (${users.status} = 'suspended' and ${users.suspendedUntil} <= now()))`,
    ));

  const firstRow = rows[0];

  if (!firstRow) {
    return null;
  }

  return {
    id: firstRow.id,
    email: firstRow.email,
    name: firstRow.name,
    passwordHash: firstRow.passwordHash,
    sessionVersion: firstRow.sessionVersion,
    roles: uniqueStrings(rows.map((row) => row.role)),
    roleNames: uniqueStrings(rows.map((row) => row.roleName)),
    permissions: uniqueStrings(rows.map((row) => row.permission)),
    isSuperAdmin: rows.some((row) => row.isSuperAdmin),
    mustResetPassword: firstRow.mustResetPassword,
  } satisfies AuthUserLookup;
}

export function getAuthUserByEmail(db: Database, email: string) {
  return selectAuthUser(db, sql`lower(${users.email}) = lower(${email})`);
}

export function getAuthUserById(db: Database, userId: string) {
  return selectAuthUser(db, eq(users.id, userId));
}

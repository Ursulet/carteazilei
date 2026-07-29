import { and, eq, isNull, sql } from "drizzle-orm";

import type { Database } from "@/db";
import { roles, userRoles, users } from "@/db/schema";
import type { RoleCode } from "@/lib/auth/access";

type AuthUserLookup = {
  id: string;
  email: string;
  name: string;
  passwordHash: string | null;
  sessionVersion: number;
  roles: RoleCode[];
};

function uniqueRoles(values: Array<RoleCode | null>): RoleCode[] {
  return [...new Set(values.filter((value): value is RoleCode => value !== null))];
}

async function selectAuthUser(db: Database, predicate: ReturnType<typeof eq>) {
  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      passwordHash: users.passwordHash,
      sessionVersion: users.sessionVersion,
      role: roles.code,
    })
    .from(users)
    .leftJoin(userRoles, eq(users.id, userRoles.userId))
    .leftJoin(roles, eq(userRoles.roleId, roles.id))
    .where(and(predicate, eq(users.active, true), isNull(users.deletedAt)));

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
    roles: uniqueRoles(rows.map((row) => row.role)),
  } satisfies AuthUserLookup;
}

export function getAuthUserByEmail(db: Database, email: string) {
  return selectAuthUser(db, sql`lower(${users.email}) = lower(${email})`);
}

export function getAuthUserById(db: Database, userId: string) {
  return selectAuthUser(db, eq(users.id, userId));
}


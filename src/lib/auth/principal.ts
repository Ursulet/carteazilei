import "server-only";

import { cache } from "react";

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { getDb } from "@/db";
import { getAuthUserById } from "@/db/queries/auth-users";
import {
  canAccessSection,
  canMutateSection,
  type AdminSectionId,
} from "@/lib/auth/access";
import { hasPermission, type PermissionCode } from "@/lib/auth/permissions";
import { authOptions, SESSION_MAX_AGE_SECONDS } from "@/lib/auth/options";

export type InternalPrincipal = {
  id: string;
  email: string;
  name: string;
  roles: string[];
  roleNames: string[];
  permissions: string[];
  isSuperAdmin: boolean;
  mustResetPassword: boolean;
};

export const getInternalPrincipal = cache(async (): Promise<InternalPrincipal | null> => {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return null;
  }

  const sessionAge = Date.now() - session.user.authenticatedAt;

  if (sessionAge < 0 || sessionAge > SESSION_MAX_AGE_SECONDS * 1_000) {
    return null;
  }

  const account = await getAuthUserById(getDb(), session.user.id);

  if (
    !account ||
    account.roles.length === 0 ||
    account.sessionVersion !== session.user.sessionVersion
  ) {
    return null;
  }

  return {
    id: account.id,
    email: account.email,
    name: account.name,
    roles: account.roles,
    roleNames: account.roleNames,
    permissions: account.permissions,
    isSuperAdmin: account.isSuperAdmin,
    mustResetPassword: account.mustResetPassword,
  };
});

export async function requireInternalPrincipal() {
  const principal = await getInternalPrincipal();

  if (!principal) {
    redirect("/admin/login");
  }

  return principal;
}

export async function requireSectionAccess(sectionId: AdminSectionId) {
  const principal = await requireInternalPrincipal();

  if (principal.mustResetPassword) {
    redirect("/admin/account?reset=1");
  }

  if (!canAccessSection(principal.permissions, sectionId, principal.isSuperAdmin)) {
    redirect("/admin/interzis");
  }

  return principal;
}

export async function requireMutationAccess(sectionId: AdminSectionId) {
  const principal = await requireSectionAccess(sectionId);

  if (!canMutateSection(principal.permissions, sectionId, principal.isSuperAdmin)) {
    throw new Error("Acțiunea nu este permisă pentru rolul curent.");
  }

  return principal;
}

export async function requirePermission(permission: PermissionCode) {
  const principal = await requireInternalPrincipal();
  if (!hasPermission(principal.permissions, permission, principal.isSuperAdmin)) {
    throw new Error("Acțiunea nu este permisă pentru rolul curent.");
  }
  return principal;
}

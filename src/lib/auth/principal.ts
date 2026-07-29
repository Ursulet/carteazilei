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
  type RoleCode,
} from "@/lib/auth/access";
import { authOptions, SESSION_MAX_AGE_SECONDS } from "@/lib/auth/options";

export type InternalPrincipal = {
  id: string;
  email: string;
  name: string;
  roles: RoleCode[];
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

  if (!canAccessSection(principal.roles, sectionId)) {
    redirect("/admin/interzis");
  }

  return principal;
}

export async function requireMutationAccess(sectionId: AdminSectionId) {
  const principal = await requireSectionAccess(sectionId);

  if (!canMutateSection(principal.roles, sectionId)) {
    throw new Error("Acțiunea nu este permisă pentru rolul curent.");
  }

  return principal;
}

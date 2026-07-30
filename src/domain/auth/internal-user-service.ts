import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { and, countDistinct, eq, inArray, isNull, ne, sql } from "drizzle-orm";
import { z } from "zod";

import { getDb, type Database } from "@/db";
import { editors, mediaAssets, roles, userRoles, users } from "@/db/schema";
import { EditorialServiceError } from "@/domain/editorial/action-state";
import { optionalStringValue, stringValue, zodFieldErrors } from "@/domain/editorial/form-data";
import { writeAuditLog } from "@/lib/audit/service";
import { bootstrapPasswordSchema, hashPassword, verifyPassword } from "@/lib/auth/password";

const userStatusSchema = z.enum(["invited", "active", "suspended", "disabled", "archived"]);
const internalUserInputSchema = z.object({
  name: z.string().trim().min(2, "Numele este obligatoriu.").max(100),
  email: z.email("Introdu o adresă validă.").max(254).transform((value) => value.trim().toLowerCase()),
  avatarAssetId: z.uuid().optional(),
  phone: z.string().trim().max(50).optional(),
  internalNotes: z.string().trim().max(2_000).optional(),
  locale: z.string().trim().min(2).max(10),
  timezone: z.string().trim().min(3).max(100),
  status: userStatusSchema,
  suspendedUntil: z.coerce.date().optional(),
  roleIds: z.array(z.uuid()).min(1, "Alege cel puțin un rol."),
  newPassword: z.union([bootstrapPasswordSchema, z.literal("")]).transform((value) => value || undefined),
  invite: z.boolean(),
  mustResetPassword: z.boolean(),
}).superRefine((value, context) => {
  if (value.status === "suspended" && !value.suspendedUntil) context.addIssue({ code: "custom", path: ["suspendedUntil"], message: "Alege data până la care este suspendat contul." });
});

export type InternalUserInput = z.infer<typeof internalUserInputSchema>;

export function parseInternalUserFormData(formData: FormData, creating: boolean) {
  const parsed = internalUserInputSchema.safeParse({
    name: stringValue(formData, "name"),
    email: stringValue(formData, "email"),
    avatarAssetId: optionalStringValue(formData, "avatarAssetId"),
    phone: optionalStringValue(formData, "phone"),
    internalNotes: optionalStringValue(formData, "internalNotes"),
    locale: stringValue(formData, "locale") || "ro",
    timezone: stringValue(formData, "timezone") || "Europe/Bucharest",
    status: creating && formData.has("invite") ? "invited" : stringValue(formData, "status") || "active",
    suspendedUntil: optionalStringValue(formData, "suspendedUntil"),
    roleIds: formData.getAll("roleIds").map(String),
    newPassword: stringValue(formData, "newPassword"),
    invite: creating && formData.has("invite"),
    mustResetPassword: formData.has("mustResetPassword"),
  });
  if (!parsed.success) throw new EditorialServiceError("Corectează câmpurile marcate.", zodFieldErrors(parsed.error));
  if (creating && !parsed.data.invite && !parsed.data.newPassword) throw new EditorialServiceError("Setează o parolă inițială sau trimite o invitație.", { newPassword: ["Completează parola sau selectează invitația."] });
  return parsed.data;
}

export async function getAssignableRoles() {
  return getDb().select({ id: roles.id, code: roles.code, name: roles.name, description: roles.description, isSuperAdmin: roles.isSuperAdmin }).from(roles).where(eq(roles.active, true)).orderBy(roles.name);
}

export async function getAdminInternalUser(userId: string, db: Pick<Database, "select"> = getDb()) {
  const parsedId = z.uuid().safeParse(userId);
  if (!parsedId.success) return null;
  const [account, assignedRoles] = await Promise.all([
    db.select({
      id: users.id, name: users.name, email: users.email, active: users.active, status: users.status,
      avatarAssetId: users.avatarAssetId, phone: users.phone, internalNotes: users.internalNotes, locale: users.locale, timezone: users.timezone,
      suspendedUntil: users.suspendedUntil, lastLoginAt: users.lastLoginAt, createdAt: users.createdAt,
      mustResetPassword: users.mustResetPassword, twoFactorEnabled: users.twoFactorEnabled,
    }).from(users).where(and(eq(users.id, parsedId.data), isNull(users.deletedAt))).limit(1),
    db.select({ id: roles.id, code: roles.code, name: roles.name, isSuperAdmin: roles.isSuperAdmin }).from(userRoles).innerJoin(roles, eq(roles.id, userRoles.roleId)).where(eq(userRoles.userId, parsedId.data)),
  ]);
  return account[0] ? { ...account[0], roleIds: assignedRoles.map((item) => item.id), roles: assignedRoles.map((item) => item.code), roleNames: assignedRoles.map((item) => item.name), isSuperAdmin: assignedRoles.some((item) => item.isSuperAdmin) } : null;
}

async function otherActiveSuperAdmins(targetUserId: string, db: Pick<Database, "select">) {
  const [result] = await db.select({ total: countDistinct(users.id) }).from(users)
    .innerJoin(userRoles, eq(userRoles.userId, users.id)).innerJoin(roles, eq(roles.id, userRoles.roleId))
    .where(and(ne(users.id, targetUserId), eq(users.active, true), eq(users.status, "active"), isNull(users.deletedAt), eq(roles.isSuperAdmin, true)));
  return Number(result?.total ?? 0);
}

function invitationCredentials() {
  const token = randomBytes(32).toString("base64url");
  return { token, tokenHash: createHash("sha256").update(token).digest("hex"), expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1_000) };
}

export async function saveInternalUser(input: InternalUserInput, actorUserId: string, targetUserId?: string) {
  const db = getDb();
  const invitation = !targetUserId && input.invite ? invitationCredentials() : null;
  const passwordHash = input.newPassword ? await hashPassword(input.newPassword) : invitation ? await hashPassword(`${randomBytes(32).toString("hex")}Aa1`) : undefined;
  try {
    return await db.transaction(async (transaction) => {
      const existing = targetUserId ? await getAdminInternalUser(targetUserId, transaction) : null;
      if (targetUserId && !existing) throw new EditorialServiceError("Utilizatorul nu mai există.");
      if (targetUserId === actorUserId) throw new EditorialServiceError("Modifică propriul email sau parola din «Contul meu».");

      if (input.avatarAssetId) {
        const [avatar] = await transaction.select({ id: mediaAssets.id }).from(mediaAssets).where(and(eq(mediaAssets.id, input.avatarAssetId), isNull(mediaAssets.deletedAt))).limit(1);
        if (!avatar) throw new EditorialServiceError("Imaginea de profil selectată nu mai este disponibilă.", { avatarAssetId: ["Alege altă imagine."] });
      }

      const roleRows = await transaction.select({ id: roles.id, code: roles.code, isSuperAdmin: roles.isSuperAdmin }).from(roles).where(and(inArray(roles.id, input.roleIds), eq(roles.active, true)));
      if (roleRows.length !== new Set(input.roleIds).size) throw new EditorialServiceError("Unul dintre rolurile selectate nu este disponibil.");
      const [actorAccess] = await transaction.select({ isSuperAdmin: roles.isSuperAdmin }).from(userRoles).innerJoin(roles, eq(roles.id, userRoles.roleId)).where(and(eq(userRoles.userId, actorUserId), eq(roles.isSuperAdmin, true))).limit(1);
      if ((roleRows.some((role) => role.isSuperAdmin) || existing?.isSuperAdmin) && !actorAccess?.isSuperAdmin) throw new EditorialServiceError("Numai un Super Admin poate administra accesul Super Admin.");
      const willBeActiveSuperAdmin = input.status === "active" && roleRows.some((role) => role.isSuperAdmin);
      if (existing?.isSuperAdmin && !willBeActiveSuperAdmin && (await otherActiveSuperAdmins(existing.id, transaction)) === 0) throw new EditorialServiceError("Nu poți suspenda, dezactiva sau elimina ultimul Super Admin activ.");

      const active = input.status === "active" || input.status === "suspended";
      let savedId: string;
      if (existing) {
        const rolesChanged = [...existing.roleIds].sort().join(",") !== [...input.roleIds].sort().join(",");
        const securityChanged = existing.email.toLowerCase() !== input.email || existing.status !== input.status || rolesChanged || Boolean(passwordHash) || input.mustResetPassword !== existing.mustResetPassword;
        const [saved] = await transaction.update(users).set({
          name: input.name, email: input.email, avatarAssetId: input.avatarAssetId ?? null, phone: input.phone ?? null, internalNotes: input.internalNotes ?? null,
          locale: input.locale, timezone: input.timezone, status: input.status, active,
          suspendedUntil: input.status === "suspended" ? input.suspendedUntil ?? null : null,
          mustResetPassword: input.mustResetPassword || Boolean(passwordHash),
          ...(passwordHash ? { passwordHash } : {}),
          ...(securityChanged ? { sessionVersion: sql`${users.sessionVersion} + 1` } : {}), updatedAt: new Date(),
        }).where(eq(users.id, existing.id)).returning({ id: users.id });
        savedId = saved!.id;
        await transaction.delete(userRoles).where(eq(userRoles.userId, savedId));
      } else {
        const [saved] = await transaction.insert(users).values({
          name: input.name, email: input.email, avatarAssetId: input.avatarAssetId ?? null, phone: input.phone ?? null, internalNotes: input.internalNotes ?? null,
          locale: input.locale, timezone: input.timezone, status: invitation ? "invited" : input.status,
          active: invitation ? false : active, passwordHash: passwordHash!, createdBy: actorUserId,
          mustResetPassword: invitation ? true : input.mustResetPassword,
          invitationTokenHash: invitation?.tokenHash ?? null, invitationExpiresAt: invitation?.expiresAt ?? null,
        }).returning({ id: users.id });
        savedId = saved!.id;
      }
      await transaction.insert(userRoles).values(roleRows.map((role) => ({ userId: savedId, roleId: role.id, assignedBy: actorUserId })));
      await writeAuditLog({ actorUserId, action: existing ? "user.edit" : invitation ? "user.invite" : "user.create", entityType: "user", entityId: savedId, diff: { name: input.name, email: input.email, status: invitation ? "invited" : input.status, roles: roleRows.map((role) => role.code), passwordChanged: Boolean(input.newPassword), sessionsRevoked: Boolean(existing) } }, transaction);
      return { id: savedId, invitationToken: invitation?.token ?? null };
    });
  } catch (error) {
    if (error instanceof EditorialServiceError) throw error;
    if (typeof error === "object" && error !== null && "code" in error && error.code === "23505") throw new EditorialServiceError("Adresa de email este deja folosită.", { email: ["Alege altă adresă."] });
    throw error;
  }
}

export async function revokeUserSessions(targetUserId: string, actorUserId: string, forcePasswordReset = false) {
  if (targetUserId === actorUserId) throw new EditorialServiceError("Pentru contul propriu folosește «Contul meu».");
  const db = getDb();
  const [account] = await db.update(users).set({ sessionVersion: sql`${users.sessionVersion} + 1`, mustResetPassword: forcePasswordReset ? true : users.mustResetPassword, updatedAt: new Date() }).where(and(eq(users.id, targetUserId), isNull(users.deletedAt))).returning({ id: users.id });
  if (!account) throw new EditorialServiceError("Utilizatorul nu mai există.");
  await writeAuditLog({ actorUserId, action: forcePasswordReset ? "user.force_password_reset" : "user.sessions_revoke", entityType: "user", entityId: targetUserId });
}

export async function resendUserInvitation(targetUserId: string, actorUserId: string) {
  const invite = invitationCredentials();
  const db = getDb();
  const [account] = await db.update(users).set({ status: "invited", active: false, invitationTokenHash: invite.tokenHash, invitationExpiresAt: invite.expiresAt, sessionVersion: sql`${users.sessionVersion} + 1`, updatedAt: new Date() }).where(and(eq(users.id, targetUserId), isNull(users.deletedAt))).returning({ id: users.id });
  if (!account) throw new EditorialServiceError("Utilizatorul nu mai există.");
  await writeAuditLog({ actorUserId, action: "user.invitation_resend", entityType: "user", entityId: targetUserId });
  return invite.token;
}

export async function acceptUserInvitation(token: string, newPassword: string) {
  const password = bootstrapPasswordSchema.safeParse(newPassword);
  if (!password.success) throw new EditorialServiceError(password.error.issues[0]?.message ?? "Parola nu respectă cerințele.");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const db = getDb();
  const [account] = await db.select({ id: users.id }).from(users).where(and(eq(users.invitationTokenHash, tokenHash), eq(users.status, "invited"), sql`${users.invitationExpiresAt} > now()`, isNull(users.deletedAt))).limit(1);
  if (!account) throw new EditorialServiceError("Invitația este invalidă sau a expirat.");
  await db.update(users).set({ passwordHash: await hashPassword(password.data), status: "active", active: true, mustResetPassword: false, emailVerifiedAt: new Date(), invitationTokenHash: null, invitationExpiresAt: null, sessionVersion: sql`${users.sessionVersion} + 1`, updatedAt: new Date() }).where(eq(users.id, account.id));
  await writeAuditLog({ actorUserId: account.id, action: "user.invitation_accept", entityType: "user", entityId: account.id });
}

export async function deleteInternalUser(targetUserId: string, actorUserId: string) {
  if (targetUserId === actorUserId) throw new EditorialServiceError("Nu îți poți arhiva propriul cont.");
  const db = getDb();
  await db.transaction(async (transaction) => {
    const existing = await getAdminInternalUser(targetUserId, transaction);
    if (!existing) throw new EditorialServiceError("Utilizatorul nu mai există.");
    if (existing.isSuperAdmin && (await otherActiveSuperAdmins(targetUserId, transaction)) === 0) throw new EditorialServiceError("Nu poți arhiva ultimul Super Admin activ.");
    await transaction.update(users).set({ active: false, status: "archived", deletedAt: new Date(), sessionVersion: sql`${users.sessionVersion} + 1`, updatedAt: new Date() }).where(eq(users.id, targetUserId));
    await transaction.update(editors).set({ publicProfile: false, updatedAt: new Date() }).where(eq(editors.userId, targetUserId));
    await writeAuditLog({ actorUserId, action: "user.archive", entityType: "user", entityId: targetUserId, diff: { email: existing.email, roles: existing.roles } }, transaction);
  });
}

const ownAccountInputSchema = z.object({
  name: z.string().trim().min(2, "Numele este obligatoriu.").max(100),
  email: z.email("Introdu o adresă validă.").max(254).transform((value) => value.trim().toLowerCase()),
  currentPassword: z.string().min(1, "Parola curentă este obligatorie.").max(128),
  newPassword: z.union([bootstrapPasswordSchema, z.literal("")]).transform((value) => value || undefined),
  confirmPassword: z.string().max(128).optional(),
}).superRefine((value, context) => { if (value.newPassword && value.newPassword !== value.confirmPassword) context.addIssue({ code: "custom", path: ["confirmPassword"], message: "Parolele noi nu coincid." }); });

export function parseOwnAccountFormData(formData: FormData) { const parsed = ownAccountInputSchema.safeParse({ name: stringValue(formData, "name"), email: stringValue(formData, "email"), currentPassword: stringValue(formData, "currentPassword"), newPassword: stringValue(formData, "newPassword"), confirmPassword: optionalStringValue(formData, "confirmPassword") }); if (!parsed.success) throw new EditorialServiceError("Corectează câmpurile marcate.", zodFieldErrors(parsed.error)); return parsed.data; }

export async function updateOwnAccount(input: z.infer<typeof ownAccountInputSchema>, userId: string) {
  const db = getDb();
  const [account] = await db.select({ email: users.email, passwordHash: users.passwordHash, mustResetPassword: users.mustResetPassword }).from(users).where(and(eq(users.id, userId), eq(users.active, true), isNull(users.deletedAt))).limit(1);
  if (!account || !(await verifyPassword(account.passwordHash, input.currentPassword))) throw new EditorialServiceError("Parola curentă nu este corectă.", { currentPassword: ["Verifică parola introdusă."] });
  if (account.mustResetPassword && !input.newPassword) throw new EditorialServiceError("Administratorul a solicitat schimbarea parolei.", { newPassword: ["Alege o parolă nouă."] });
  const passwordHash = input.newPassword ? await hashPassword(input.newPassword) : undefined;
  const securityChanged = account.email.toLowerCase() !== input.email || Boolean(passwordHash);
  try {
    await db.transaction(async (transaction) => {
      await transaction.update(users).set({ name: input.name, email: input.email, ...(passwordHash ? { passwordHash, mustResetPassword: false } : {}), ...(securityChanged ? { sessionVersion: sql`${users.sessionVersion} + 1` } : {}), updatedAt: new Date() }).where(eq(users.id, userId));
      await writeAuditLog({ actorUserId: userId, action: "account.self_edit", entityType: "user", entityId: userId, diff: { emailChanged: account.email.toLowerCase() !== input.email, passwordChanged: Boolean(passwordHash), name: input.name } }, transaction);
    });
    return { securityChanged };
  } catch (error) { if (typeof error === "object" && error !== null && "code" in error && error.code === "23505") throw new EditorialServiceError("Adresa de email este deja folosită.", { email: ["Alege altă adresă."] }); throw error; }
}

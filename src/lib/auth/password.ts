import { argon2id, hash, verify } from "argon2";
import { z } from "zod";

const DUMMY_PASSWORD_HASH =
  "$argon2id$v=19$m=65536,p=1,t=3$N20iSUaDMWQt2xcx3G9gww$22HaVuHuqakFUJEdOUiNi/bCggC8HeTcpHJuQKADg2M";

const argonOptions = {
  type: argon2id,
  memoryCost: 65_536,
  timeCost: 3,
  parallelism: 1,
} as const;

export const bootstrapPasswordSchema = z
  .string()
  .min(14, "Parola trebuie să aibă minimum 14 caractere.")
  .max(128, "Parola poate avea maximum 128 de caractere.")
  .regex(/[a-z]/, "Parola trebuie să conțină o literă mică.")
  .regex(/[A-Z]/, "Parola trebuie să conțină o literă mare.")
  .regex(/[0-9]/, "Parola trebuie să conțină o cifră.");

export function hashPassword(password: string) {
  return hash(password, argonOptions);
}

export async function verifyPassword(passwordHash: string | null, password: string) {
  try {
    return await verify(passwordHash ?? DUMMY_PASSWORD_HASH, password);
  } catch {
    await verify(DUMMY_PASSWORD_HASH, password).catch(() => false);
    return false;
  }
}


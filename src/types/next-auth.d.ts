import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      sessionVersion: number;
      authenticatedAt: number;
    } & DefaultSession["user"];
  }

  interface User {
    sessionVersion: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    sessionVersion?: number;
    authenticatedAt?: number;
  }
}

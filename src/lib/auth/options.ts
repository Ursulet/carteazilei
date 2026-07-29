import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

import { authenticateInternalUser } from "@/lib/auth/credentials";

export const SESSION_MAX_AGE_SECONDS = 8 * 60 * 60;

export const authOptions: NextAuthOptions = {
  secret: process.env.AUTH_SECRET,
  useSecureCookies: process.env.NODE_ENV === "production",
  session: {
    strategy: "jwt",
    maxAge: SESSION_MAX_AGE_SECONDS,
  },
  jwt: {
    maxAge: SESSION_MAX_AGE_SECONDS,
  },
  pages: {
    signIn: "/admin/login",
    error: "/admin/login",
  },
  providers: [
    CredentialsProvider({
      name: "Echipa Cartea Zilei",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Parolă", type: "password" },
      },
      async authorize(credentials, request) {
        return authenticateInternalUser(credentials, request.headers ?? {});
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        token.sessionVersion = user.sessionVersion;
        token.authenticatedAt = Date.now();
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && token.userId) {
        session.user.id = token.userId;
        session.user.sessionVersion = token.sessionVersion ?? -1;
        session.user.authenticatedAt = token.authenticatedAt ?? 0;
      }

      return session;
    },
  },
};

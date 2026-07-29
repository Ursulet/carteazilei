import "server-only";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { getServerEnv } from "@/lib/env/server";

import * as schema from "./schema";

function createConnection() {
  const env = getServerEnv();
  const client = postgres(env.DATABASE_URL, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
  });

  return {
    client,
    db: drizzle(client, { schema }),
  };
}

type DatabaseConnection = ReturnType<typeof createConnection>;

const globalForDatabase = globalThis as typeof globalThis & {
  __carteaZileiDatabase?: DatabaseConnection;
};

let productionConnection: DatabaseConnection | undefined;

export function getDatabaseConnection(): DatabaseConnection {
  if (process.env.NODE_ENV === "development") {
    globalForDatabase.__carteaZileiDatabase ??= createConnection();
    return globalForDatabase.__carteaZileiDatabase;
  }

  productionConnection ??= createConnection();
  return productionConnection;
}

export function getDb() {
  return getDatabaseConnection().db;
}

export type Database = ReturnType<typeof getDb>;


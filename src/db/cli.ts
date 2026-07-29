import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { z } from "zod";

import "@/lib/env/load-cli-env";

import * as schema from "./schema";

export function createCliDatabaseConnection() {
  const databaseUrl = z.string().min(1).parse(process.env.DATABASE_URL);
  const client = postgres(databaseUrl, {
    max: 1,
    connect_timeout: 10,
  });

  return {
    client,
    db: drizzle(client, { schema }),
  };
}

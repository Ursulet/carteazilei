import { NextResponse } from "next/server";

import { getDatabaseConnection } from "@/db";
import { getServerEnv } from "@/lib/env/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function healthResponse(data: unknown, status = 200) {
  const response = NextResponse.json(data, { status });
  response.headers.set("cache-control", "no-store");
  response.headers.set("x-robots-tag", "noindex, nofollow");
  return response;
}

async function databaseIsReachable() {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      getDatabaseConnection().client`select 1 as ok`,
      new Promise<never>((_resolve, reject) => {
        timeout = setTimeout(() => reject(new Error("Database health check timed out.")), 2_000);
      }),
    ]);
    return true;
  } catch {
    return false;
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

export async function GET() {
  const startedAt = Date.now();
  let checkDatabase: boolean;

  try {
    checkDatabase = getServerEnv().HEALTHCHECK_DATABASE;
  } catch {
    return healthResponse(
      {
        status: "unhealthy",
        checks: { application: "ok", configuration: "error", database: "unknown" },
        durationMs: Date.now() - startedAt,
      },
      503,
    );
  }

  if (!checkDatabase) {
    return healthResponse({
      status: "ok",
      checks: { application: "ok", configuration: "ok", database: "skipped" },
      durationMs: Date.now() - startedAt,
    });
  }

  const databaseOk = await databaseIsReachable();
  return healthResponse(
    {
      status: databaseOk ? "ok" : "unhealthy",
      checks: {
        application: "ok",
        configuration: "ok",
        database: databaseOk ? "ok" : "error",
      },
      durationMs: Date.now() - startedAt,
    },
    databaseOk ? 200 : 503,
  );
}

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

// NOTE: Do NOT throw at import time. Next.js imports route modules during
// `next build` (page-data collection) even when DATABASE_URL is not set in
// the build environment (e.g. Vercel without Postgres env vars). The pool
// and drizzle client are created lazily on first actual use, so the build
// succeeds and misconfiguration surfaces at request time instead.
function getDatabaseUrl(): string {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required");
  }
  return databaseUrl;
}

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
};

function getPool(): Pool {
  if (!globalForDb.__arenaNextJsPostgresqlPool) {
    globalForDb.__arenaNextJsPostgresqlPool = new Pool({
      connectionString: getDatabaseUrl(),
    });
  }
  return globalForDb.__arenaNextJsPostgresqlPool;
}

type DbClient = ReturnType<typeof drizzle<typeof schema>>;

let cachedDb: DbClient | undefined;

function getDb(): DbClient {
  if (!cachedDb) {
    cachedDb = drizzle(getPool(), { schema });
  }
  return cachedDb;
}

// Lazily-initialized pool. Behaves like `pg.Pool` for the ways this
// codebase uses it; the real pool is created on first property access.
export const pool = new Proxy({} as Pool, {
  get(_target, prop, receiver) {
    if (prop === "then") return undefined;
    const real = getPool() as unknown as Record<string | symbol, unknown>;
    const value = real[prop as string];
    return typeof value === "function"
      ? (value as (...args: unknown[]) => unknown).bind(real)
      : Reflect.get(getPool(), prop, receiver);
  },
});

// Lazily-initialized drizzle client. All `db.select()`, `db.update()` …
// calls go through here; the connection is opened on first query.
export const db: DbClient = new Proxy({} as DbClient, {
  get(_target, prop, receiver) {
    if (prop === "then") return undefined;
    const real = getDb() as unknown as Record<string | symbol, unknown>;
    const value = real[prop as string];
    return typeof value === "function"
      ? (value as (...args: unknown[]) => unknown).bind(real)
      : Reflect.get(getDb(), prop, receiver);
  },
});

export { schema };

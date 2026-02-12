import { neon } from "@neondatabase/serverless";

declare global {
  // eslint-disable-next-line no-var
  var __portfolioSql: ReturnType<typeof neon> | undefined;
}

export function getSql() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    return null;
  }

  if (!globalThis.__portfolioSql) {
    globalThis.__portfolioSql = neon(connectionString);
  }

  return globalThis.__portfolioSql;
}

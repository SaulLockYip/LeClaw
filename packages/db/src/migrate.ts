// LeClaw Database Migration Runner
// Applies pending Drizzle migrations to the database

import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import * as schema from "./schema/index.js";

const MIGRATIONS_FOLDER = new URL("./migrations", import.meta.url);

async function main(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error("DATABASE_URL environment variable is not set");
    process.exit(1);
  }

  console.log(`Connecting to database: ${databaseUrl.split("@")[1] ?? "localhost"}`);

  const sql = postgres(databaseUrl);
  const db = drizzle(sql, { schema });

  console.log("Applying pending migrations...");
  await migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });

  console.log("Migrations complete");
  await sql.end();
}

main().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});

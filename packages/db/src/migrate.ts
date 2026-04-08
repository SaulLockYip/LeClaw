import { inspectMigrations, applyPendingMigrations } from "./client.js";

const MIGRATIONS_FOLDER = new URL("./migrations", import.meta.url).pathname;

export async function runMigrations(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.log("No DATABASE_URL configured, skipping migrations");
    return;
  }

  console.log(`Inspecting migrations for: ${databaseUrl.split("@")[1] ?? "localhost"}`);

  const before = await inspectMigrations(databaseUrl);
  if (before.status === "upToDate") {
    console.log("Database is up to date");
    return;
  }

  console.log(`Applying ${before.pendingMigrations.length} pending migration(s)...`);
  await applyPendingMigrations(databaseUrl);

  const after = await inspectMigrations(databaseUrl);
  if (after.status !== "upToDate") {
    throw new Error(`Migrations incomplete: ${after.pendingMigrations.join(", ")}`);
  }
  console.log("Migrations complete");
}

// CLI runner
async function main(): Promise<void> {
  try {
    await runMigrations();
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

await main();

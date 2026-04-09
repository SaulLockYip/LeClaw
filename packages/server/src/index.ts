import { createApp } from "./app.js";
import { configureDatabase } from "@leclaw/db/client";
import { runMigrations } from "@leclaw/db/migrate";

const PORT = parseInt(process.env.PORT ?? "4396", 10);
const HOST = process.env.HOST ?? "0.0.0.0";
const DATABASE_URL = process.env.DATABASE_URL ?? "";

// Configure database connection
if (DATABASE_URL) {
  configureDatabase({ connectionString: DATABASE_URL });
}

const app = createApp();

// Start server and run migrations only at runtime, not during build
app.listen(PORT, HOST, async () => {
  // Run migrations when server starts (not during tsc --build)
  if (DATABASE_URL) {
    await runMigrations();
  }

  console.log(
    JSON.stringify({
      success: true,
      server: { port: PORT, host: HOST },
      database: DATABASE_URL ? "configured" : "not configured",
    })
  );
});

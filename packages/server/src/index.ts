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

// Run migrations on startup
await runMigrations();

const app = createApp();

app.listen(PORT, HOST, () => {
  console.log(
    JSON.stringify({
      success: true,
      server: { port: PORT, host: HOST },
      database: DATABASE_URL ? "configured" : "not configured",
    })
  );
});

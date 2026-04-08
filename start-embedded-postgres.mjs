// Script to start embedded postgres and output connection string
import { initializeDb } from './packages/db/dist/embedded-postgres.js';

async function main() {
  console.log('Starting embedded postgres...');
  const db = await initializeDb({ port: 65432 });
  console.log('DATABASE_URL=' + db.connectionString);
  console.log('Source:', db.source);

  // Keep the process running
  console.log('Postgres is running. Press Ctrl+C to stop.');
}

main().catch(err => {
  console.error('Failed to start postgres:', err);
  process.exit(1);
});
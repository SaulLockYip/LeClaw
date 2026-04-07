import { Router, Request, Response } from "express";
import { getDb } from "@leclaw/db/client";
import { sql } from "drizzle-orm";

export const healthRouter: Router = Router();

healthRouter.get("/", async (_req: Request, res: Response) => {
  let dbConnected = false;

  try {
    const db = await getDb();
    await db.execute(sql`SELECT 1`);
    dbConnected = true;
  } catch {
    dbConnected = false;
  }

  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    database: dbConnected ? "connected" : "disconnected",
  });
});
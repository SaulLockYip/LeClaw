import { Router, Request, Response } from "express";
import { getDb } from "@leclaw/db/client";

export const healthRouter = Router();

healthRouter.get("/", async (_req: Request, res: Response) => {
  let dbConnected = false;

  try {
    const db = await getDb();
    await db.select({ count: true }).from({}).all();
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
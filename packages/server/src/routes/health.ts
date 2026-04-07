import { Router, Request, Response } from "express";
import path from "path";
import os from "os";
import fs from "fs";
import { loadConfig } from "@leclaw/shared";

export const healthRouter = Router();

healthRouter.get("/", (req: Request, res: Response) => {
  const configPath = path.join(os.homedir(), ".leclaw", "config.json");
  let dbConnected = false;

  try {
    if (fs.existsSync(configPath)) {
      const config = loadConfig({ configPath });
      dbConnected = !!config.database?.connectionString;
    }
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

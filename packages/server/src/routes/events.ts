import { Router } from "express";
import { addClient, removeClient } from "../sse/event-bus.js";

export const eventsRouter: Router = Router();

// SSE endpoint: /api/events
eventsRouter.get("/", (req, res) => {
  // Set SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");

  // Flush headers
  res.flushHeaders();

  // Create a mock controller for the event bus
  const controller = {
    enqueue: (data: Uint8Array) => {
      res.write(data);
    },
    close: () => {
      res.end();
    },
  } as ReadableStreamDefaultController<Uint8Array>;

  // Register client
  addClient(controller);

  // Send initial connection success
  res.write(`event: connected\ndata: ${JSON.stringify({ status: "connected" })}\n\n`);

  // Heartbeat every 30 seconds
  const heartbeat = setInterval(() => {
    try {
      res.write(`: heartbeat\n\n`);
    } catch {
      clearInterval(heartbeat);
      removeClient(controller);
    }
  }, 30_000);

  // Cleanup on close
  req.on("close", () => {
    clearInterval(heartbeat);
    removeClient(controller);
  });
});
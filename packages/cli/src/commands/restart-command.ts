import { Command } from "commander";
import { spawn } from "child_process";

export function registerRestartCommand(program: Command): void {
  program
    .command("restart")
    .description("Restart LeClaw server (stop + start)")
    .option("--port <port>", "Server port")
    .option("--host <host>", "Server host", "0.0.0.0")
    .action(async (opts) => {
      // Build start command with same options
      const startArgs = ["start"];
      if (opts.port) {
        startArgs.push("--port", opts.port);
      }
      if (opts.host && opts.host !== "0.0.0.0") {
        startArgs.push("--host", opts.host);
      }

      // Stop first
      console.log("Stopping server...");
      await new Promise<void>((resolve) => {
        const stopProc = spawn("leclaw", ["stop"], { stdio: "inherit" });
        stopProc.on("close", () => resolve());
      });

      // Wait for clean shutdown
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Start in background
      console.log("Starting server...");
      const startProc = spawn("leclaw", startArgs, {
        stdio: "inherit",
        detached: true,
      });
      startProc.unref();

      console.log(JSON.stringify({ success: true, message: "Server restarted" }));
      process.exit(0);
    });
}

#!/usr/bin/env node
import { runCli } from "../../dist/index.js";

runCli(process.argv).catch((err) => {
  console.error(
    JSON.stringify({
      success: false,
      error: err.message,
      code: "UNKNOWN_ERROR",
    })
  );
  process.exit(1);
});

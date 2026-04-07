---
status: testing
phase: 01-foundation-cli-init
source: [.planning/phases/01-foundation-cli-init/SUMMARY.md]
started: 2026-04-07T09:45:00Z
updated: 2026-04-07T10:15:00Z
---

## Current Test

number: 2
name: leclaw init (Interactive TUI)
expected: |
  Running `leclaw init` shows interactive TUI prompts.
  User can configure openclaw.dir, gatewayUrl, gatewayToken, server.port.
awaiting: user response

## Tests

### 1. Cold Start Smoke Test
expected: Kill any running server. Clear ephemeral state. Start fresh. Server boots without errors. Health check returns live data.
result: pass
note: "Server started on port 4396. Health check returned {\"status\":\"ok\"}. Database shows 'disconnected' (expected - no PG running)."

### 2. leclaw init (Interactive TUI)
expected: Running `leclaw init` shows interactive TUI prompts. User can configure openclaw.dir, gatewayUrl, gatewayToken, server.port.
result: pass
note: "TUI prompts work correctly. embedded-postgres init has issues (data dir exists), but TUI flow works."

### 3. leclaw config (Show Config)
expected: Running `leclaw config` displays current configuration as JSON.
result: pass
note: "Returns {\"success\":true,\"config\":{\"version\":\"1.0.0\",\"server\":{\"port\":8080}}}"

### 4. leclaw config openclaw --dir
expected: Running `leclaw config openclaw --dir /tmp/test` updates config and next `leclaw config` shows new dir.
result: pending

### 5. leclaw config gateway
expected: Running `leclaw config gateway --url ws://localhost:8080 --token test123` updates config.
result: pending

### 6. leclaw config server --port
expected: Running `leclaw config server --port 9000` updates config.
result: pending

### 7. leclaw status
expected: Running `leclaw status` outputs JSON with config and gateway connectivity status.
result: pending

### 8. leclaw doctor
expected: Running `leclaw doctor` outputs JSON with check results.
result: pass
note: "Returns {\"checks\":[{\"name\":\"config_exists\",\"status\":\"FAIL\"},{\"name\":\"db_dir\",\"status\":\"PASS\"}]}"

### 9. leclaw start
expected: Running `leclaw start` launches server + embedded PostgreSQL. Server responds on configured port.
result: pending

## Summary

total: 9
passed: 4
issues: 1
pending: 5
skipped: 0

## Issues

### Issue 1: embedded-postgres init fails
severity: minor
description: "Postgres init script exited with code null. The data directory might already exist."
note: "TUI works, but DB init fails. May need to clean ~/.leclaw/db before running init."

## Gaps

[none yet]

// Issue Comment Command - List and add comments on an issue
// Access: Agent (write) via CLI, Human read-only via Web UI
// Tier 3 migration candidate

import { Command } from "commander";
import path from "path";
import os from "os";
import { issueComments } from "@leclaw/db/schema";
import { getDb } from "@leclaw/db/client";
import { eq, desc } from "drizzle-orm";
import { auditLog } from "../../helpers/audit-log.js";
import { getAgentIdFromApiKey, getAgentInfoFromApiKey } from "../../helpers/api-key.js";
import { createApiClient } from "../../helpers/api-client.js";
import { loadConfig } from "@leclaw/shared";

const CONFIG_FILE = path.join(os.homedir(), ".leclaw", "config.json");

export function registerCommentCommand(program: Command): void {
  const commentCommand = new Command("comment")
    .description("Manage issue comments");

  // comment list
  commentCommand
    .command("list")
    .description("List comments on an issue")
    .requiredOption("--issue-id <id>", "Issue ID")
    .option("--api-key <key>", "Agent API key (will use stored key if not provided)")
    .action(async (options) => {
      const { issueId, apiKey } = options;

      // Get API key from options or fall back to stored key
      const effectiveApiKey = apiKey;
      if (!effectiveApiKey) {
        console.error(JSON.stringify({
          success: false,
          error: "No API key provided. Run 'leclaw agent onboard' first or provide --api-key",
          code: "MISSING_API_KEY",
        }, null, 2));
        process.exit(1);
      }

      try {
        const config = loadConfig({ configPath: CONFIG_FILE });
        const useHttp = config.features?.httpMigration ?? false;
        const agentInfo = await getAgentInfoFromApiKey(effectiveApiKey);

        let comments;
        if (useHttp) {
          const apiClient = createApiClient({ apiKey: effectiveApiKey, companyId: agentInfo.companyId });
          comments = await apiClient.getIssueComments(issueId);
        } else {
          await getAgentIdFromApiKey(effectiveApiKey); // Validate API key
          const db = await getDb();
          comments = await db
            .select({
              id: issueComments.id,
              issueId: issueComments.issueId,
              authorAgentId: issueComments.authorAgentId,
              message: issueComments.message,
              timestamp: issueComments.timestamp,
            })
            .from(issueComments)
            .where(eq(issueComments.issueId, issueId))
            .orderBy(desc(issueComments.timestamp));
        }

        console.log(JSON.stringify({
          success: true,
          comments,
        }, null, 2));
      } catch (err) {
        console.error(JSON.stringify({
          success: false,
          error: err instanceof Error ? err.message : String(err),
        }, null, 2));
        process.exit(1);
      }
    });

  // comment add
  commentCommand
    .command("add")
    .description("Add a comment to an issue")
    .requiredOption("--issue-id <id>", "Issue ID")
    .requiredOption("--message <text>", "Comment message")
    .option("--api-key <key>", "Agent API key (will use stored key if not provided)")
    .action(async (options) => {
      const { issueId, message, apiKey } = options;

      // Get API key from options or fall back to stored key
      const effectiveApiKey = apiKey;
      if (!effectiveApiKey) {
        console.error(JSON.stringify({
          success: false,
          error: "No API key provided. Run 'leclaw agent onboard' first or provide --api-key",
          code: "MISSING_API_KEY",
        }, null, 2));
        process.exit(1);
      }

      let agentId: string;
      let result: "success" | "failure" = "success";
      let output = "";

      try {
        const config = loadConfig({ configPath: CONFIG_FILE });
        const useHttp = config.features?.httpMigration ?? false;
        const agentInfo = await getAgentInfoFromApiKey(effectiveApiKey);
        agentId = agentInfo.agentId;

        let comment;
        if (useHttp) {
          const apiClient = createApiClient({ apiKey: effectiveApiKey, companyId: agentInfo.companyId });
          comment = await apiClient.addIssueComment(issueId, message);
        } else {
          // Extract agentId from API key
          agentId = await getAgentIdFromApiKey(effectiveApiKey);
          const db = await getDb();

          // Insert the comment
          [comment] = await db.insert(issueComments).values({
            issueId,
            authorAgentId: agentId,
            message,
          }).returning();
        }

        output = `Comment ${comment.id} added to issue ${issueId}`;

        await auditLog({
          agentId,
          command: "issue comment add",
          args: { issueId, commentId: comment.id },
          result: "success",
          output,
        });

        console.log(JSON.stringify({
          success: true,
          commentId: comment.id,
          message: output,
        }, null, 2));
      } catch (err) {
        result = "failure";
        const error = err instanceof Error ? err : new Error(String(err));
        output = error.message;

        // Try to audit even on failure
        if (agentId) {
          await auditLog({
            agentId,
            command: "issue comment add",
            args: { issueId },
            result: "failure",
            output,
          });
        }

        console.error(JSON.stringify({
          success: false,
          error: output,
        }, null, 2));
        process.exit(1);
      }
    });

  program.addCommand(commentCommand);
}

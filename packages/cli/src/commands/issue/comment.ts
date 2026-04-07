// Issue Comment Command - Add a comment to an issue
// Access: Agent (write) via CLI, Human read-only via Web UI

import { Command } from "commander";
import { issueComments } from "@leclaw/db/schema";
import { getDb } from "@leclaw/db/client";
import { auditLog } from "../../helpers/audit-log.js";
import { getAgentIdFromApiKey } from "../../helpers/api-key.js";

export function registerCommentCommand(program: Command): void {
  const commentCommand = new Command("comment")
    .description("Manage issue comments");

  commentCommand
    .command("add")
    .description("Add a comment to an issue")
    .requiredOption("--issue-id <id>", "Issue ID")
    .requiredOption("--message <text>", "Comment message")
    .requiredOption("--api-key <key>", "Agent API key")
    .action(async (options) => {
      const { issueId, message, apiKey } = options;

      let agentId: string;
      let result: "success" | "failure" = "success";
      let output = "";

      try {
        // Extract agentId from API key
        agentId = await getAgentIdFromApiKey(apiKey);
        const db = await getDb();

        // Insert the comment
        const [comment] = await db.insert(issueComments).values({
          issueId,
          authorAgentId: agentId,
          message,
        } as any).returning();

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

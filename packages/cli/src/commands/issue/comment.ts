// Issue Comment Command - List and add comments on an issue
// Access: Agent (write) via CLI, Human read-only via Web UI

import { Command } from "commander";
import { auditLog } from "../../helpers/audit-log.js";
import { getAgentInfoFromApiKey } from "../../helpers/api-key.js";
import { createApiClient } from "../../helpers/api-client.js";

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
        const agentInfo = await getAgentInfoFromApiKey(effectiveApiKey);
        const apiClient = createApiClient({ apiKey: effectiveApiKey, companyId: agentInfo.companyId });
        const comments = await apiClient.getIssueComments(issueId);

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
      let output = "";

      try {
        const agentInfo = await getAgentInfoFromApiKey(effectiveApiKey);
        agentId = agentInfo.agentId;

        const apiClient = createApiClient({ apiKey: effectiveApiKey, companyId: agentInfo.companyId });
        const comment = await apiClient.addIssueComment(issueId, message);

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

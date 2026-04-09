// Issue Commands - Register issue-related subcommands

import { Command } from "commander";
import { registerCommentCommand } from "./comment.js";
import { registerReportCommand } from "./report.js";
import { registerCreateCommand } from "./create.js";

export function registerIssueCommand(program: Command): void {
  const issueCommand = new Command("issue")
    .description("Manage issues");

  registerCommentCommand(issueCommand);
  registerReportCommand(issueCommand);
  registerCreateCommand(issueCommand);

  program.addCommand(issueCommand);
}

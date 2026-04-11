// Issue Commands - Register issue-related subcommands

import { Command } from "commander";
import { registerCommentCommand } from "./comment.js";
import { registerReportCommand } from "./report.js";
import { registerCreateCommand } from "./create.js";
import { registerListCommand } from "./list.js";
import { registerShowCommand } from "./show.js";
import { registerUpdateCommand } from "./update.js";
import { registerSubIssueCommand } from "./sub-issue.js";

export function registerIssueCommand(program: Command): void {
  const issueCommand = new Command("issue")
    .description("Manage issues");

  registerCommentCommand(issueCommand);
  registerReportCommand(issueCommand);
  registerCreateCommand(issueCommand);
  registerListCommand(issueCommand);
  registerShowCommand(issueCommand);
  registerUpdateCommand(issueCommand);
  registerSubIssueCommand(issueCommand);

  program.addCommand(issueCommand);
}

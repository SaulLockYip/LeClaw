// Project Commands - Register project-related subcommands

import { Command } from "commander";
import { registerProjectListCommand } from "./list.js";
import { registerProjectCreateCommand } from "./create.js";
import { registerProjectShowCommand } from "./show.js";
import { registerProjectUpdateCommand } from "./update.js";

export function registerProjectCommand(program: Command): void {
  const projectCommand = new Command("project")
    .description("Manage projects");

  registerProjectListCommand(projectCommand);
  registerProjectCreateCommand(projectCommand);
  registerProjectShowCommand(projectCommand);
  registerProjectUpdateCommand(projectCommand);

  program.addCommand(projectCommand);
}

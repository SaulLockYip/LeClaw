// Project Commands - Register project-related subcommands

import { Command } from "commander";
import { registerProjectListCommand } from "./list.js";
import { registerProjectCreateCommand } from "./create.js";

export function registerProjectCommand(program: Command): void {
  const projectCommand = new Command("project")
    .description("Manage projects");

  registerProjectListCommand(projectCommand);
  registerProjectCreateCommand(projectCommand);

  program.addCommand(projectCommand);
}

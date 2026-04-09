// Goal Commands - Register goal-related subcommands

import { Command } from "commander";
import { registerGoalListCommand } from "./list.js";
import { registerGoalCreateCommand } from "./create.js";

export function registerGoalCommand(program: Command): void {
  const goalCommand = new Command("goal")
    .description("Manage goals");

  registerGoalListCommand(goalCommand);
  registerGoalCreateCommand(goalCommand);

  program.addCommand(goalCommand);
}

// Department Commands - Register department-related subcommands

import { Command } from "commander";
import { registerDepartmentListCommand } from "./list.js";
import { registerDepartmentCreateCommand } from "./create.js";
import { registerDepartmentUpdateCommand } from "./update.js";

export function registerDepartmentCommand(program: Command): void {
  const departmentCommand = new Command("department")
    .description("Manage departments");

  registerDepartmentListCommand(departmentCommand);
  registerDepartmentCreateCommand(departmentCommand);
  registerDepartmentUpdateCommand(departmentCommand);

  program.addCommand(departmentCommand);
}

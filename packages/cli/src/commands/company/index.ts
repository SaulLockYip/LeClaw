// Company Commands - Register company-related subcommands

import { Command } from "commander";
import { registerCompanyListCommand } from "./list.js";
import { registerCompanyCreateCommand } from "./create.js";

export function registerCompanyCommand(program: Command): void {
  const companyCommand = new Command("company")
    .description("Manage companies");

  registerCompanyListCommand(companyCommand);
  registerCompanyCreateCommand(companyCommand);

  program.addCommand(companyCommand);
}

// Company Commands - Register company-related subcommands

import { Command } from "commander";
import { registerCompanyListCommand } from "./list.js";

export function registerCompanyCommand(program: Command): void {
  const companyCommand = new Command("company")
    .description("Manage companies");

  registerCompanyListCommand(companyCommand);

  program.addCommand(companyCommand);
}

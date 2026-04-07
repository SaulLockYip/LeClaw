import { Command } from "commander";
import { configureProgramHelp } from "./configure-help.js";
import { registerInitCommand } from "../commands/init-command.js";
import { registerConfigCommand } from "../commands/config-command.js";
import { registerStatusCommand } from "../commands/status-command.js";
import { registerStartCommand } from "../commands/start-command.js";
import { registerDoctorCommand } from "../commands/doctor-command.js";

export function buildProgram(): Command {
  const program = new Command();
  program
    .name("leclaw")
    .description("LeClaw - Agent Management Platform")
    .version("1.0.0");

  configureProgramHelp(program);

  registerInitCommand(program);
  registerConfigCommand(program);
  registerStatusCommand(program);
  registerDoctorCommand(program);
  registerStartCommand(program);

  return program;
}

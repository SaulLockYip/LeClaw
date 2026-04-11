import { Command } from "commander";
import { configureProgramHelp } from "./configure-help.js";
import { registerInitCommand } from "../commands/init-command.js";
import { registerConfigCommand } from "../commands/config-command.js";
import { registerStatusCommand } from "../commands/status-command.js";
import { registerStartCommand } from "../commands/start-command.js";
import { registerStopCommand } from "../commands/stop-command.js";
import { registerRestartCommand } from "../commands/restart-command.js";
import { registerDoctorCommand } from "../commands/doctor-command.js";
import { registerAgentsCommand } from "../commands/agents/agents-list.js";
import { registerAgentCommand } from "../commands/agent/agent-onboard.js";
import { registerIssueCommand } from "../commands/issue/index.js";
import { registerGoalCommand } from "../commands/goal/index.js";
import { registerProjectCommand } from "../commands/project/index.js";
import { registerCompanyCommand } from "../commands/company/index.js";
import { registerDepartmentCommand } from "../commands/department/index.js";
import { registerApprovalCommand } from "../commands/approval/index.js";
import { registerTodoCommand } from "../commands/todo.js";

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
  registerStopCommand(program);
  registerRestartCommand(program);
  registerAgentsCommand(program);
  registerAgentCommand(program);
  registerIssueCommand(program);
  registerGoalCommand(program);
  registerProjectCommand(program);
  registerCompanyCommand(program);
  registerDepartmentCommand(program);
  registerApprovalCommand(program);
  registerTodoCommand(program);

  return program;
}

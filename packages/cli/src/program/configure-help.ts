import { Command } from "commander";

export function configureProgramHelp(program: Command): void {
  program.configureOutput({
    writeErr: (str) => console.error(str),
  });

  program.addHelpText("after", () => {
    return `
Examples:
  leclaw init                    Start interactive setup
  leclaw config                  Show current configuration
  leclaw config openclaw --dir /path/to/openclaw
  leclaw config gateway --url ws://localhost:4396 --token xxx
  leclaw config server --port 3000
  leclaw status                  Check connection status
  leclaw doctor                  Run diagnostic checks
  leclaw start                   Start LeClaw server
`;
  });
}

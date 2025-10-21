#!/usr/bin/env node
import { Command } from "commander";
import { initModule } from "./init";
import { runCodegen } from "./codegen";
import buildModule from "./build";

const program = new Command();

program
  .name("lynxjs-module")
  .description("CLI for LynxJS native modules")
  .version("0.1.0")
  .helpOption("-h, --help", "display help for command");

// init command: accepts optional project name and module name
program
  .command("init [projectName] [moduleName]")
  .description("Scaffold a new LynxJS module")
  .action(async (projectName?: string, moduleName?: string) => {
    await initModule(projectName, moduleName);
  });

// codegen command
program
  .command("codegen")
  .description("Run codegen inside a module")
  .action(async () => {
    await runCodegen();
  });

// build command (placeholder for future implementation)
program
  .command("build")
  .description("Build the module")
  .action(async () => {
    await buildModule();
  });

// If no subcommand provided, show help
if (process.argv.length === 2) {
  program.help();
} else {
  program.parse(process.argv);
}

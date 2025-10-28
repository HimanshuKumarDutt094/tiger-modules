#!/usr/bin/env node
import { Command } from "commander";
import { initModule } from "./commands/create.js";
import { runCodegen } from "./commands/codegen.js";
import { runBuildWithActions } from "./commands/build.js";
import { registerCreateNewCommand } from "./commands/create-new.js";

const program = new Command();

program
  .name("tiger-module")
  .description("CLI for LynxJS autolink extensions")
  .version("0.1.0")
  .helpOption("-h, --help", "display help for command");

// init command: accepts optional project name
program
  .command("init [projectName]")
  .description("Scaffold a new LynxJS autolink extension")
  .option(
    "--language <language>",
    "Android language (kotlin or java)",
    "kotlin",
  )
  .action(
    async (
      projectName?: string,
      options?: { language?: string },
    ) => {
      await initModule(projectName, options?.language);
    },
  );

// codegen command
program
  .command("codegen")
  .description("Generate native platform code from TypeScript module interface")
  .action(async () => {
    await runCodegen();
  });

// build command
program
  .command("build")
  .description("Build the extension package for distribution")
  .action(async () => {
    await runBuildWithActions();
  });

// Register create command (follows lepo pattern)
registerCreateNewCommand(program);

// If no subcommand provided, show help
if (process.argv.length === 2) {
  program.help();
} else {
  program.parse(process.argv);
}

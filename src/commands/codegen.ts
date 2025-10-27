#!/usr/bin/env node

import { ActionRunner } from "../core/actions/action-runner.js";
import { CodegenAction } from "../core/actions/codegen-action.js";
import { defaultLogger } from "../core/logger.js";

export async function runCodegen(): Promise<void> {
  const action = new CodegenAction();
  const context = {
    devMode: false,
    environment: 'development' as const,
    logger: defaultLogger,
    projectRoot: process.cwd(),
  };
  
  const runner = new ActionRunner(context);
  runner.addAction(action);
  await runner.run();
}

// If run directly from node
if (process.argv[1] && process.argv[1].endsWith("codegen.ts")) {
  runCodegen().catch((err: unknown) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
  });
}

#!/usr/bin/env node

import { runCodegenOrchestrator } from "./codegen/orchestrator.js";

export async function runCodegen(): Promise<void> {
  await runCodegenOrchestrator();
}

// If run directly from node
if (process.argv[1] && process.argv[1].endsWith("codegen.ts")) {
  runCodegen().catch((err: unknown) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
  });
}

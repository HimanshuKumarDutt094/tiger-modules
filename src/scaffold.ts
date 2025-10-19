#!/usr/bin/env node
import { mkdirpSync, writeFileSync, writeJsonSync } from "fs-extra";
import path from "node:path";
import { text, cancel, isCancel } from "@clack/prompts";
import chalk from "chalk";

const pascalCheck = (input: string) => /^[A-Z][A-Za-z]*$/.test(input);

async function main() {
  console.log(chalk.cyanBright("\n✨ Create Lynx Module CLI\n"));

  const moduleName = await text({
    message: "Module name (e.g. LocalStorage):",
    validate(value) {
      if (!value) return "Module name required";
      if (!pascalCheck(value)) return "Must be PascalCase";
    },
  });
  if (isCancel(moduleName)) return cancel("Cancelled");

  const androidPackageName = await text({
    message: "Android package name:",
    initialValue: "com.myapp.modules",
  });
  if (isCancel(androidPackageName)) return cancel("Cancelled");

  const description = await text({
    message: "Module description:",
    initialValue: "My Lynx native module",
  });
  if (isCancel(description)) return cancel("Cancelled");

  const dir = path.join(process.cwd(), moduleName.toLowerCase());
  mkdirpSync(dir);
  mkdirpSync(path.join(dir, "src"));

  // --- TS stub ---
  const srcFile = "src/index.ts";
  writeFileSync(
    path.join(dir, srcFile),
    `// ${moduleName} module interface
export interface ${moduleName}Module extends MyModuleGenerator {
  helloWorld(name: string): string;
}
`
  );

  // --- package.json ---
  writeJsonSync(
    path.join(dir, "package.json"),
    {
      name: moduleName.toLowerCase(),
      version: "0.1.0",
      description,
      main: srcFile,
      license: "MIT",
    },
    { spaces: 2 }
  );

  // --- tsconfig.json ---
  writeJsonSync(
    path.join(dir, "tsconfig.json"),
    { compilerOptions: { target: "ES2020", module: "CommonJS" } },
    { spaces: 2 }
  );

  // --- module.config.ts ---
  writeFileSync(
    path.join(dir, "module.config.ts"),
    `export interface ModuleConfig {
  moduleName: string;
  androidPackageName: string;
  description: string;
  srcFile: string;
}
export const config: ModuleConfig = {
  moduleName: "${moduleName}",
  androidPackageName: "${androidPackageName}",
  description: "${description}",
  srcFile: "./src/index.ts",
};
`
  );

  console.log(chalk.greenBright("\n✅ Scaffold created!"));
  console.log(chalk.yellow("Next: run codegen to build native files"));
}

main().catch(console.error);

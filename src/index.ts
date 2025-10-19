#!/usr/bin/env node
import { mkdirpSync, writeFileSync, writeJsonSync } from "fs-extra";
import path from "node:path";
import { text, cancel, isCancel } from "@clack/prompts";
import chalk from "chalk";
import { existsSync } from "node:fs";

const pascalCheck = (input: string): boolean => {
  const pattern = /^[A-Z][A-Za-z]*$/;
  return pattern.test(input);
};
async function main() {
  console.log(chalk.cyanBright("\n✨ Create Lynx Module CLI\n"));

  const moduleName = await text({
    message: "Module name (e.g. LynxStorage):",
    validate(value) {
      if (value.length === 0) return "Module name is required.";
      if (pascalCheck(value))
        return "Invalid Module name, it must be PascalCase";
    },
  });

  if (isCancel(moduleName)) {
    cancel("Operation cancelled.");
    process.exit(0);
  }

  const packageName = await text({
    message: "Android package name (e.g. com.myapp.modules.storage):",
    initialValue: "com.myapp.modules",
  });

  if (isCancel(packageName)) {
    cancel("Operation cancelled.");
    process.exit(0);
  }

  const description = await text({
    message: "Short description:",
    initialValue: "My Lynx native module",
  });

  if (isCancel(description)) {
    cancel("Operation cancelled.");
    process.exit(0);
  }

  const dir = path.join(process.cwd(), moduleName.toLowerCase());
  if (existsSync(dir)) {
    console.log(chalk.red("❌ Directory already exists."));
    process.exit(1);
  }

  console.log(chalk.green(`📦 Creating module at ${dir}`));
  mkdirpSync(dir);

  // --- Folder structure ---
  const folders = ["src", "android", "ios", "codegen"];
  folders.forEach((folder) => mkdirpSync(path.join(dir, folder)));

  // --- Package.json ---
  const pkg = {
    name: `${moduleName.toLowerCase()}`,
    version: "0.1.0",
    description,
    main: "src/index.ts",
    author: "YourName",
    license: "MIT",
  };
  writeJsonSync(path.join(dir, "package.json"), pkg, { spaces: 2 });

  // --- TS stub ---
  writeFileSync(
    path.join(dir, "src", `${moduleName}Module.ts`),
    `export interface ${moduleName}Module {
  helloWorld(name: string): string;
}
`
  );

  // --- Android stub ---
  writeFileSync(
    path.join(dir, "android", `${moduleName}Module.kt`),
    `package ${packageName}

import com.lynx.jsbridge.LynxMethod
import com.lynx.jsbridge.LynxModule

class ${moduleName}Module : LynxModule() {
  @LynxMethod fun helloWorld(name: String): String {
    return "Hello, " + name
  }
}
`
  );

  // --- iOS stub ---
  writeFileSync(
    path.join(dir, "ios", `${moduleName}Module.swift`),
    `import Foundation

@objcMembers
public final class ${moduleName}Module: NSObject, LynxModule {
    public static var name: String { return "${moduleName}Module" }

    public func helloWorld(_ name: String) -> String {
        return "Hello, \\(name)"
    }
}
`
  );

  // --- Codegen stub ---
  writeFileSync(
    path.join(dir, "codegen", "lynx-build.mjs"),
    `// Placeholder for build script
console.log("Lynx build will go here 🚀");
`
  );

  // --- Readme ---
  writeFileSync(
    path.join(dir, "README.md"),
    `# ${moduleName}
${description}

## Example
\`\`\`ts
import { ${moduleName}Module } from "${moduleName.toLowerCase()}";

${moduleName}Module.helloWorld("Himanshu");
\`\`\`
`
  );

  console.log(chalk.greenBright("\n✅ Module scaffold created successfully!"));
  console.log(chalk.yellow("Next steps:"));
  console.log("  cd", moduleName.toLowerCase());
  console.log("  bunx lynx-build (coming soon)");
}

main().catch(console.error);

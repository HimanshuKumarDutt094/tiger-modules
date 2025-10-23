#!/usr/bin/env node
import { mkdirpSync, writeJsonSync } from "fs-extra/esm";
import path from "path";
import { text, cancel, isCancel, select } from "@clack/prompts";
import chalk from "chalk";
import { writeFileSync } from "fs";
import { validateAutolinkConfig } from "./autolink/validation.js";
/// <reference path="./module.global.d.ts" />
const pascalCheck = (input: string) => /^[A-Z][A-Za-z]*$/.test(input);
const packageNameCheck = (input: string) => /^[a-z0-9-]+$/.test(input);

export async function initModule(
  providedProjectName?: string,
  providedModuleName?: string,
  language?: string,
) {
  console.log(chalk.cyanBright("\n✨ Create Lynx Autolink Extension\n"));

  let projectName = providedProjectName;
  let moduleName = providedModuleName;

  // Get project name first
  if (!projectName) {
    const answer = await text({
      message: "Project name (e.g. lynxjs-linking-module):",
      validate(value) {
        if (!value) return "Project name required";
        if (!packageNameCheck(value))
          return "Must be lowercase with hyphens only (e.g. my-module)";
      },
    });
    if (isCancel(answer)) return cancel("Cancelled");
    projectName = String(answer);
  } else {
    // validate provided project name
    if (!packageNameCheck(projectName)) {
      console.error(
        "Project name must be lowercase with hyphens only (e.g. lynxjs-linking-module)",
      );
      process.exit(1);
    }
  }

  // Get module name second
  if (!moduleName) {
    const answer = await text({
      message: "Module name (e.g. LocalStorage):",
      validate(value) {
        if (!value) return "Module name required";
        if (!pascalCheck(value)) return "Must be PascalCase";
      },
    });
    if (isCancel(answer)) return cancel("Cancelled");
    moduleName = String(answer);
  } else {
    // validate provided name
    if (!pascalCheck(moduleName)) {
      console.error("Module name must be PascalCase (e.g. LocalStorage)");
      process.exit(1);
    }
  }

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

  // Get language preference
  let selectedLanguage = language || "kotlin";
  if (!language) {
    const languageAnswer = await select({
      message: "Select Android language:",
      options: [
        { value: "kotlin", label: "Kotlin (recommended)" },
        { value: "java", label: "Java" },
      ],
      initialValue: "kotlin",
    });
    if (isCancel(languageAnswer)) return cancel("Cancelled");
    selectedLanguage = String(languageAnswer);
  }

  if (!moduleName) throw new Error("moduleName missing");
  if (!projectName) throw new Error("projectName missing");

  const dir = path.join(process.cwd(), projectName);
  mkdirpSync(dir);
  mkdirpSync(path.join(dir, "src"));

  // --- TS stub ---
  const moduleFile = "src/module.ts";
  writeFileSync(
    path.join(dir, moduleFile),
    `// ${moduleName} module interface
    import {type TigerModule } from "lynxjs-module/runtime";
export interface ${moduleName}Module extends TigerModule {
  helloWorld(name: string): string;
}
`,
  );
  const srcFile = "src/index.ts";
  writeFileSync(
    path.join(dir, srcFile),
    `import { ${moduleName}Module } from "./module";`,
  );
  // --- package.json ---
  writeJsonSync(
    path.join(dir, "package.json"),
    {
      name: projectName,
      version: "0.1.0",
      description,
      license: "MIT",
      type: "module",
      main: "./dist/index.js",
      module: "./dist/index.js",
      types: "./dist/index.d.ts",
      exports: {
        ".": {
          types: "./dist/index.d.ts",
          import: "./dist/index.js",
          require: "./dist/index.js",
        },
        "./types": {
          types: "./dist/global.d.ts",
        },
        "./package.json": "./package.json",
      },
      scripts: {
        build: "lynxjs-module build",
        dev: "tsdown --watch",
        typecheck: "tsc --noEmit",
        release: "bumpp && npm publish",
        codegen: "lynxjs-module codegen",
      },
      devDependencies: {
        "@types/node": "^24.8.1",
        "lynxjs-module": "latest",
        tsdown: "^0.15.8",
        typescript: "^5.9.3",
      },
      dependencies: {
        "@lynx-js/types": "^3.4.11",
      },
    },
    { spaces: 2 },
  );

  // --- tsconfig.json ---
  writeJsonSync(
    path.join(dir, "tsconfig.json"),
    {
      compilerOptions: {
        target: "esnext",
        lib: ["es2023"],
        moduleDetection: "force",
        module: "preserve",
        moduleResolution: "bundler",
        resolveJsonModule: true,
        types: ["node"],
        strict: true,
        noUnusedLocals: true,
        declaration: true,
        emitDeclarationOnly: true,
        esModuleInterop: true,
        isolatedModules: true,
        verbatimModuleSyntax: true,
        skipLibCheck: true,
      },
      include: ["src", "src/typing.d.ts", "src/global.d.ts"],
    },
    { spaces: 2 },
  );

  // --- tsdown.config.ts ---
  writeFileSync(
    path.join(dir, "tsdown.config.ts"),
    `import { defineConfig } from 'tsdown'

export default defineConfig([
  {
    entry: {
      index: './src/index.ts',
    },
    platform: 'neutral',
    dts: true,
  },
])`,
  );

  // --- lynx.ext.ts (autolink configuration) ---
  {
    const configContent = `import { defineConfig } from 'lynxjs-module/config';

export default defineConfig({
  name: '${projectName}',
  version: '0.1.0',
  lynxVersion: '>=0.70.0',
  platforms: {
    android: {
      packageName: '${androidPackageName}',
      sourceDir: 'android/src/main',
      buildTypes: ['debug', 'release'],
      language: '${selectedLanguage}'
    },
    ios: {
      sourceDir: 'ios/src',
      frameworks: ['Foundation']
    },
    web: {
      entry: 'web/src/index.ts'
    }
  },
  dependencies: [],
  nativeModules: [
    {
      name: '${moduleName}',
      className: '${moduleName}Module'
    }
  ],
  elements: [],
  services: []
});
`;

    writeFileSync(path.join(dir, "lynx.ext.ts"), configContent);

    // Create platform directories
    mkdirpSync(path.join(dir, "android", "src", "main"));
    mkdirpSync(path.join(dir, "ios", "src"));
    mkdirpSync(path.join(dir, "web", "src"));

    console.log(chalk.greenBright("\n✅ Autolink extension scaffold created!"));
    console.log(chalk.cyanBright("\nNext steps:"));
    console.log(chalk.yellow(`  1. cd ${projectName}`));
    console.log(
      chalk.yellow(`  2. Update src/module.ts with your module interface`),
    );
    console.log(
      chalk.yellow(`  3. Update lynx.ext.ts configuration if needed`),
    );
    console.log(chalk.yellow(`  4. npm run codegen`));
    console.log(
      chalk.yellow(
        `  5. Implement native code in android/, ios/, and web/ directories`,
      ),
    );
    console.log(chalk.yellow(`  6. npm run build`));
    console.log(
      chalk.yellow(
        `  7. Publish to npm - extensions will auto-integrate via Autolink!`,
      ),
    );
  }
}

// Allow running directly for development
if (process.argv[1] && process.argv[1].endsWith("init.ts")) {
  // invoked directly
  initModule().catch(console.error);
}

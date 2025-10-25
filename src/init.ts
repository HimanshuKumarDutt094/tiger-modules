#!/usr/bin/env node
import { mkdirpSync, writeJsonSync } from "fs-extra/esm";
import path from "path";
import { text, cancel, isCancel, select, multiselect } from "@clack/prompts";
import chalk from "chalk";
import { writeFileSync } from "fs";
/// <reference path="./module.global.d.ts" />
const pascalCheck = (input: string) => /^[A-Z][A-Za-z]*$/.test(input);
const packageNameCheck = (input: string) => /^[a-z0-9-]+$/.test(input);

export async function initModule(
  providedProjectName?: string,
  language?: string,
) {
  console.log(chalk.cyanBright("\n✨ Create Lynx Autolink Extension\n"));

  let projectName = providedProjectName;

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

  // Multi-select extension types (RFC requirement)
  const extensionTypes = await multiselect({
    message: "Please select the extension types included in this package:",
    options: [
      { value: "nativeModule", label: "Native Module" },
      { value: "element", label: "Element" },
      { value: "service", label: "Service" },
    ],
    required: true,
  });
  if (isCancel(extensionTypes)) return cancel("Cancelled");

  const selectedTypes = extensionTypes as string[];
  console.log(chalk.green(`Selected: ${selectedTypes.map(t => t.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())).join(', ')}`));

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

  if (!projectName) throw new Error("projectName missing");

  const dir = path.join(process.cwd(), projectName);
  mkdirpSync(dir);
  mkdirpSync(path.join(dir, "src"));

  // Generate TypeScript interfaces based on selected types
  let moduleInterfaces = '';
  let moduleExports = '';
  let nativeModules: Array<{name: string, className: string}> = [];
  let elements: string[] = [];
  let services: string[] = [];

  if (selectedTypes.includes('nativeModule')) {
    const moduleName = await text({
      message: "Native Module name (e.g. LocalStorage):",
      validate(value) {
        if (!value) return "Module name required";
        if (!pascalCheck(value)) return "Must be PascalCase";
      },
    });
    if (isCancel(moduleName)) return cancel("Cancelled");
    
    const moduleNameStr = String(moduleName);
    moduleInterfaces += `// ${moduleNameStr} module interface
export interface ${moduleNameStr}Module extends TigerModule {
  helloWorld(name: string): string;
}

`;
    moduleExports += `export { ${moduleNameStr}Module } from "./module";\n`;
    nativeModules.push({
      name: moduleNameStr,
      className: `${moduleNameStr}Module`
    });
  }

  if (selectedTypes.includes('element')) {
    const elementName = await text({
      message: "Element name (e.g. Button):",
      validate(value) {
        if (!value) return "Element name required";
        if (!pascalCheck(value)) return "Must be PascalCase";
      },
    });
    if (isCancel(elementName)) return cancel("Cancelled");
    
    const elementNameStr = String(elementName);
    moduleInterfaces += `// ${elementNameStr} element interface
export interface ${elementNameStr}Props {
  // Define your element props here
}

`;
    moduleExports += `export { ${elementNameStr}Props } from "./module";\n`;
    elements.push(elementNameStr);
  }

  if (selectedTypes.includes('service')) {
    const serviceName = await text({
      message: "Service name (e.g. LogService):",
      validate(value) {
        if (!value) return "Service name required";
        if (!pascalCheck(value)) return "Must be PascalCase";
      },
    });
    if (isCancel(serviceName)) return cancel("Cancelled");
    
    const serviceNameStr = String(serviceName);
    moduleInterfaces += `// ${serviceNameStr} service interface
export interface ${serviceNameStr} {
  // Define your service methods here
}

`;
    moduleExports += `export { ${serviceNameStr} } from "./module";\n`;
    services.push(serviceNameStr);
  }

  // --- TS interfaces ---
  const moduleFile = "src/module.ts";
  writeFileSync(
    path.join(dir, moduleFile),
    `import { type TigerModule } from "tiger-module/runtime";

${moduleInterfaces}`,
  );
  
  const srcFile = "src/index.ts";
  writeFileSync(
    path.join(dir, srcFile),
    moduleExports,
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
        build: "tiger-module build",
        dev: "tsdown --watch",
        typecheck: "tsc --noEmit",
        release: "bumpp && npm publish",
        codegen: "tiger-module codegen",
      },
      devDependencies: {
        "@types/node": "^24.8.1",
        "tiger-module": "latest",
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

  // --- tiger.config.ts (autolink configuration) ---
  {
    const configContent = `import { defineConfig } from 'tiger-module/config';

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
  nativeModules: ${JSON.stringify(nativeModules, null, 4)},
  elements: ${JSON.stringify(elements, null, 4)},
  services: ${JSON.stringify(services, null, 4)}
});
`;

    writeFileSync(path.join(dir, "tiger.config.ts"), configContent);

    // Create platform directories with RFC structure
    mkdirpSync(path.join(dir, "android", "src", "main", "kotlin"));
    mkdirpSync(path.join(dir, "ios", "src"));
    mkdirpSync(path.join(dir, "web", "src"));
    
    // Create example directory structure (RFC requirement)
    mkdirpSync(path.join(dir, "example", "android"));
    mkdirpSync(path.join(dir, "example", "ios"));
    mkdirpSync(path.join(dir, "example", "web"));
    mkdirpSync(path.join(dir, "example", "src"));

    console.log(chalk.greenBright("\n✅ Autolink extension scaffold created!"));
    console.log(chalk.cyanBright("\nNext steps:"));
    console.log(chalk.yellow(`  1. cd ${projectName}`));
    console.log(
      chalk.yellow(`  2. Update src/module.ts with your interfaces`),
    );
    console.log(
      chalk.yellow(`  3. npm run codegen - generates base classes in generated/ folders`),
    );
    console.log(
      chalk.yellow(
        `  4. Implement native code that extends the generated base classes`,
      ),
    );
    console.log(chalk.yellow(`  5. npm run build`));
    console.log(
      chalk.yellow(
        `  6. Publish to npm - extensions will auto-integrate via Autolink!`,
      ),
    );
    
    console.log(chalk.cyanBright("\nGenerated structure:"));
    selectedTypes.forEach(type => {
      const typeName = type.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
      console.log(chalk.gray(`  ✓ ${typeName} scaffolding created`));
    });
  }
}

// Allow running directly for development
if (process.argv[1] && process.argv[1].endsWith("init.ts")) {
  // invoked directly
  initModule().catch(console.error);
}

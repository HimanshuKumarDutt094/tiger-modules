#!/usr/bin/env node
import { intro, multiselect, note, outro, select, text } from "@clack/prompts";
import chalk from "chalk";
import { mkdirpSync, writeJsonSync } from "fs-extra/esm";
import { writeFileSync } from "fs";
import path from "path";
import { checkCancel } from "../core/project-builder/template.js";

const pascalCheck = (input: string) => /^[A-Z][A-Za-z]*$/.test(input);
const packageNameCheck = (input: string) => /^[a-z0-9-]+$/.test(input);

export async function initModule(
  providedProjectName?: string,
  language?: string
) {
  intro(chalk.cyan("✨ Create LynxJS Extension"));

  let projectName = providedProjectName;

  // Get project name first
  if (!projectName) {
    projectName = checkCancel<string>(
      await text({
        message: "Project name (e.g. lynxjs-linking):",
        validate(value) {
          if (!value) return "Project name required";
          if (!packageNameCheck(value))
            return "Must be lowercase with hyphens only (e.g. my-module)";
        },
      })
    );
  } else {
    // validate provided project name
    if (!packageNameCheck(projectName)) {
      console.error(
        "Project name must be lowercase with hyphens only (e.g. lynxjs-linking)"
      );
      process.exit(1);
    }
  }

  // Multi-select extension types (RFC requirement)
  const selectedTypes = checkCancel<string[]>(
    await multiselect({
      message: "Please select the extension types included in this package:",
      options: [
        { value: "nativeModule", label: "Native Module" },
        { value: "element", label: "Element" },
        { value: "service", label: "Service" },
      ],
      required: true,
    })
  );

  console.log(
    chalk.green(
      `Selected: ${selectedTypes
        .map((t) =>
          t.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())
        )
        .join(", ")}`
    )
  );

  const androidPackageName = checkCancel<string>(
    await text({
      message: "Android package name:",
      initialValue: "com.myapp.modules",
    })
  );

  const description = checkCancel<string>(
    await text({
      message: "Project description:",
      initialValue: "My Lynx native module.",
    })
  );

  // Get language preference
  let selectedLanguage = language || "kotlin";
  if (!language) {
    selectedLanguage = checkCancel<string>(
      await select({
        message: "Select Android language:",
        options: [
          { value: "kotlin", label: "Kotlin (recommended)" },
          { value: "java", label: "Java" },
        ],
        initialValue: "kotlin",
      })
    );
  }

  if (!projectName) throw new Error("projectName missing");

  const dir = path.join(process.cwd(), projectName);
  mkdirpSync(dir);
  mkdirpSync(path.join(dir, "src"));

  // Generate TypeScript interfaces based on selected types
  let moduleInterfaces = "";
  let moduleExports = "";
  let nativeModules: Array<{ name: string; className: string }> = [];
  let elements: Array<{ name: string }> = [];
  let services: string[] = [];

  if (selectedTypes.includes("nativeModule")) {
    const moduleName = checkCancel<string>(
      await text({
        message: "Native Module name (e.g. LocalStorage):",
        validate(value) {
          if (!value) return "Module name required";
          if (!pascalCheck(value)) return "Must be PascalCase";
        },
      })
    );

    moduleInterfaces += `
// ${moduleName} module interface
export interface ${moduleName}Module extends TigerModule {
  helloWorld(name: string): string;
}
`;

    moduleExports += `export { ${moduleName}Module } from "./module";\n`;

    nativeModules.push({
      name: moduleName,
      className: `${moduleName}Module`,
    });
  }

  if (selectedTypes.includes("element")) {
    const elementName = checkCancel<string>(
      await text({
        message: "Element name (e.g. Button):",
        validate(value) {
          if (!value) return "Element name required";
          if (!pascalCheck(value)) return "Must be PascalCase";
        },
      })
    );

    moduleInterfaces += `
// ${elementName} element interface
export interface ${elementName}Props {
  // Define your element props here
}
`;

    moduleExports += `export { ${elementName}Props } from "./module";\n`;

    elements.push({ name: elementName });
  }

  if (selectedTypes.includes("service")) {
    const serviceName = checkCancel<string>(
      await text({
        message: "Service name (e.g. LogService):",
        validate(value) {
          if (!value) return "Service name required";
          if (!pascalCheck(value)) return "Must be PascalCase";
        },
      })
    );

    moduleInterfaces += `
// ${serviceName} service interface
export interface ${serviceName} {
  // Define your service methods here
}
`;

    moduleExports += `export { ${serviceName} } from "./module";\n`;

    services.push(serviceName);
  }

  // --- TS interfaces ---
  const moduleFile = "src/module.ts";
  writeFileSync(
    path.join(dir, moduleFile),
    `import { type TigerModule } from "tiger/runtime";
${moduleInterfaces}`
  );

  const srcFile = "src/index.ts";
  writeFileSync(path.join(dir, srcFile), moduleExports);

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
        build: "tiger build",
        dev: "tsdown --watch",
        typecheck: "tsc --noEmit",
        release: "bumpp && npm publish",
        codegen: "tiger codegen",
      },
      devDependencies: {
        "@types/node": "^24.8.1",
        "tiger": "latest",
        tsdown: "^0.15.8",
        typescript: "^5.9.3",
      },
      dependencies: {
        "@lynx-js/types": "^3.4.11",
      },
    },
    { spaces: 2 }
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
    { spaces: 2 }
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
])
`
  );

  // --- tiger.config.ts (autolink configuration) ---
  // Note: nativeModules is now optional and auto-discovered from @LynxNativeModule annotations
  // Only include elements and services if they exist
  const configExtensions = [];
  if (elements.length > 0) {
    configExtensions.push(`  elements: ${JSON.stringify(elements, null, 4)}`);
  }
  if (services.length > 0) {
    configExtensions.push(`  services: ${JSON.stringify(services, null, 4)}`);
  }
  
  const extensionsConfig = configExtensions.length > 0 
    ? `,\n  dependencies: [],\n${configExtensions.join(',\n')}`
    : '';

  const configContent = `import { defineConfig } from 'tiger/config';

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
  }${extensionsConfig}
});
`;

  writeFileSync(path.join(dir, "tiger.config.ts"), configContent);

  // Create platform directories with RFC structure
  mkdirpSync(path.join(dir, "android", "src", "main", "kotlin"));
  mkdirpSync(path.join(dir, "ios", "src"));
  mkdirpSync(path.join(dir, "web", "src"));

  // Ask if user wants to create example Android app
  const createExample = checkCancel<boolean>(
    await select({
      message: "Create example Android app for testing?",
      options: [
        { value: true, label: "Yes (recommended)" },
        { value: false, label: "No" },
      ],
      initialValue: true,
    })
  );

  if (createExample) {
    console.log(chalk.cyan("\n📱 Creating example Android app..."));

    // Import ProjectBuilder and related utilities
    const { ProjectBuilder } = await import(
      "../core/project-builder/project-builder.js"
    );
    const { templatePath } = await import(
      "../core/project-builder/template.js"
    );
    const { ActionRunner } = await import("../core/actions/action-runner.js");
    const { defaultLogger } = await import("../core/logger.js");

    const exampleBuilder = ProjectBuilder.create({
      checkEmpty: false,
      packageName: `${projectName}-example`,
      targetDir: path.join(dir, "example"),
    });

    // Load app template for Android
    await exampleBuilder.loadTemplate(
      templatePath("app-common-android-kotlin"),
      {
        variables: {
          packageName: `${androidPackageName}.example`,
          packagePath: `${androidPackageName}.example`.replace(/\./g, "/"),
          appName: `${projectName}-example`,
        },
      }
    );

    const exampleActionContext = {
      devMode: false,
      environment: "development" as const,
      logger: defaultLogger,
      projectRoot: process.cwd(),
    };

    const exampleRunner = new ActionRunner(exampleActionContext);
    const exampleAction = exampleBuilder.toSingleAction(
      "create-example-app",
      `Create example app for '${projectName}'`
    );

    exampleRunner.addAction(exampleAction);
    await exampleRunner.run();

    console.log(
      chalk.green("✅ Example Android app created in example/ folder")
    );
  }

  const nextSteps = [
    `1. ${chalk.cyan(`cd ${projectName}`)}`,
    `2. ${chalk.cyan("Update src/module.ts with your interfaces")}`,
    `3. ${chalk.cyan("tiger codegen")} - auto-discovers modules and generates base classes`,
    `4. ${chalk.cyan(
      "Implement native code that extends the generated base classes"
    )}`,
    `   ${chalk.gray("(Use @LynxNativeModule annotation to register your module)")}`,
    ...(createExample
      ? [
          `5. ${chalk.cyan(
            "cd example && ./gradlew assembleDebug"
          )} - test your extension`,
        ]
      : []),
    `${createExample ? "6" : "5"}. ${chalk.cyan("tiger build")}`,
    `${createExample ? "7" : "6"}. ${chalk.cyan(
      "Publish to npm - extensions will auto-integrate via Autolink!"
    )}`,
  ];

  note(nextSteps.map((step) => chalk.reset(step)).join("\n"), "Next steps");

  outro(chalk.green("✅ Autolink extension scaffold created!"));

  console.log(chalk.cyanBright("\nGenerated structure:"));
  selectedTypes.forEach((type) => {
    const typeName = type
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase());
    console.log(chalk.gray(`  ✓ ${typeName} scaffolding created`));
  });

  if (createExample) {
    console.log(chalk.gray(`  ✓ Example Android app created`));
  }
}

// Allow running directly for development
if (process.argv[1] && process.argv[1].endsWith("init.ts")) {
  // invoked directly
  initModule().catch(console.error);
}

import { intro, multiselect, note, outro, select, text } from "@clack/prompts";
import chalk from "chalk";
import { Command } from "commander";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { ActionRunner } from "../core/actions/action-runner.js";
import { defaultLogger } from "../core/logger.js";
import { ProjectBuilder } from "../core/project-builder/project-builder.js";
import {
  checkCancel,
  defaultLanguage,
  formatProjectName,
  templatePath,
} from "../core/project-builder/template.js";
import {
  readPackageJson,
  writeJSON,
  writePackageJson,
} from "../utils/common.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const logger = defaultLogger;

interface CreateOptions {
  type?: "app" | "extension";
}

/**
 * Create a new project from templates (app or extension)
 * This is the main entry point for the create-new command
 */
export async function createNew(
  providedProjectName?: string,
  options: CreateOptions = {}
) {
  intro(chalk.cyan("Create New Project"));

  // Determine project type
  const projectType =
    options.type ||
    checkCancel<"app" | "extension">(
      await select({
        message: "Select project type",
        options: [
          { label: "Application", value: "app" },
          { label: "Extension (Module/Element)", value: "extension" },
        ],
      })
    );

  if (projectType === "app") {
    await createApp(providedProjectName);
  } else {
    await createExtension(providedProjectName);
  }
}

/**
 * Create a new app project
 */
async function createApp(providedProjectName?: string) {
  // Get project name from user input
  const projectName =
    providedProjectName ||
    checkCancel<string>(
      await text({
        message: "Project name or path",
        placeholder: "my-lynx-app",
        defaultValue: "my-lynx-app",
        validate(value) {
          if (value.length === 0) {
            return "Project name is required";
          }
        },
      })
    );

  const formatted = formatProjectName(projectName);
  const { packageName, targetDir } = formatted;
  const cwd = process.cwd();
  const distFolder = path.isAbsolute(targetDir)
    ? targetDir
    : path.join(cwd, targetDir);

  // Create ProjectBuilder instance
  const builder = ProjectBuilder.create({
    checkEmpty: true,
    packageName,
    targetDir: distFolder,
  });

  logger.info("Creating files from app template");

  // Load template with inheritance support
  await builder.loadTemplate(templatePath("app-common-react-ts"), {
    variables: {
      appName: packageName,
    },
  });

  // Generate action and execute
  const actionContext = {
    devMode: false,
    environment: "development" as const,
    logger,
    projectRoot: process.cwd(),
  };

  const runner = new ActionRunner(actionContext);
  const projectAction = builder.toSingleAction(
    "create-app-project",
    `Create app project '${packageName}'`
  );

  runner.addAction(projectAction);
  await runner.run();

  const nextSteps = [
    `1. ${chalk.cyan(`cd ${targetDir}`)}`,
    `2. ${chalk.cyan("git init")} ${chalk.dim("(optional)")}`,
    `3. ${chalk.cyan("npm install")}`,
    `4. ${chalk.cyan("npm run dev")}`,
  ];

  note(nextSteps.map((step) => chalk.reset(step)).join("\n"), "Next steps");
  outro(chalk.green("Successfully created app project from template"));
}

/**
 * Create a new extension project
 */
async function createExtension(providedProjectName?: string) {
  // Get project name from user input
  const projectName =
    providedProjectName ||
    checkCancel<string>(
      await text({
        message: "Extension name or path",
        placeholder: "my-extension",
        defaultValue: "my-extension",
        validate(value) {
          if (value.length === 0) {
            return "Extension name is required";
          }
        },
      })
    );

  // Choose platforms
  const chosenPlatforms = checkCancel<string[]>(
    await multiselect({
      message: "Choose platforms (Use <space> to select, <enter> to continue)",
      options: [
        { label: "Android (Kotlin)", value: "android" },
        { label: "iOS (Swift/Objective-C)", value: "ios" },
        { label: "Web (TypeScript)", value: "web" },
      ],
      required: false,
    })
  );

  // Choose extension type if platforms selected
  const extensionType =
    chosenPlatforms.length > 0
      ? checkCancel<"module" | "element">(
          await select({
            message: "Select extension type",
            options: [
              { label: "Native Module", value: "module" },
              { label: "Custom Element", value: "element" },
            ],
          })
        )
      : "module";

  const formatted = formatProjectName(projectName);
  const { packageName, targetDir } = formatted;
  const cwd = process.cwd();
  const distFolder = path.isAbsolute(targetDir)
    ? targetDir
    : path.join(cwd, targetDir);

  logger.info(`[DEBUG] cwd: ${cwd}`);
  logger.info(`[DEBUG] targetDir: ${targetDir}`);
  logger.info(`[DEBUG] distFolder: ${distFolder}`);
  logger.info(`[DEBUG] packageName: ${packageName}`);

  // Create ProjectBuilder instance
  const builder = ProjectBuilder.create({
    checkEmpty: true,
    packageName,
    targetDir: distFolder,
  });

  logger.info(`Creating files from ${extensionType} template`);

  // Load common extension template
  const commonTemplatePath = templatePath(`extension-common-react-ts`);
  logger.info(`[DEBUG] Loading common template from: ${commonTemplatePath}`);
  
  await builder.loadTemplate(commonTemplatePath, {
    variables: {
      componentName: packageName,
    },
  });

  // Load extension-specific template
  const extensionTemplatePath = templatePath(`extension-${extensionType}-react-ts`);
  logger.info(`[DEBUG] Loading extension template from: ${extensionTemplatePath}`);
  
  await builder.loadTemplate(
    extensionTemplatePath,
    {
      variables: {
        componentName: packageName,
      },
    }
  );

  // Load platform-specific templates
  for (const platform of chosenPlatforms) {
    logger.info(`Creating files from ${platform} template`);
    const language = defaultLanguage(platform);

    const platformVariables: Record<string, string> = {
      componentName: packageName,
      packageName: `com.lynxjs.${packageName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "")}`,
    };

    // Add platform-specific variables
    if (platform === "android") {
      platformVariables.packagePath = platformVariables.packageName.replace(
        /\./g,
        "/"
      );
    }

    const platformTemplatePath = templatePath(`extension-${extensionType}-${platform}-${language}`);
    logger.info(`[DEBUG] Loading platform template from: ${platformTemplatePath}`);

    builder.addStep({
      from: platformTemplatePath,
      to: platform,
      variables: platformVariables,
    });
  }

  // Add post-hook for package.json modifications
  builder.addStep({
    async postHook(config) {
      logger.info(`[DEBUG] Post-hook: Reading package.json from ${config.targetDir}`);
      
      // Update root package.json
      const rootPackageJson = await readPackageJson(config.targetDir);
      rootPackageJson.name = packageName;
      rootPackageJson.version = "0.0.1";
      await writePackageJson(config.targetDir, rootPackageJson);

      // Update example package.json if it exists
      const examplePath = path.resolve(config.targetDir, "example");
      logger.info(`[DEBUG] Post-hook: Checking example at ${examplePath}`);
      
      try {
        const examplePackageJson = await readPackageJson(examplePath);
        examplePackageJson.dependencies = examplePackageJson.dependencies || {};
        examplePackageJson.dependencies[packageName] = "file:..";
        examplePackageJson.name = `${packageName}-example`;
        await writePackageJson(examplePath, examplePackageJson);
      } catch (error) {
        logger.info(`[DEBUG] Example package.json not found or error: ${error}`);
      }
    },
  });

  // Create tiger.config.json
  builder.addStep({
    async postHook(config) {
      const tigerConfig: any = {
        name: packageName,
        version: "0.0.1",
        platforms: {},
      };

      for (const platform of chosenPlatforms) {
        if (platform === "android") {
          tigerConfig.platforms.android = {
            packageName: `com.lynxjs.${packageName
              .toLowerCase()
              .replace(/[^a-z0-9]/g, "")}`,
            language: "kotlin",
          };
        } else if (platform === "ios") {
          tigerConfig.platforms.ios = {
            sourceDir: "ios/src",
          };
        } else if (platform === "web") {
          tigerConfig.platforms.web = {
            entry: "web/src/index.ts",
          };
        }
      }

      // Add module/element configuration
      if (extensionType === "module") {
        tigerConfig.nativeModules = [
          {
            name: packageName,
            className: `${packageName}Module`,
          },
        ];
      } else {
        tigerConfig.elements = [
          {
            name: packageName.toLowerCase(),
          },
        ];
      }

      const configPath = path.resolve(config.targetDir, "tiger.config.json");
      await writeJSON(configPath, tigerConfig);
    },
  });

  // Generate action and execute
  const actionContext = {
    devMode: false,
    environment: "development" as const,
    logger,
    projectRoot: process.cwd(),
  };

  const runner = new ActionRunner(actionContext);
  const projectAction = builder.toSingleAction(
    "create-extension-project",
    `Create ${extensionType} extension '${packageName}' with ${
      chosenPlatforms.length > 0 ? "native platforms" : "web only"
    }`
  );

  runner.addAction(projectAction);
  await runner.run();

  const nextSteps = [
    `1. ${chalk.cyan(`cd ${targetDir}`)}`,
    `2. ${chalk.cyan("git init")} ${chalk.dim("(optional)")}`,
    `3. ${chalk.cyan("npm install")}`,
    `4. ${chalk.cyan("npm run codegen")} ${chalk.dim(
      "(generate native code)"
    )}`,
    `5. ${chalk.cyan("npm run build")}`,
  ];

  note(nextSteps.map((step) => chalk.reset(step)).join("\n"), "Next steps");
  outro(chalk.green("Successfully created extension project from template"));
}

/**
 * Register the create-new command
 */
export function registerCreateNewCommand(program: Command) {
  program
    .command("create [name]")
    .description("Create a new project from templates")
    .option("-t, --type <type>", "Project type: app or extension")
    .action(async (name: string | undefined, options: CreateOptions) => {
      try {
        await createNew(name, options);
      } catch (error) {
        if (error instanceof Error) {
          logger.error(error.message);
        }
        process.exit(1);
      }
    });
}

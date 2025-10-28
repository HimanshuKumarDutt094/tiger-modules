import { spawn } from "node:child_process";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import type { Action, ActionContext, ActionResult } from "../actions/action.js";
import type { VariablesMap } from "../../utils/file-templater.js";
import { templatePath } from "./template.js";

export interface ProjectBuilderConfig {
  checkEmpty?: boolean;
  packageName: string;
  targetDir: string;
  version?: string;
}

export interface BuildStep {
  from?: string;
  to?: string;
  variables?: VariablesMap;
  skipFiles?: string[];
  renameFiles?: Record<string, string>;
  postHook?(config: ProjectBuilderConfig): Promise<void>;
}

export class ProjectBuilder {
  private config: ProjectBuilderConfig;
  private steps: BuildStep[] = [];

  private constructor(config: ProjectBuilderConfig) {
    this.config = config;
  }

  static create(config: ProjectBuilderConfig): ProjectBuilder {
    return new ProjectBuilder(config);
  }

  /**
   * Load template with automatic inheritance support
   * Processes <inherit:template-name> files to load parent templates first
   */
  async loadTemplate(
    templateDir: string,
    options: {
      variables?: VariablesMap;
      to?: string;
      skipFiles?: string[];
      renameFiles?: Record<string, string>;
    } = {}
  ): Promise<void> {
    const { variables = {}, to = "", skipFiles = [], renameFiles } = options;

    // Process inheritance files first
    const inheritanceSteps = await this.processInheritanceFiles(
      templateDir,
      variables
    );

    // Add inheritance steps
    for (const step of inheritanceSteps) {
      this.steps.push(step);
    }

    // Get list of inheritance files to skip
    const inheritanceFiles = await this.getInheritanceFileNames(templateDir);

    // Add the main template step
    this.steps.push({
      from: templateDir,
      to,
      variables,
      skipFiles: [...skipFiles, ...inheritanceFiles],
      renameFiles,
    });
  }

  addStep(step: BuildStep): void {
    this.steps.push(step);
  }

  /**
   * Convert the ProjectBuilder to a single Action that can be executed by ActionRunner
   */
  toSingleAction(name: string, description: string): Action {
    return {
      name,
      description,
      execute: async (context: ActionContext): Promise<ActionResult> => {
        await this.executeSteps(context);
        return {
          crucialOutputPaths: [this.config.targetDir],
          outputPaths: [this.config.targetDir],
          result: {
            packageName: this.config.packageName,
            targetDir: this.config.targetDir,
          },
        };
      },
    };
  }

  private async executeSteps(context: ActionContext): Promise<void> {
    // Check if target directory should be empty
    if (this.config.checkEmpty) {
      await this.ensureEmptyDirectory();
    }

    // Ensure target directory exists
    await fsp.mkdir(this.config.targetDir, { recursive: true });

    for (const step of this.steps) {
      if (step.from && step.to !== undefined) {
        await this.copyTemplate(
          step.from,
          step.to,
          step.variables || {},
          step.skipFiles || [],
          step.renameFiles || { gitignore: ".gitignore" },
          context
        );
      }

      if (step.postHook) {
        await step.postHook(this.config);
      }
    }
  }

  private async ensureEmptyDirectory(): Promise<void> {
    try {
      const stats = await fsp.stat(this.config.targetDir);
      if (stats.isDirectory()) {
        const entries = await fsp.readdir(this.config.targetDir);
        if (entries.length > 0) {
          throw new Error(`Directory ${this.config.targetDir} is not empty`);
        }
      }
    } catch (error: any) {
      if (error.code !== "ENOENT") {
        throw error;
      }
    }
  }

  private async copyTemplate(
    templateDir: string,
    relativeTo: string,
    variables: VariablesMap,
    skipFiles: string[],
    renameFiles: Record<string, string>,
    context: ActionContext
  ): Promise<void> {
    const targetPath = path.join(this.config.targetDir, relativeTo);

    context.logger.info(
      `Copying template from ${templateDir} to ${targetPath}`
    );

    // Check if template path exists
    try {
      await fsp.access(templateDir);
    } catch {
      throw new Error(`Template path does not exist: ${templateDir}`);
    }

    // Copy directory recursively
    await this.copyDirectory(
      templateDir,
      targetPath,
      variables,
      skipFiles,
      renameFiles
    );

    // Execute prepare commands after copying
    await this.executePrepareCommands(targetPath, variables, context);
  }

  private async copyDirectory(
    src: string,
    dest: string,
    variables: VariablesMap,
    skipFiles: string[],
    renameFiles: Record<string, string>
  ): Promise<void> {
    await fsp.mkdir(dest, { recursive: true });

    const entries = await fsp.readdir(src, { withFileTypes: true });

    for (const entry of entries) {
      // Skip files that should be ignored
      if (
        skipFiles.includes(entry.name) ||
        entry.name === "node_modules" ||
        entry.name === "dist"
      ) {
        continue;
      }

      // Skip inheritance files
      if (entry.name.startsWith("<inherit:") && entry.name.endsWith(">")) {
        continue;
      }

      // Skip prepare_command files during copy
      if (entry.name === "<prepare_command>") {
        continue;
      }

      const srcPath = path.join(src, entry.name);

      // Apply file renaming (e.g., gitignore -> .gitignore)
      let destName = renameFiles[entry.name] || entry.name;

      // Replace variables in file/directory names
      if (Object.keys(variables).length > 0) {
        for (const key in variables) {
          if (Object.hasOwn(variables, key)) {
            const placeholder = `{{${key.trim()}}}`;
            const regex = new RegExp(
              placeholder.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
              "g"
            );
            destName = destName.replace(regex, String(variables[key]));
          }
        }
      }

      const destPath = path.join(dest, destName);

      if (entry.isDirectory()) {
        await this.copyDirectory(
          srcPath,
          destPath,
          variables,
          skipFiles,
          renameFiles
        );
      } else {
        // Copy file and replace template variables in content
        let content: string;
        try {
          content = await fsp.readFile(srcPath, "utf8");
        } catch (error) {
          // Skip binary files or files that can't be read as text
          await fsp.copyFile(srcPath, destPath);
          continue;
        }

        let processedContent = content;

        if (Object.keys(variables).length > 0) {
          for (const key in variables) {
            if (Object.hasOwn(variables, key)) {
              const placeholder = `{{${key.trim()}}}`;
              const regex = new RegExp(
                placeholder.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
                "g"
              );
              processedContent = processedContent.replace(
                regex,
                String(variables[key])
              );
            }
          }
        }

        await fsp.writeFile(destPath, processedContent, "utf8");
      }
    }
  }

  /**
   * Process inheritance files in template directory
   * Returns array of template steps for inherited templates
   */
  private async processInheritanceFiles(
    templateDir: string,
    variables: VariablesMap,
    processedTemplates: Set<string> = new Set()
  ): Promise<BuildStep[]> {
    const inheritanceSteps: BuildStep[] = [];

    // Prevent circular inheritance
    if (processedTemplates.has(templateDir)) {
      return inheritanceSteps;
    }

    processedTemplates.add(templateDir);

    try {
      const files = await fsp.readdir(templateDir);

      for (const file of files) {
        if (file.startsWith("<inherit:") && file.endsWith(">")) {
          // Extract template name from <inherit:xxx> format
          const templateName = file.slice(9, -1); // Remove '<inherit:' and '>'

          if (templateName) {
            const inheritedTemplatePath = templatePath(templateName);

            // Check if inherited template exists
            if (fs.existsSync(inheritedTemplatePath)) {
              // Recursively process inheritance files in the inherited template
              const nestedInheritanceSteps = await this.processInheritanceFiles(
                inheritedTemplatePath,
                variables,
                new Set(processedTemplates)
              );

              // Add nested inheritance steps first (deeper inheritance has higher priority)
              inheritanceSteps.push(...nestedInheritanceSteps);

              // Add the inherited template step
              inheritanceSteps.push({
                from: inheritedTemplatePath,
                to: "",
                variables,
              });
            }
          }
        }
      }
    } catch (error) {
      // Ignore errors reading directory
    }

    return inheritanceSteps;
  }

  /**
   * Get inheritance file names to skip during template copying
   */
  private async getInheritanceFileNames(
    templateDir: string
  ): Promise<string[]> {
    const inheritanceFiles: string[] = [];

    try {
      const files = await fsp.readdir(templateDir);

      for (const file of files) {
        if (file.startsWith("<inherit:") && file.endsWith(">")) {
          inheritanceFiles.push(file);
        }
      }
    } catch (error) {
      // Ignore errors
    }

    return inheritanceFiles;
  }

  /**
   * Execute prepare commands found in the target directory
   */
  private async executePrepareCommands(
    targetDir: string,
    variables: VariablesMap,
    context: ActionContext
  ): Promise<void> {
    const prepareCommandFiles = this.findPrepareCommandFiles(targetDir);

    if (prepareCommandFiles.length === 0) {
      return;
    }

    context.logger.info(
      `Found ${prepareCommandFiles.length} prepare command(s) to execute`
    );

    for (const commandFile of prepareCommandFiles) {
      try {
        // Read command content
        let commandContent = fs.readFileSync(commandFile, "utf8").trim();

        // Replace variables in command content
        if (Object.keys(variables).length > 0) {
          for (const [key, value] of Object.entries(variables)) {
            const placeholder = `{{${key.trim()}}}`;
            const regex = new RegExp(
              placeholder.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
              "g"
            );
            commandContent = commandContent.replace(regex, String(value));
          }
        }

        if (commandContent) {
          context.logger.info(`Executing prepare command: ${commandContent}`);
          await this.executeCommand(
            commandContent,
            path.dirname(commandFile),
            context
          );
        }

        // Remove the prepare command file after execution
        fs.unlinkSync(commandFile);
        context.logger.info(`Removed prepare command file: ${commandFile}`);
      } catch (error) {
        context.logger.error(
          `Failed to execute prepare command ${commandFile}: ${error}`
        );
        throw error;
      }
    }
  }

  /**
   * Find all <prepare_command> files in a directory recursively
   */
  private findPrepareCommandFiles(dir: string): string[] {
    const prepareCommandFiles: string[] = [];

    if (!fs.existsSync(dir)) {
      return prepareCommandFiles;
    }

    try {
      const files = fs.readdirSync(dir);

      for (const file of files) {
        const filePath = path.resolve(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isFile() && file === "<prepare_command>") {
          prepareCommandFiles.push(filePath);
        } else if (stat.isDirectory()) {
          const subdirFiles = this.findPrepareCommandFiles(filePath);
          prepareCommandFiles.push(...subdirFiles);
        }
      }
    } catch (error) {
      // Ignore errors
    }

    return prepareCommandFiles;
  }

  /**
   * Execute a shell command
   */
  private async executeCommand(
    command: string,
    cwd: string,
    context: ActionContext
  ): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const parts = command.split(" ");
      const cmd = parts[0];
      const args = parts.slice(1);

      const child = spawn(cmd, args, {
        cwd,
        stdio: "pipe",
      });

      child.stdout?.on("data", (data) => {
        context.logger.info(data.toString().trim());
      });

      child.stderr?.on("data", (data) => {
        context.logger.warn(data.toString().trim());
      });

      child.on("close", (code) => {
        if (code === 0) {
          context.logger.info(`Command finished successfully: ${command}`);
          resolve();
        } else {
          reject(new Error(`Command exited with code ${code}: ${command}`));
        }
      });

      child.on("error", (err) => {
        reject(
          new Error(`Failed to execute command ${command}: ${err.message}`)
        );
      });
    });
  }
}

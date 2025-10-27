import fs from 'node:fs/promises';
import path from 'node:path';
import type{ Action, ActionContext, ActionResult } from '../actions/action.js';
import { FileTemplater,type VariablesMap } from '../../utils/file-templater.js';

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

  async loadTemplate(templatePath: string, options: { variables?: VariablesMap } = {}): Promise<void> {
    this.steps.push({
      from: templatePath,
      to: '',
      variables: options.variables || {}
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
            targetDir: this.config.targetDir
          }
        };
      }
    };
  }

  private async executeSteps(context: ActionContext): Promise<void> {
    // Check if target directory should be empty
    if (this.config.checkEmpty) {
      await this.ensureEmptyDirectory();
    }

    // Ensure target directory exists
    await fs.mkdir(this.config.targetDir, { recursive: true });

    for (const step of this.steps) {
      if (step.from && step.to !== undefined) {
        await this.copyTemplate(step.from, step.to, step.variables || {}, context);
      }

      if (step.postHook) {
        await step.postHook(this.config);
      }
    }
  }

  private async ensureEmptyDirectory(): Promise<void> {
    try {
      const stats = await fs.stat(this.config.targetDir);
      if (stats.isDirectory()) {
        const entries = await fs.readdir(this.config.targetDir);
        if (entries.length > 0) {
          throw new Error(`Directory ${this.config.targetDir} is not empty`);
        }
      }
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
  }

  private async copyTemplate(
    templatePath: string, 
    relativeTo: string, 
    variables: VariablesMap,
    context: ActionContext
  ): Promise<void> {
    const targetPath = path.join(this.config.targetDir, relativeTo);
    
    context.logger.info(`Copying template from ${templatePath} to ${targetPath}`);
    
    // Check if template path exists
    try {
      await fs.access(templatePath);
    } catch {
      throw new Error(`Template path does not exist: ${templatePath}`);
    }

    // Copy directory recursively
    await this.copyDirectory(templatePath, targetPath, variables);
  }

  private async copyDirectory(src: string, dest: string, variables: VariablesMap): Promise<void> {
    await fs.mkdir(dest, { recursive: true });
    
    const entries = await fs.readdir(src, { withFileTypes: true });
    
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      let destPath = path.join(dest, entry.name);
      
      // Replace variables in file/directory names
      if (Object.keys(variables).length > 0) {
        let processedName = entry.name;
        for (const key in variables) {
          if (Object.hasOwn(variables, key)) {
            const placeholder = `{{${key.trim()}}}`;
            processedName = processedName.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), String(variables[key]));
          }
        }
        destPath = path.join(dest, processedName);
      }
      
      if (entry.isDirectory()) {
        await this.copyDirectory(srcPath, destPath, variables);
      } else {
        // Copy file and replace template variables in content
        let content: string;
        try {
          content = await fs.readFile(srcPath, 'utf8');
        } catch (error) {
          // Skip binary files or files that can't be read as text
          await fs.copyFile(srcPath, destPath);
          continue;
        }
        
        let processedContent = content;
        
        if (Object.keys(variables).length > 0) {
          for (const key in variables) {
            if (Object.hasOwn(variables, key)) {
              const placeholder = `{{${key.trim()}}}`;
              const regex = new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
              processedContent = processedContent.replace(regex, String(variables[key]));
            }
          }
        }
        
        await fs.writeFile(destPath, processedContent, 'utf8');
      }
    }
  }
}
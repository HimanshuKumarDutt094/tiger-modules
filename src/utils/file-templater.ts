import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Interface for the variables map.
 */
export interface VariablesMap {
  [key: string]: boolean | number | string;
}

/**
 * Utility class for replacing template placeholders in files.
 */
export class FileTemplater {
  /**
   * Escapes special characters in a string for use in a regular expression.
   */
  private static escapeRegExp(str: string): string {
    return str.replaceAll(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Renames all directories within a given directory that contain template variables in their names.
   */
  public static async renameDirectoryContentsWithVariables(
    directoryPath: string,
    variables: VariablesMap
  ): Promise<void> {
    if (!path.isAbsolute(directoryPath)) {
      throw new Error('Directory path must be absolute.');
    }

    let entries;
    try {
      entries = await fs.readdir(directoryPath, { withFileTypes: true });
    } catch (error: unknown) {
      throw new Error(`Failed to read directory ${directoryPath}: ${error}`);
    }

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const originalEntryPath = path.join(directoryPath, entry.name);
        
        // Check if the directory name itself contains placeholders
        let hasPlaceholders = false;
        for (const key in variables) {
          if (Object.hasOwn(variables, key)) {
            const placeholder = `{{${key.trim()}}}`;
            if (entry.name.includes(placeholder)) {
              hasPlaceholders = true;
              break;
            }
          }
        }

        let currentEntryPath = originalEntryPath;
        if (hasPlaceholders) {
          try {
            currentEntryPath = await this.renamePathWithVariables(originalEntryPath, variables, directoryPath);
          } catch (error: unknown) {
            console.error(`Failed to rename directory ${originalEntryPath}: ${error}`);
          }
        }

        // Recursively process the directory
        await this.renameDirectoryContentsWithVariables(currentEntryPath, variables);
      }
    }
  }

  /**
   * Replaces placeholders in a path string and renames the path.
   */
  public static async renamePathWithVariables(
    originalPath: string,
    variables: VariablesMap,
    basePath: string = process.cwd()
  ): Promise<string> {
    if (!originalPath) {
      throw new Error('Original path cannot be empty.');
    }

    let newPathString = originalPath;
    for (const key in variables) {
      if (Object.hasOwn(variables, key)) {
        const placeholder = `{{${key.trim()}}}`;
        const regex = new RegExp(this.escapeRegExp(placeholder), 'g');
        newPathString = newPathString.replace(regex, String(variables[key]));
      }
    }

    const resolvedOriginalPath = path.isAbsolute(originalPath) ? originalPath : path.resolve(basePath, originalPath);
    const resolvedNewPath = path.isAbsolute(newPathString) ? newPathString : path.resolve(basePath, newPathString);

    if (resolvedOriginalPath === resolvedNewPath) {
      return resolvedNewPath;
    }

    try {
      await fs.access(resolvedOriginalPath);
    } catch (error: unknown) {
      throw new Error(`Error accessing original path ${resolvedOriginalPath}: ${error}`);
    }

    try {
      const newPathParentDir = path.dirname(resolvedNewPath);
      await fs.mkdir(newPathParentDir, { recursive: true });
      await fs.rename(resolvedOriginalPath, resolvedNewPath);
      return resolvedNewPath;
    } catch (error: unknown) {
      throw new Error(`Failed to rename path from ${resolvedOriginalPath} to ${resolvedNewPath}: ${error}`);
    }
  }

  /**
   * Replaces placeholders in the format `{{key}}` within a file's content
   * with actual values from the provided variables map.
   */
  public static async replaceInFile(filePath: string, variables: VariablesMap): Promise<string> {
    if (!path.isAbsolute(filePath)) {
      throw new Error('File path must be absolute.');
    }

    let fileContent: string;
    try {
      fileContent = await fs.readFile(filePath, 'utf8');
    } catch (error: unknown) {
      throw new Error(`Failed to read template file ${filePath}: ${error}`);
    }

    if (!variables || Object.keys(variables).length === 0) {
      return fileContent;
    }

    let modifiedContent = fileContent;

    for (const key in variables) {
      if (Object.hasOwn(variables, key)) {
        const placeholder = `{{${key.trim()}}}`;
        const regex = new RegExp(this.escapeRegExp(placeholder), 'g');
        modifiedContent = modifiedContent.replace(regex, String(variables[key]));
      }
    }

    return modifiedContent;
  }

  /**
   * Replaces placeholders in a file and writes the modified content back to the same file.
   */
  public static async replaceInFileAndUpdate(filePath: string, variables: VariablesMap): Promise<void> {
    const modifiedContent = await this.replaceInFile(filePath, variables);
    try {
      await fs.writeFile(filePath, modifiedContent, 'utf8');
    } catch (error: unknown) {
      throw new Error(`Failed to write updated content to file ${filePath}: ${error}`);
    }
  }
}
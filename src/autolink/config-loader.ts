import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";
import type { LynxExtConfig } from "./config.js";

/**
 * Supported configuration file names in order of preference
 */
const CONFIG_FILES = [
  "lynx.ext.ts",
  "lynx.ext.js",
  "lynx.ext.mjs",
  "lynx.ext.cjs",
  "lynx.ext.json",
] as const;

export type ConfigFile = (typeof CONFIG_FILES)[number];

/**
 * Result of loading configuration
 */
export interface ConfigLoadResult {
  config: LynxExtConfig;
  configFile: ConfigFile;
  configPath: string;
}

/**
 * Load Lynx extension configuration from various file formats
 * Supports: lynx.ext.ts, lynx.ext.js, lynx.ext.mjs, lynx.ext.cjs, lynx.ext.json
 */
export async function loadConfig(
  projectRoot: string = process.cwd(),
): Promise<ConfigLoadResult> {
  // Find the first existing config file
  let configFile: ConfigFile | null = null;
  let configPath: string | null = null;

  for (const fileName of CONFIG_FILES) {
    const filePath = path.join(projectRoot, fileName);
    if (fs.existsSync(filePath)) {
      configFile = fileName;
      configPath = filePath;
      break;
    }
  }

  if (!configFile || !configPath) {
    throw new Error(
      `No Lynx extension configuration found. Expected one of:\n${CONFIG_FILES.map((f) => `  - ${f}`).join("\n")}\n\nRun 'lynxjs-module init' to create a new extension.`,
    );
  }

  let config: LynxExtConfig;

  try {
    if (configFile === "lynx.ext.json") {
      // Load JSON file
      const content = fs.readFileSync(configPath, "utf8");
      config = JSON.parse(content);
    } else {
      // Load JS/TS file using dynamic import
      const fileUrl = pathToFileURL(configPath).href;
      const module = await import(fileUrl);

      // Handle both default export and named export
      config = module.default || module.config;

      if (!config) {
        throw new Error(
          `Configuration file ${configFile} must export a default configuration or named 'config' export`,
        );
      }
    }
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(
        `Failed to parse ${configFile}: ${error.message}\n` +
          `Make sure the file has valid syntax and exports a configuration object.`,
      );
    }
    throw error;
  }

  return {
    config,
    configFile,
    configPath,
  };
}

/**
 * Synchronous version for cases where async is not possible
 * Only supports JSON format
 */
export function loadConfigSync(
  projectRoot: string = process.cwd(),
): ConfigLoadResult {
  const jsonPath = path.join(projectRoot, "lynx.ext.json");

  if (!fs.existsSync(jsonPath)) {
    throw new Error(
      `lynx.ext.json not found at ${jsonPath}\n` +
        `For TypeScript/JavaScript configs, use the async loadConfig() function.`,
    );
  }

  try {
    const content = fs.readFileSync(jsonPath, "utf8");
    const config = JSON.parse(content);

    return {
      config,
      configFile: "lynx.ext.json",
      configPath: jsonPath,
    };
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Failed to parse lynx.ext.json: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Get the preferred config file name for new projects
 */
export function getPreferredConfigFile(): ConfigFile {
  return "lynx.ext.ts";
}

/**
 * Configuration file parser for tiger.config.json
 * Handles parsing, validation, inheritance, and merging
 */

import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import type { AutolinkConfig, ValidationResult } from "./config.js";
import { ConfigValidationError, ConfigErrorType } from "./config.js";
import { validateAutolinkConfig } from "./validation.js";

/**
 * Default configuration values
 */
const DEFAULT_CONFIG: Partial<AutolinkConfig> = {
  dependencies: [],
  nativeModules: [],
  elements: [],
  services: [],
  platforms: {},
};

/**
 * Default platform-specific configurations
 */
const DEFAULT_ANDROID_CONFIG = {
  sourceDir: "android/src/main",
  buildTypes: ["debug", "release"],
};

const DEFAULT_IOS_CONFIG = {
  sourceDir: "ios/src",
  frameworks: [],
};

const DEFAULT_WEB_CONFIG = {
  entry: "web/src/index.ts",
};

/**
 * Parse result containing config and validation info
 */
export interface ParseResult {
  config: AutolinkConfig | null;
  validation: ValidationResult;
  path: string;
}

/**
 * Parses tiger.config.json from a given directory
 * @param packagePath - Path to the package directory
 * @returns Parse result with config and validation info
 */
export function parseAutolinkConfig(packagePath: string): ParseResult {
  const configPath = join(packagePath, "tiger.config.json");

  // Check if file exists
  if (!existsSync(configPath)) {
    return {
      config: null,
      validation: {
        valid: false,
        errors: [
          new ConfigValidationError(
            ConfigErrorType.MISSING_FILE,
            undefined,
            `Configuration file not found: ${configPath}`,
            "Create a tiger.config.json file in the package root",
          ),
        ],
        warnings: [],
      },
      path: configPath,
    };
  }

  try {
    // Read and parse JSON
    const fileContent = readFileSync(configPath, "utf-8");
    const rawConfig = JSON.parse(fileContent);

    // Validate the parsed config
    const validation = validateAutolinkConfig(rawConfig);

    if (!validation.valid) {
      return {
        config: null,
        validation,
        path: configPath,
      };
    }

    // Apply defaults and merge configurations
    const config = applyDefaults(rawConfig as AutolinkConfig);

    return {
      config,
      validation,
      path: configPath,
    };
  } catch (error) {
    // Handle JSON parse errors
    if (error instanceof SyntaxError) {
      return {
        config: null,
        validation: {
          valid: false,
          errors: [
            new ConfigValidationError(
              ConfigErrorType.INVALID_JSON,
              undefined,
              `Failed to parse JSON: ${error.message}`,
              "Ensure tiger.config.json contains valid JSON syntax",
            ),
          ],
          warnings: [],
        },
        path: configPath,
      };
    }

    // Handle other errors
    return {
      config: null,
      validation: {
        valid: false,
        errors: [
          new ConfigValidationError(
            ConfigErrorType.INVALID_JSON,
            undefined,
            `Failed to read configuration: ${error instanceof Error ? error.message : String(error)}`,
            "Check file permissions and format",
          ),
        ],
        warnings: [],
      },
      path: configPath,
    };
  }
}

/**
 * Applies default values to configuration
 * @param config - Raw configuration object
 * @returns Configuration with defaults applied
 */
function applyDefaults(config: AutolinkConfig): AutolinkConfig {
  const merged: AutolinkConfig = {
    ...DEFAULT_CONFIG,
    ...config,
    platforms: {
      ...config.platforms,
    },
  };

  // Apply platform-specific defaults
  if (merged.platforms.android) {
    merged.platforms.android = {
      ...DEFAULT_ANDROID_CONFIG,
      ...merged.platforms.android,
    };
  }

  if (merged.platforms.ios) {
    merged.platforms.ios = {
      ...DEFAULT_IOS_CONFIG,
      ...merged.platforms.ios,
    };
  }

  if (merged.platforms.web) {
    merged.platforms.web = {
      ...DEFAULT_WEB_CONFIG,
      ...merged.platforms.web,
    };
  }

  return merged;
}

/**
 * Merges multiple configurations with override priority
 * Later configs override earlier ones
 * @param configs - Array of configurations to merge
 * @returns Merged configuration
 */
export function mergeConfigs(
  ...configs: Partial<AutolinkConfig>[]
): Partial<AutolinkConfig> {
  const result: Partial<AutolinkConfig> = {
    platforms: {},
  };

  for (const config of configs) {
    if (!config) continue;

    // Merge top-level fields
    if (config.name !== undefined) result.name = config.name;
    if (config.version !== undefined) result.version = config.version;
    if (config.lynxVersion !== undefined)
      result.lynxVersion = config.lynxVersion;

    // Merge array fields (concatenate and deduplicate)
    if (config.dependencies) {
      result.dependencies = deduplicateArray([
        ...(result.dependencies || []),
        ...config.dependencies,
      ]);
    }
    if (config.nativeModules) {
      result.nativeModules = deduplicateArray([
        ...(result.nativeModules || []),
        ...config.nativeModules,
      ]);
    }
    if (config.elements) {
      result.elements = deduplicateArray([
        ...(result.elements || []),
        ...config.elements,
      ]);
    }
    if (config.services) {
      result.services = deduplicateArray([
        ...(result.services || []),
        ...config.services,
      ]);
    }

    // Merge platform configurations
    if (config.platforms) {
      if (!result.platforms) result.platforms = {};

      if (config.platforms.android) {
        result.platforms.android = {
          ...(result.platforms.android || {}),
          ...config.platforms.android,
        };
      }

      if (config.platforms.ios) {
        result.platforms.ios = {
          ...(result.platforms.ios || {}),
          ...config.platforms.ios,
        };
      }

      if (config.platforms.web) {
        result.platforms.web = {
          ...(result.platforms.web || {}),
          ...config.platforms.web,
        };
      }
    }
  }

  return result;
}

/**
 * Loads configuration with inheritance support
 * Supports extending from a base configuration
 * @param packagePath - Path to the package directory
 * @param baseConfigPath - Optional path to base configuration to extend
 * @returns Parse result with merged configuration
 */
export function loadConfigWithInheritance(
  packagePath: string,
  baseConfigPath?: string,
): ParseResult {
  const result = parseAutolinkConfig(packagePath);

  // If no base config or parsing failed, return as-is
  if (!baseConfigPath || !result.config) {
    return result;
  }

  // Load base configuration
  const baseResult = parseAutolinkConfig(dirname(baseConfigPath));

  // If base config is invalid, return original with warning
  if (!baseResult.config) {
    result.validation.warnings.push(
      `Base configuration at ${baseConfigPath} could not be loaded`,
    );
    return result;
  }

  // Merge base config with current config (current overrides base)
  const mergedConfig = mergeConfigs(
    baseResult.config,
    result.config,
  ) as AutolinkConfig;

  return {
    config: mergedConfig,
    validation: result.validation,
    path: result.path,
  };
}

/**
 * Helper: Removes duplicate items from array
 */
function deduplicateArray<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

/**
 * Validates and parses configuration from JSON string
 * Useful for testing or programmatic config creation
 * @param jsonString - JSON string to parse
 * @returns Parse result
 */
export function parseConfigFromString(jsonString: string): ParseResult {
  try {
    const rawConfig = JSON.parse(jsonString);
    const validation = validateAutolinkConfig(rawConfig);

    if (!validation.valid) {
      return {
        config: null,
        validation,
        path: "<string>",
      };
    }

    const config = applyDefaults(rawConfig as AutolinkConfig);

    return {
      config,
      validation,
      path: "<string>",
    };
  } catch (error) {
    return {
      config: null,
      validation: {
        valid: false,
        errors: [
          new ConfigValidationError(
            ConfigErrorType.INVALID_JSON,
            undefined,
            `Failed to parse JSON: ${error instanceof Error ? error.message : String(error)}`,
            "Ensure the string contains valid JSON",
          ),
        ],
        warnings: [],
      },
      path: "<string>",
    };
  }
}

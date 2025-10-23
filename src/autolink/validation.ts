/**
 * Configuration validation functions for AutolinkConfig
 * Provides comprehensive validation with detailed error messages
 */

import type {
  AutolinkConfig,
  AndroidConfig,
  IOSConfig,
  WebConfig,
  ValidationResult,
} from "./config.js";
import { ConfigValidationError, ConfigErrorType } from "./config.js";

/**
 * Validates the entire AutolinkConfig structure
 */
export function validateAutolinkConfig(config: unknown): ValidationResult {
  const errors: ConfigValidationError[] = [];
  const warnings: string[] = [];

  // Check if config is an object
  if (!config || typeof config !== "object") {
    errors.push(
      new ConfigValidationError(
        ConfigErrorType.INVALID_JSON,
        undefined,
        "Configuration must be a valid JSON object",
        "Ensure tiger.config.json contains a valid JSON object",
      ),
    );
    return { valid: false, errors, warnings };
  }

  const cfg = config as Partial<AutolinkConfig>;

  // Validate required fields
  validateRequiredField(cfg, "name", "string", errors);
  validateRequiredField(cfg, "version", "string", errors);
  validateRequiredField(cfg, "platforms", "object", errors);

  // Validate name format
  if (cfg.name) {
    if (!isValidPackageName(cfg.name)) {
      errors.push(
        new ConfigValidationError(
          ConfigErrorType.INVALID_PACKAGE_NAME,
          "name",
          `Invalid package name: ${cfg.name}`,
          "Package name should follow npm naming conventions (e.g., @lynxjs/extension-name or extension-name)",
        ),
      );
    }
  }

  // Validate version format
  if (cfg.version) {
    if (!isValidVersion(cfg.version)) {
      errors.push(
        new ConfigValidationError(
          ConfigErrorType.INVALID_VERSION,
          "version",
          `Invalid version format: ${cfg.version}`,
          "Version should follow semver format (e.g., 1.0.0)",
        ),
      );
    }
  }

  // Validate lynxVersion if present
  if (cfg.lynxVersion !== undefined) {
    if (typeof cfg.lynxVersion !== "string") {
      errors.push(
        new ConfigValidationError(
          ConfigErrorType.INVALID_FIELD_TYPE,
          "lynxVersion",
          "lynxVersion must be a string",
          'Use semver range format (e.g., ">=0.70.0")',
        ),
      );
    }
  }

  // Validate platforms
  if (cfg.platforms) {
    const platformErrors = validatePlatforms(cfg.platforms);
    errors.push(...platformErrors);

    // Check if at least one platform is configured
    const hasPlatform =
      cfg.platforms.android || cfg.platforms.ios || cfg.platforms.web;
    if (!hasPlatform) {
      errors.push(
        new ConfigValidationError(
          ConfigErrorType.NO_PLATFORMS,
          "platforms",
          "At least one platform must be configured",
          "Add android, ios, or web configuration to platforms object",
        ),
      );
    }
  }

  // Validate optional array fields
  validateOptionalArrayField(cfg, "dependencies", "string", errors, warnings);

  // Validate nativeModules - supports both string[] and NativeModuleConfig[]
  if (cfg.nativeModules !== undefined) {
    if (!Array.isArray(cfg.nativeModules)) {
      errors.push(
        new ConfigValidationError(
          ConfigErrorType.INVALID_FIELD_TYPE,
          "nativeModules",
          "nativeModules must be an array",
        ),
      );
    } else {
      const moduleErrors = validateNativeModules(cfg.nativeModules);
      errors.push(...moduleErrors);
    }
  }

  validateOptionalArrayField(cfg, "elements", "string", errors, warnings);
  validateOptionalArrayField(cfg, "services", "string", errors, warnings);

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validates platform configurations
 */
function validatePlatforms(
  platforms: AutolinkConfig["platforms"],
): ConfigValidationError[] {
  const errors: ConfigValidationError[] = [];

  if (typeof platforms !== "object" || platforms === null) {
    errors.push(
      new ConfigValidationError(
        ConfigErrorType.INVALID_FIELD_TYPE,
        "platforms",
        "platforms must be an object",
      ),
    );
    return errors;
  }

  // Validate Android config
  if (platforms.android !== undefined) {
    errors.push(...validateAndroidConfig(platforms.android));
  }

  // Validate iOS config
  if (platforms.ios !== undefined) {
    errors.push(...validateIOSConfig(platforms.ios));
  }

  // Validate Web config
  if (platforms.web !== undefined) {
    errors.push(...validateWebConfig(platforms.web));
  }

  return errors;
}

/**
 * Validates Android platform configuration
 */
function validateAndroidConfig(config: unknown): ConfigValidationError[] {
  const errors: ConfigValidationError[] = [];

  if (typeof config !== "object" || config === null) {
    errors.push(
      new ConfigValidationError(
        ConfigErrorType.INVALID_FIELD_TYPE,
        "platforms.android",
        "Android configuration must be an object",
      ),
    );
    return errors;
  }

  const androidCfg = config as Partial<AndroidConfig>;

  // packageName is required for Android
  if (!androidCfg.packageName) {
    errors.push(
      new ConfigValidationError(
        ConfigErrorType.MISSING_REQUIRED_FIELD,
        "platforms.android.packageName",
        "Android packageName is required",
        "Add packageName field (e.g., com.lynxjs.extensionname)",
      ),
    );
  } else if (typeof androidCfg.packageName !== "string") {
    errors.push(
      new ConfigValidationError(
        ConfigErrorType.INVALID_FIELD_TYPE,
        "platforms.android.packageName",
        "packageName must be a string",
      ),
    );
  } else if (!isValidAndroidPackageName(androidCfg.packageName)) {
    errors.push(
      new ConfigValidationError(
        ConfigErrorType.INVALID_FIELD_VALUE,
        "platforms.android.packageName",
        `Invalid Android package name: ${androidCfg.packageName}`,
        "Use reverse domain notation (e.g., com.company.module)",
      ),
    );
  }

  // Validate optional fields
  if (
    androidCfg.sourceDir !== undefined &&
    typeof androidCfg.sourceDir !== "string"
  ) {
    errors.push(
      new ConfigValidationError(
        ConfigErrorType.INVALID_FIELD_TYPE,
        "platforms.android.sourceDir",
        "sourceDir must be a string",
      ),
    );
  }

  if (androidCfg.buildTypes !== undefined) {
    if (!Array.isArray(androidCfg.buildTypes)) {
      errors.push(
        new ConfigValidationError(
          ConfigErrorType.INVALID_FIELD_TYPE,
          "platforms.android.buildTypes",
          "buildTypes must be an array",
        ),
      );
    } else if (!androidCfg.buildTypes.every((bt) => typeof bt === "string")) {
      errors.push(
        new ConfigValidationError(
          ConfigErrorType.INVALID_FIELD_TYPE,
          "platforms.android.buildTypes",
          "All buildTypes must be strings",
        ),
      );
    }
  }

  return errors;
}

/**
 * Validates iOS platform configuration
 */
function validateIOSConfig(config: unknown): ConfigValidationError[] {
  const errors: ConfigValidationError[] = [];

  if (typeof config !== "object" || config === null) {
    errors.push(
      new ConfigValidationError(
        ConfigErrorType.INVALID_FIELD_TYPE,
        "platforms.ios",
        "iOS configuration must be an object",
      ),
    );
    return errors;
  }

  const iosCfg = config as Partial<IOSConfig>;

  // Validate optional fields
  if (
    iosCfg.podspecPath !== undefined &&
    typeof iosCfg.podspecPath !== "string"
  ) {
    errors.push(
      new ConfigValidationError(
        ConfigErrorType.INVALID_FIELD_TYPE,
        "platforms.ios.podspecPath",
        "podspecPath must be a string",
      ),
    );
  }

  if (iosCfg.sourceDir !== undefined && typeof iosCfg.sourceDir !== "string") {
    errors.push(
      new ConfigValidationError(
        ConfigErrorType.INVALID_FIELD_TYPE,
        "platforms.ios.sourceDir",
        "sourceDir must be a string",
      ),
    );
  }

  if (iosCfg.frameworks !== undefined) {
    if (!Array.isArray(iosCfg.frameworks)) {
      errors.push(
        new ConfigValidationError(
          ConfigErrorType.INVALID_FIELD_TYPE,
          "platforms.ios.frameworks",
          "frameworks must be an array",
        ),
      );
    } else if (!iosCfg.frameworks.every((fw) => typeof fw === "string")) {
      errors.push(
        new ConfigValidationError(
          ConfigErrorType.INVALID_FIELD_TYPE,
          "platforms.ios.frameworks",
          "All frameworks must be strings",
        ),
      );
    }
  }

  return errors;
}

/**
 * Validates Web platform configuration
 */
function validateWebConfig(config: unknown): ConfigValidationError[] {
  const errors: ConfigValidationError[] = [];

  if (typeof config !== "object" || config === null) {
    errors.push(
      new ConfigValidationError(
        ConfigErrorType.INVALID_FIELD_TYPE,
        "platforms.web",
        "Web configuration must be an object",
      ),
    );
    return errors;
  }

  const webCfg = config as Partial<WebConfig>;

  // Validate optional fields
  if (webCfg.entry !== undefined && typeof webCfg.entry !== "string") {
    errors.push(
      new ConfigValidationError(
        ConfigErrorType.INVALID_FIELD_TYPE,
        "platforms.web.entry",
        "entry must be a string",
      ),
    );
  }

  return errors;
}

/**
 * Helper: Validates a required field exists and has correct type
 */
function validateRequiredField(
  config: Partial<AutolinkConfig>,
  field: keyof AutolinkConfig,
  expectedType: string,
  errors: ConfigValidationError[],
): void {
  if (config[field] === undefined) {
    errors.push(
      new ConfigValidationError(
        ConfigErrorType.MISSING_REQUIRED_FIELD,
        field,
        `Required field '${field}' is missing`,
        `Add '${field}' field to tiger.config.json`,
      ),
    );
  } else if (typeof config[field] !== expectedType) {
    errors.push(
      new ConfigValidationError(
        ConfigErrorType.INVALID_FIELD_TYPE,
        field,
        `Field '${field}' must be of type ${expectedType}`,
        `Ensure '${field}' is a ${expectedType}`,
      ),
    );
  }
}

/**
 * Helper: Validates an optional array field
 */
function validateOptionalArrayField(
  config: Partial<AutolinkConfig>,
  field: keyof AutolinkConfig,
  itemType: string,
  errors: ConfigValidationError[],
  warnings: string[],
): void {
  if (config[field] !== undefined) {
    if (!Array.isArray(config[field])) {
      errors.push(
        new ConfigValidationError(
          ConfigErrorType.INVALID_FIELD_TYPE,
          field,
          `Field '${field}' must be an array`,
        ),
      );
    } else {
      const arr = config[field] as unknown[];
      if (!arr.every((item) => typeof item === itemType)) {
        errors.push(
          new ConfigValidationError(
            ConfigErrorType.INVALID_FIELD_TYPE,
            field,
            `All items in '${field}' must be of type ${itemType}`,
          ),
        );
      }
      if (arr.length === 0) {
        warnings.push(
          `Field '${field}' is an empty array - consider removing it if not needed`,
        );
      }
    }
  }
}

/**
 * Validates npm package name format
 */
function isValidPackageName(name: string): boolean {
  // Basic npm package name validation
  // Allows scoped packages (@scope/name) and regular packages
  const scopedPattern = /^@[a-z0-9-~][a-z0-9-._~]*\/[a-z0-9-~][a-z0-9-._~]*$/;
  const regularPattern = /^[a-z0-9-~][a-z0-9-._~]*$/;
  return scopedPattern.test(name) || regularPattern.test(name);
}

/**
 * Validates semver version format
 */
function isValidVersion(version: string): boolean {
  // Basic semver validation (major.minor.patch with optional pre-release)
  const semverPattern = /^\d+\.\d+\.\d+(-[a-z0-9.-]+)?(\+[a-z0-9.-]+)?$/i;
  return semverPattern.test(version);
}

/**
 * Validates Android package name format
 */
function isValidAndroidPackageName(packageName: string): boolean {
  // Android package name: reverse domain notation
  // Must have at least 2 segments, each starting with letter
  const pattern = /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/;
  return pattern.test(packageName);
}

/**
 * Validates Java/Kotlin class name format
 */
function isValidClassName(className: string): boolean {
  // Java/Kotlin class names must start with uppercase letter
  // and contain only letters, digits, and underscores
  const pattern = /^[A-Z][a-zA-Z0-9_]*$/;
  return pattern.test(className);
}

/**
 * Validates native modules array (supports both old and new formats)
 */
function validateNativeModules(modules: unknown[]): ConfigValidationError[] {
  const errors: ConfigValidationError[] = [];

  for (let i = 0; i < modules.length; i++) {
    const module = modules[i];

    if (typeof module === "string") {
      // Old format: validate as class name
      if (!isValidClassName(module)) {
        errors.push(
          new ConfigValidationError(
            ConfigErrorType.INVALID_FIELD_VALUE,
            `nativeModules[${i}]`,
            `Invalid class name: ${module}`,
            "Class names must start with uppercase letter and contain only letters, digits, and underscores",
          ),
        );
      }
    } else if (typeof module === "object" && module !== null) {
      // New format: validate NativeModuleConfig structure
      const moduleConfig = module as Record<string, unknown>;

      if (!moduleConfig.name || typeof moduleConfig.name !== "string") {
        errors.push(
          new ConfigValidationError(
            ConfigErrorType.MISSING_REQUIRED_FIELD,
            `nativeModules[${i}].name`,
            "Module name is required",
            "Add 'name' field to module configuration",
          ),
        );
      }

      if (
        !moduleConfig.className ||
        typeof moduleConfig.className !== "string"
      ) {
        errors.push(
          new ConfigValidationError(
            ConfigErrorType.MISSING_REQUIRED_FIELD,
            `nativeModules[${i}].className`,
            "Module className is required",
            "Add 'className' field to module configuration",
          ),
        );
      } else if (!isValidClassName(moduleConfig.className as string)) {
        errors.push(
          new ConfigValidationError(
            ConfigErrorType.INVALID_FIELD_VALUE,
            `nativeModules[${i}].className`,
            `Invalid class name: ${moduleConfig.className}`,
            "Class names must start with uppercase letter and contain only letters, digits, and underscores",
          ),
        );
      }
    } else {
      errors.push(
        new ConfigValidationError(
          ConfigErrorType.INVALID_FIELD_TYPE,
          `nativeModules[${i}]`,
          "Module must be either a string or an object",
        ),
      );
    }
  }

  return errors;
}

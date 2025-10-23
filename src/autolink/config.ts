/**
 * Configuration interfaces and types for LynxJS Autolink system
 * Defines the structure of lynx.ext.ts/lynx.ext.json configuration files
 */

/**
 * Initialization hook configuration for advanced module setup
 */
export interface InitializationHook {
  /** Hook type: "static_method", "lifecycle_callbacks", "custom_initializer" */
  type: string;
  /** Method name for static_method hooks */
  method?: string;
  /** Class name for lifecycle_callbacks hooks */
  className?: string;
  /** Parameters to pass to the hook */
  parameters?: string[];
  /** Custom code for custom_initializer hooks */
  code?: string;
}

/**
 * Initialization configuration for modules requiring advanced setup
 */
export interface InitializationConfig {
  /** Whether the module requires Android Application context */
  requiresApplicationContext?: boolean;
  /** List of initialization hooks to execute */
  hooks?: InitializationHook[];
  /** Module dependencies that must be initialized first */
  dependencies?: string[];
  /** Initialization order priority (lower numbers initialize first) */
  order?: number;
}

/**
 * Native module configuration with structured metadata
 */
export interface NativeModuleConfig {
  /** Registration name for the module (e.g., "LocalStorage") */
  name: string;
  /** Class name of the module implementation (e.g., "LocalStorageModule") */
  className: string;
}

/**
 * Platform-specific Android configuration
 */
export interface AndroidConfig {
  /** Android package name (e.g., com.lynxjs.localstorage) */
  packageName: string;
  /** Source directory relative to package root (default: android/src/main) */
  sourceDir?: string;
  /** Build types to include (e.g., ["debug", "release"]) */
  buildTypes?: string[];
  /** Programming language for Android platform: "kotlin" or "java" (default: "kotlin") */
  language?: string;
  /** Advanced initialization configuration */
  initialization?: InitializationConfig;
}

/**
 * Platform-specific iOS configuration
 */
export interface IOSConfig {
  /** Path to podspec file relative to package root */
  podspecPath?: string;
  /** Source directory relative to package root (default: ios/src) */
  sourceDir?: string;
  /** Required iOS frameworks */
  frameworks?: string[];
  /** Advanced initialization configuration */
  initialization?: InitializationConfig;
}

/**
 * Platform-specific Web configuration
 */
export interface WebConfig {
  /** Entry point for web platform (default: web/src/index.ts) */
  entry?: string;
  /** Advanced initialization configuration */
  initialization?: InitializationConfig;
}

/**
 * Main autolink configuration structure
 * Corresponds to lynx.ext.ts/lynx.ext.json file format
 */
export interface LynxExtConfig {
  /** Package name (should match package.json name) */
  name: string;
  /** Package version (should match package.json version) */
  version: string;
  /** Minimum required LynxJS version (e.g., ">=0.70.0") */
  lynxVersion?: string;
  /** Platform-specific configurations */
  platforms: {
    android?: AndroidConfig;
    ios?: IOSConfig;
    web?: WebConfig;
  };
  /** Extension dependencies (other autolink packages) */
  dependencies?: string[];
  /** Native module class names exported by this extension (supports both string[] and NativeModuleConfig[]) */
  nativeModules?: string[] | NativeModuleConfig[];
  /** Custom element names exported by this extension */
  elements?: string[];
  /** Service implementations exported by this extension */
  services?: string[];
}

/**
 * Error types for configuration validation
 */
export enum ConfigErrorType {
  MISSING_FILE = "MISSING_FILE",
  INVALID_JSON = "INVALID_JSON",
  MISSING_REQUIRED_FIELD = "MISSING_REQUIRED_FIELD",
  INVALID_FIELD_TYPE = "INVALID_FIELD_TYPE",
  INVALID_FIELD_VALUE = "INVALID_FIELD_VALUE",
  NO_PLATFORMS = "NO_PLATFORMS",
  INVALID_PACKAGE_NAME = "INVALID_PACKAGE_NAME",
  INVALID_VERSION = "INVALID_VERSION",
}

/**
 * Configuration validation error
 */
export class ConfigValidationError extends Error {
  constructor(
    public type: ConfigErrorType,
    public field?: string,
    message?: string,
    public suggestion?: string,
  ) {
    super(message || `Configuration validation failed: ${type}`);
    this.name = "ConfigValidationError";
  }
}

/**
 * Validation result for configuration
 */
export interface ValidationResult {
  valid: boolean;
  errors: ConfigValidationError[];
  warnings: string[];
}

/**
 * Legacy alias for backward compatibility
 * @deprecated Use LynxExtConfig instead
 */
export type AutolinkConfig = LynxExtConfig;

/**
 * Helper function to define Lynx extension configuration with type safety
 *
 * @example
 * ```ts
 * // lynx.ext.ts
 * import { defineConfig } from 'lynxjs-module/config';
 *
 * export default defineConfig({
 *   name: 'my-extension',
 *   version: '1.0.0',
 *   platforms: {
 *     android: {
 *       packageName: 'com.myapp.extension',
 *       language: 'kotlin'
 *     }
 *   },
 *   nativeModules: [
 *     { name: 'MyModule', className: 'MyModuleImpl' }
 *   ]
 * });
 * ```
 */
export function defineConfig(config: LynxExtConfig): LynxExtConfig {
  return config;
}

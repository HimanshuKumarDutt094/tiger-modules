/**
 * Configuration interfaces and types for LynxJS Autolink system
 * Defines the structure of tiger.config.ts/tiger.config.json configuration files
 */

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
 * Element configuration (simplified to only require name)
 */
export interface ElementConfig {
  /** Element name */
  name: string;
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
}

/**
 * Platform-specific Web configuration
 */
export interface WebConfig {
  /** Entry point for web platform (default: web/src/index.ts) */
  entry?: string;
}

/**
 * Main autolink configuration structure
 * Corresponds to tiger.config.ts/tiger.config.json file format
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
  nativeModules?: NativeModuleConfig[];
  /** Custom element configurations exported by this extension */
  elements?: ElementConfig[];
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
    public suggestion?: string
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
 * // tiger.config.ts
 * import { defineConfig } from 'tiger-module/config';
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
 *   ],
 *   elements: [
 *     { name: 'BasicElement' },
 *     { name: 'ExplorerInput' },
 *     { name: 'CustomButton' }
 *   ]
 * });
 * ```
 */
export function defineConfig(config: LynxExtConfig): LynxExtConfig {
  return config;
}

/**
 * Autolink configuration system for LynxJS extensions
 * Exports configuration interfaces, types, validation, parsing, discovery, and dependency resolution
 */

export type {
  AutolinkConfig,
  AndroidConfig,
  IOSConfig,
  WebConfig,
  ValidationResult,
} from "./config.js";

export { ConfigErrorType, ConfigValidationError } from "./config.js";

export { validateAutolinkConfig } from "./validation.js";

export type { ParseResult } from "./parser.js";

export {
  parseAutolinkConfig,
  mergeConfigs,
  loadConfigWithInheritance,
  parseConfigFromString,
} from "./parser.js";

export type {
  Platform,
  ModuleInfo,
  ElementInfo,
  ServiceInfo,
  ExtensionInfo,
  DiscoveryResult,
} from "./discovery.js";

export { DiscoveryError, ExtensionDiscovery } from "./discovery.js";

export type {
  CircularDependency,
  ResolutionResult,
} from "./dependency-resolver.js";

export {
  DependencyResolutionError,
  DependencyResolver,
} from "./dependency-resolver.js";

export type {
  ValidationIssue,
  ValidationReport,
  CompatibilityCheck,
} from "./extension-validator.js";

export {
  ValidationSeverity,
  ExtensionValidator,
} from "./extension-validator.js";

export type { RegistryGenerationResult } from "./registry-generator.js";

export { RegistryGenerator } from "./registry-generator.js";

// Build system plugins
export {
  GradlePlugin,
  CocoaPodsPlugin,
  pluginWebPlatform,
  lynxExtensionPlugin,
} from "./plugins/index.js";

export type {
  GradlePluginConfig,
  CocoaPodsPluginConfig,
  RsbuildPluginOptions,
} from "./plugins/index.js";

/**
 * Configuration loading and validation
 * Handles loading and validating the autolink configuration
 */

import { loadConfig } from "../autolink/config-loader.js";
import { validateAutolinkConfig } from "../autolink/validation.js";
import type { CodegenConfig } from "./types.js";
import type { NativeModuleConfig, ElementConfig } from "../autolink/config.js";

export async function loadCodegenConfig(): Promise<CodegenConfig> {
  console.log("📦 Loading autolink extension configuration");
  const { config: autolinkConfig, configFile } = await loadConfig();

  console.log(`✓ Loaded configuration from ${configFile}`);

  if (!autolinkConfig.platforms?.android?.packageName) {
    throw new Error(`${configFile} missing platforms.android.packageName`);
  }

  // Check if we have any extension types to process
  // Note: nativeModules can be auto-discovered from source, so it's optional
  const hasElements =
    autolinkConfig.elements && autolinkConfig.elements.length > 0;
  const hasServices =
    autolinkConfig.services && autolinkConfig.services.length > 0;
  const hasNativeModulesConfig =
    autolinkConfig.nativeModules && autolinkConfig.nativeModules.length > 0;

  // We'll auto-discover native modules from source if not explicitly configured
  // So we only error if there's truly nothing to process
  if (!hasNativeModulesConfig && !hasElements && !hasServices) {
    console.log(
      `ℹ️  No extension types configured, will auto-discover from source files`
    );
  }

  // Get typed arrays with defaults
  const nativeModules: NativeModuleConfig[] =
    autolinkConfig.nativeModules || [];
  const elements: ElementConfig[] = autolinkConfig.elements || [];
  const services: string[] = autolinkConfig.services || [];

  // Language is always from platform config
  const androidLanguage: string =
    autolinkConfig.platforms.android.language || "kotlin";

  return {
    androidPackageName: autolinkConfig.platforms.android.packageName,
    srcFile: "./src/module.ts",
    androidLanguage,
    nativeModules,
    elements,
    services,
    config: autolinkConfig,
  };
}

export function validateConfig(config: CodegenConfig): void {
  console.log("🔍 Validating autolink configuration...");
  const validation = validateAutolinkConfig(config.config);

  if (!validation.valid) {
    console.error("❌ Configuration validation failed:");
    validation.errors.forEach((err) => {
      console.error(`  - ${err.message}`);
      if (err.suggestion) {
        console.error(`    💡 ${err.suggestion}`);
      }
    });
    throw new Error("Invalid configuration");
  }

  if (validation.warnings.length > 0) {
    console.warn("⚠️  Warnings:");
    validation.warnings.forEach((warn) => {
      console.warn(`  - ${warn}`);
    });
  }

  console.log("✓ Configuration is valid");
}

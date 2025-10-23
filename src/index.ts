#!/usr/bin/env node

export { initModule } from "./init";
export { runCodegen } from "./codegen";

// Export configuration types and utilities
export type {
  LynxExtConfig,
  AutolinkConfig, // Legacy alias
  NativeModuleConfig,
  AndroidConfig,
  IOSConfig,
  WebConfig,
} from "./autolink/config.js";
export { defineConfig } from "./autolink/config.js";

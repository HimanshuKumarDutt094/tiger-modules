#!/usr/bin/env node

export { initModule } from "./commands/create.js";
export { runCodegen } from "./commands/codegen.js";

// Export configuration types and utilities
export type {
  LynxExtConfig,
  NativeModuleConfig,
  AndroidConfig,
  IOSConfig,
  WebConfig,
} from "./autolink/config.js";
export { defineConfig } from "./autolink/config.js";

// Export plugins
export { 
  pluginTigerElementRegistry,
} from "./autolink/plugins/index.js";
export type { 
  TigerElementRegistryOptions,
} from "./autolink/plugins/index.js";

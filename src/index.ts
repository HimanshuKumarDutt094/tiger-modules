#!/usr/bin/env node

export { initModule } from "./init";
export { runCodegen } from "./codegen";

// Base interface that all native modules extend
export interface TigerModule {
  // Base interface for all native modules
}

// Create a proxy that automatically provides access to any NativeModule
const createModuleProxy = <T extends TigerModule>(): T => {
  return new Proxy({} as T, {
    get(_target, prop: string) {
      // Access the native module from global NativeModules
      const nativeModules = (globalThis as any).NativeModules;
      if (nativeModules && typeof prop === 'string') {
        // Try to find the module by exact name first
        if (nativeModules[prop]) {
          return nativeModules[prop];
        }
        // If not found, try to find by interface name (remove 'Module' suffix if present)
        const moduleName = prop.endsWith('Module') ? prop : prop + 'Module';
        return nativeModules[moduleName];
      }
      return undefined;
    }
  });
};

// Export the proxy creator
export const TigerModule = createModuleProxy;

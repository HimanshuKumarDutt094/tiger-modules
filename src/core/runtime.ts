// Runtime-only exports for native modules
// This file should not import any CLI tools or Node.js dependencies
/// <reference types="@lynx-js/types" />
// Base interface that all native modules extend
export interface TigerModule {
  // Base interface for all native modules
}

// Create a proxy that acts as an alias to a specific NativeModule
const createModuleProxy = <T extends TigerModule>(moduleName: string): T => {
  return new Proxy({} as T, {
    get(_target, prop: string) {
      // Direct access to NativeModules (available globally in LynxJS)
      const nativeModules = NativeModules;

      if (typeof prop === "string" && nativeModules && moduleName) {
        const targetModule = nativeModules[moduleName];
        if (targetModule && typeof targetModule[prop] === "function") {
          return targetModule[prop].bind(targetModule);
        }
      }

      // If method not found, return undefined
      return undefined;
    },
  });
};

// Export the proxy creator - acts as an alias to NativeModules
// Usage: const MyModule = TigerModule<MyModuleInterface>()
// This makes MyModule.method() equivalent to NativeModules.MyModule.method()
export const TigerModule = createModuleProxy;

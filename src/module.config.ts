export interface ModuleConfig {
  moduleName: string; // e.g. LocalStorage
  androidPackageName: string; // e.g. com.myapp.modules.storage
  description: string;
  srcFile: string; // relative path to index.ts
}

export const config: ModuleConfig = {
  moduleName: "LocalStorage",
  androidPackageName: "com.myapp.modules.storage",
  description: "My Lynx native module",
  srcFile: "./src/index.ts",
};

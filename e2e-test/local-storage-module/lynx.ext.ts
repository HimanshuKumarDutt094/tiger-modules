import { defineConfig } from "lynxjs-module/config";
export default defineConfig({
  name: "local-storage-module",
  version: "0.1.0",
  lynxVersion: ">=0.70.0",
  platforms: {
    android: {
      packageName: "com.modules.localstorage",
      sourceDir: "android/src/main",
      buildTypes: ["debug", "release"],
      language: "java",
    },
    ios: {
      sourceDir: "ios/src",
      frameworks: ["Foundation"],
    },
    web: {
      entry: "web/src/index.ts",
    },
  },
  dependencies: [],
  nativeModules: [
    {
      name: "NativeLocalStorageModule",
      className: "NativeLocalStorageModule",
    },
  ],
  elements: [],
  services: [],
});

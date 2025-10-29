import { defineConfig } from "tiger/config";

export default defineConfig({
  name: "module-element-testing",
  version: "0.1.0",
  lynxVersion: ">=0.70.0",
  platforms: {
    android: {
      packageName: "com.testing",
      sourceDir: "android/src/main",
      buildTypes: ["debug", "release"],
      language: "kotlin",
    },
    ios: {
      sourceDir: "ios/src",
      frameworks: ["Foundation"],
    },
    web: {
      sourceDir: "web/src",
      entry: "web/src/index.ts",
    },
  },
  dependencies: [],
  // nativeModules is now optional - auto-discovered from @LynxNativeModule annotations
  elements: [
    {
      name: "ExplorerInput",
      tagName: "explorer-input",
    },
  ],
  services: [],
});

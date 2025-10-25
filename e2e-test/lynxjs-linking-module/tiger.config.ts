import { defineConfig } from "tiger-module";
export default defineConfig({
  name: "lynxjs-linking-module",
  version: "0.1.0",
  lynxVersion: ">=0.70.0",
  platforms: {
    android: {
      packageName: "com.modules.linking",
      sourceDir: "android/src/main",
      buildTypes: ["debug", "release"],
      language: "kotlin",
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
      name: "LynxjsLinkingModule",
      className: "LynxjsLinkingModule",
    },
  ],
  elements: [],
  services: [],
});

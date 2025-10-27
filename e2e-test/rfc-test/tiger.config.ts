import { defineConfig } from 'tiger-module/config';

export default defineConfig({
  name: 'rfc-test',
  version: '0.1.0',
  lynxVersion: '>=0.70.0',
  platforms: {
    android: {
      packageName: 'com.rfc.tools',
      sourceDir: 'android/src/main',
      buildTypes: ['debug', 'release'],
      language: 'kotlin'
    },
    ios: {
      sourceDir: 'ios/src',
      frameworks: ['Foundation']
    },
    web: {
      entry: 'web/src/index.ts'
    }
  },
  dependencies: [],
  nativeModules: [
    {
        "name": "LynxJsLinking",
        "className": "LynxJsLinkingModule"
    }
],
  elements: [
    {
      name: "ExplorerInput",
   
    }
],
  services: []
});

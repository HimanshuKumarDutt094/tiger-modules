import { defineConfig } from 'tiger-module/config';

export default defineConfig({
  name: 'himanshu-tools',
  version: '0.1.0',
  lynxVersion: '>=0.70.0',
  platforms: {
    android: {
      packageName: 'com.himanshu.tools',
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
      name: 'NativeLocalStorageModule',
      className: 'NativeLocalStorageModule'
    },
    {
      name: 'LynxjsLinkingModule',
      className: 'LynxjsLinkingModule'
    }
  ],
  elements: [],
  services: []
});
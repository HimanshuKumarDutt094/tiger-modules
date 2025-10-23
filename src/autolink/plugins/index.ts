/**
 * LynxJS Autolink Build System Plugins
 *
 * This module exports all build system plugins for different platforms:
 * - Gradle plugin for Android
 * - CocoaPods plugin for iOS
 * - Rsbuild plugin for web
 */

export {
  CocoaPodsPlugin,
  type CocoaPodsPluginConfig,
} from "./cocoapods-plugin.js";
export {
  pluginWebPlatform,
  lynxExtensionPlugin,
  type RsbuildPluginOptions,
} from "./rsbuild-plugin.js";

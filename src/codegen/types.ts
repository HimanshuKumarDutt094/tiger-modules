/**
 * Shared types for code generation
 */

import type { LynxExtConfig, NativeModuleConfig, ElementConfig } from "../autolink/config.js";

// Type definitions for method structure
export interface MethodParam {
  paramName: string;
  isOptional: boolean;
  typeText: string;
}

export interface MethodInfo {
  name: string;
  params: MethodParam[];
  returnType: string;
}

export interface PropertyInfo {
  name: string;
  isOptional: boolean;
  typeText: string;
}

// Element information including properties (simplified - no custom view types)
export interface ElementInfo {
  name: string;
  properties: PropertyInfo[];
}

// Code generation context
export interface CodegenContext {
  androidPackageName: string;
  androidLanguage: string;
  fileExtension: string;
  androidSourceDir: string;
}

// Configuration structure for codegen
export interface CodegenConfig {
  androidPackageName: string;
  srcFile: string;
  androidLanguage: string;
  nativeModules: NativeModuleConfig[];
  elements: ElementConfig[];
  services: string[];
  config: LynxExtConfig;
}

// Platform-specific generation options
export interface PlatformOptions {
  generateAndroid: boolean;
  generateIOS: boolean;
  generateWeb: boolean;
}

// Interface maps for easy lookup
export type InterfaceMethodsMap = Map<string, MethodInfo[] | PropertyInfo[]>;
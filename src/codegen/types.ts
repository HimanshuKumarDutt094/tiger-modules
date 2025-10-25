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

// Android view type configuration
export interface AndroidViewTypeConfig {
  viewType: string;           // Full class name (e.g., "androidx.appcompat.widget.AppCompatEditText")
  shortName: string;          // Short name for imports (e.g., "AppCompatEditText")
  packageName: string;        // Package for import (e.g., "androidx.appcompat.widget")
  isValidated: boolean;       // Whether the type has been validated
}

// Element information including properties and Android view type
export interface ElementInfo {
  name: string;
  properties: PropertyInfo[];
  androidViewType?: AndroidViewTypeConfig;
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
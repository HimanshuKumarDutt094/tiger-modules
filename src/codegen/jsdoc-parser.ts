/**
 * JSDoc annotation parsing utilities
 * Handles extraction and parsing of JSDoc comments from TypeScript interfaces
 */

import { InterfaceDeclaration, JSDoc } from "ts-morph";
import type { AndroidViewTypeConfig } from "./types.js";
import { 
  validateAndResolveAndroidViewType, 
  ANDROID_VIEW_TYPE_ERROR_MESSAGES 
} from "./android-view-registry.js";

/**
 * Regular expression to match @androidViewType annotations
 * Matches: @androidViewType full.package.name.ClassName
 */
const ANDROID_VIEW_TYPE_REGEX = /@androidViewType\s+([a-zA-Z_][a-zA-Z0-9_.]*[a-zA-Z0-9_])/;

/**
 * Extracts JSDoc comments from a TypeScript interface declaration
 * @param interfaceDecl - The interface declaration to extract JSDoc from
 * @returns Array of JSDoc nodes attached to the interface
 */
export function extractJSDocComments(interfaceDecl: InterfaceDeclaration): JSDoc[] {
  return interfaceDecl.getJsDocs();
}

/**
 * Parses @androidViewType annotation from JSDoc comments
 * @param jsDocs - Array of JSDoc nodes to parse
 * @returns AndroidViewTypeConfig if annotation found and valid, null otherwise
 */
export function parseAndroidViewTypeAnnotation(jsDocs: JSDoc[]): AndroidViewTypeConfig | null {
  for (const jsDoc of jsDocs) {
    const comment = jsDoc.getComment();
    if (!comment) continue;

    // Handle both string and array comment formats
    const commentText = typeof comment === 'string' ? comment : comment.map(c => c?.getText() || '').join('');
    
    const match = commentText.match(ANDROID_VIEW_TYPE_REGEX);
    if (match) {
      const fullViewType = match[1];
      
      // Validate the annotation format
      if (!isValidAndroidViewTypeFormat(fullViewType)) {
        throw new Error(`Malformed @androidViewType annotation: ${fullViewType}. Expected format: @androidViewType full.package.ClassName`);
      }

      // Extract package and class name
      const lastDotIndex = fullViewType.lastIndexOf('.');
      if (lastDotIndex === -1) {
        throw new Error(`Invalid Android view type format: ${fullViewType}. Must include package name.`);
      }

      const packageName = fullViewType.substring(0, lastDotIndex);
      const shortName = fullViewType.substring(lastDotIndex + 1);

      return {
        viewType: fullViewType,
        shortName,
        packageName,
        isValidated: false // Will be validated later by the registry
      };
    }
  }

  return null;
}

/**
 * Validates the format of an Android view type annotation
 * @param viewType - The view type string to validate
 * @returns true if format is valid, false otherwise
 */
export function isValidAndroidViewTypeFormat(viewType: string): boolean {
  // Must contain at least one dot (package.Class)
  if (!viewType.includes('.')) {
    return false;
  }

  // Must start with a letter or underscore
  if (!/^[a-zA-Z_]/.test(viewType)) {
    return false;
  }

  // Must contain only valid Java identifier characters and dots
  if (!/^[a-zA-Z_][a-zA-Z0-9_.]*[a-zA-Z0-9_]$/.test(viewType)) {
    return false;
  }

  // Must not have consecutive dots or end with a dot
  if (viewType.includes('..') || viewType.endsWith('.')) {
    return false;
  }

  return true;
}

/**
 * Extracts and validates Android view type configuration from a TypeScript interface
 * @param interfaceDecl - The interface declaration to extract from
 * @returns AndroidViewTypeConfig if found and valid, null otherwise
 */
export function extractAndroidViewType(interfaceDecl: InterfaceDeclaration): AndroidViewTypeConfig | null {
  try {
    const jsDocs = extractJSDocComments(interfaceDecl);
    const parsedConfig = parseAndroidViewTypeAnnotation(jsDocs);
    
    if (!parsedConfig) {
      return null;
    }

    // Validate the parsed view type using the registry
    const validationResult = validateAndResolveAndroidViewType(parsedConfig.viewType);
    
    // Log any warnings or messages
    if (validationResult.hasWarnings && validationResult.messages.length > 0) {
      console.warn(`⚠️  Android view type validation for interface ${interfaceDecl.getName()}:`);
      validationResult.messages.forEach(message => {
        console.warn(`   ${message}`);
      });
    }

    // Return the resolved configuration
    return {
      viewType: validationResult.resolvedType.fullName,
      shortName: validationResult.resolvedType.shortName,
      packageName: validationResult.resolvedType.package,
      isValidated: true
    };

  } catch (error) {
    // Re-throw with interface context
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Error parsing JSDoc for interface ${interfaceDecl.getName()}: ${errorMessage}`);
  }
}

/**
 * Validates Android view type annotation format and provides helpful error messages
 * @param annotation - The full annotation string to validate
 * @returns Validation result with error message if invalid
 */
export function validateAndroidViewTypeAnnotation(annotation: string): {
  isValid: boolean;
  errorMessage?: string;
} {
  const match = annotation.match(ANDROID_VIEW_TYPE_REGEX);
  
  if (!match) {
    return {
      isValid: false,
      errorMessage: ANDROID_VIEW_TYPE_ERROR_MESSAGES.MALFORMED_ANNOTATION(annotation)
    };
  }

  const viewType = match[1];
  
  if (!isValidAndroidViewTypeFormat(viewType)) {
    return {
      isValid: false,
      errorMessage: ANDROID_VIEW_TYPE_ERROR_MESSAGES.INVALID_FORMAT(viewType)
    };
  }

  return { isValid: true };
}
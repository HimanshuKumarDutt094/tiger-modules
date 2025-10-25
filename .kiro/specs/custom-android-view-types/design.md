# Design Document

## Overview

This design extends the tiger-module codegen system to support custom Android view types through JSDoc annotations. The solution allows developers to specify Android view types like `AppCompatEditText`, `Button`, or `RecyclerView` in their TypeScript interface definitions, which the codegen will use to generate appropriate `LynxUI<CustomViewType>` base classes.

## Architecture

### Current Architecture
```
TypeScript Interface → Parser → Codegen → LynxUI<View> (hardcoded)
```

### Enhanced Architecture
```
TypeScript Interface + JSDoc → Enhanced Parser → View Type Resolver → Codegen → LynxUI<CustomViewType>
```

### Key Components

1. **JSDoc Annotation Parser**: Extracts `@androidViewType` annotations from TypeScript interfaces
2. **View Type Resolver**: Validates and resolves Android view types to their full class names
3. **Enhanced Codegen Engine**: Generates platform-specific code with custom view types
4. **Import Manager**: Handles automatic import generation for custom Android view types

## Components and Interfaces

### JSDoc Annotation Format

```typescript
/**
 * ExplorerInput element interface
 * @androidViewType androidx.appcompat.widget.AppCompatEditText
 */
export interface ExplorerInputProps {
  value?: string;
  placeholder?: string;
  // ... other props
}
```

### TypeScript Import Resolution Issues

The current codegen has several critical issues that need to be addressed:

1. **Missing Type Imports**: `BaseEvent` and `CSSProperties` are used but not imported
2. **Duplicate Properties**: Common properties (className, id, style) are added twice
3. **Type Resolution**: Types from the original interface are not properly resolved in generated files

#### Current Problems in Generated Files

```typescript
// PROBLEM: Missing imports
declare module "@lynx-js/types" {
  interface IntrinsicElements extends Lynx.IntrinsicElements {
    "explorerinput": {
      bindinput?: (e: BaseEvent<"input", { value: string }>) => void; // ❌ BaseEvent not imported
      style?: string | CSSProperties; // ❌ CSSProperties not imported
      className?: string; // ❌ Duplicated
      className?: string; // ❌ Duplicated again
    };
  }
}
```

#### Required Fix Strategy

```typescript
// SOLUTION: Proper imports and deduplication
import type { BaseEvent, CSSProperties } from "@lynx-js/types";

declare module "@lynx-js/types" {
  interface IntrinsicElements extends Lynx.IntrinsicElements {
    "explorerinput": {
      bindinput?: (e: BaseEvent<"input", { value: string }>) => void;
      value?: string;
      placeholder?: string;
      maxlines?: number;
      // Common properties added only once
      className?: string;
      id?: string;
      style?: string | CSSProperties;
    };
  }
}
```

### View Type Configuration

```typescript
interface AndroidViewTypeConfig {
  viewType: string;           // Full class name (e.g., "androidx.appcompat.widget.AppCompatEditText")
  shortName: string;          // Short name for imports (e.g., "AppCompatEditText")
  packageName: string;        // Package for import (e.g., "androidx.appcompat.widget")
  isValidated: boolean;       // Whether the type has been validated
}
```

### Enhanced Parser Interface

```typescript
interface ElementInfo {
  name: string;
  properties: PropertyInfo[];
  androidViewType?: AndroidViewTypeConfig;  // New field
}
```

## Data Models

### View Type Registry

The system will maintain a registry of common Android view types:

```typescript
const ANDROID_VIEW_TYPES = {
  'View': {
    fullName: 'android.view.View',
    package: 'android.view',
    shortName: 'View'
  },
  'AppCompatEditText': {
    fullName: 'androidx.appcompat.widget.AppCompatEditText',
    package: 'androidx.appcompat.widget',
    shortName: 'AppCompatEditText'
  },
  'Button': {
    fullName: 'android.widget.Button',
    package: 'android.widget',
    shortName: 'Button'
  },
  // ... more common types
};
```

### Generated Code Structure

#### Kotlin Base Class (with custom view type)
```kotlin
abstract class ExplorerInputSpec(context: LynxContext) : LynxUI<AppCompatEditText>(context) {
  abstract override fun createView(context: Context): AppCompatEditText
  // ... property methods
}
```

#### Kotlin Implementation Template
```kotlin
@LynxElement(name = "explorerinput")
class ExplorerInput(context: LynxContext) : ExplorerInputSpec(context) {
  
  override fun createView(context: Context): AppCompatEditText {
    return AppCompatEditText(context).apply {
      // TODO: Configure your AppCompatEditText
    }
  }
  // ... property implementations
}
```

## Error Handling

### Validation Strategy

1. **JSDoc Parsing Errors**: Clear error messages for malformed annotations
2. **Invalid View Types**: Validation against known Android view types registry
3. **Import Resolution**: Fallback to default View type if custom type cannot be resolved
4. **Compilation Safety**: Generated code must compile without manual intervention
5. **TypeScript Import Issues**: Fix missing imports and duplicate property generation
6. **Type Resolution**: Ensure all types from original interfaces are properly resolved in generated code

### Critical Fixes Required

#### TypeScript Generation Issues
1. **Import Management**: Automatically detect and import required types (`BaseEvent`, `CSSProperties`)
2. **Property Deduplication**: Prevent duplicate properties in generated interfaces
3. **Type Preservation**: Maintain original type definitions from source interfaces
4. **Web Platform Types**: Ensure web-generated code uses proper DOM types instead of Lynx types

### Error Messages

```typescript
const ERROR_MESSAGES = {
  INVALID_ANDROID_VIEW_TYPE: (type: string) => 
    `Invalid Android view type: ${type}. Must be a valid Android View class.`,
  MALFORMED_ANNOTATION: (annotation: string) => 
    `Malformed @androidViewType annotation: ${annotation}. Expected format: @androidViewType full.package.ClassName`,
  VIEW_TYPE_NOT_FOUND: (type: string) => 
    `Android view type not found in registry: ${type}. Using default View type.`
};
```

## Testing Strategy

### Unit Tests

1. **JSDoc Parser Tests**: Verify correct parsing of various annotation formats
2. **View Type Resolver Tests**: Test validation and resolution of Android view types
3. **Codegen Tests**: Verify generated code correctness for different view types
4. **Import Manager Tests**: Test automatic import generation

### Integration Tests

1. **End-to-End Codegen**: Test complete flow from TypeScript interface to generated Kotlin code
2. **Compilation Tests**: Verify generated code compiles successfully
3. **Backward Compatibility**: Ensure existing elements without annotations continue to work

### Test Cases

```typescript
describe('Android View Type Support', () => {
  test('should parse valid @androidViewType annotation', () => {
    // Test JSDoc parsing
  });
  
  test('should generate LynxUI<AppCompatEditText> for AppCompatEditText type', () => {
    // Test codegen output
  });
  
  test('should fallback to View for invalid types', () => {
    // Test error handling
  });
  
  test('should maintain backward compatibility', () => {
    // Test existing interfaces without annotations
  });
});
```

## Implementation Phases

### Phase 1: Fix Critical TypeScript Generation Issues
- Fix missing imports for `BaseEvent` and `CSSProperties` in generated TypeScript files
- Eliminate duplicate property generation in module augmentation
- Ensure proper type resolution from source interfaces
- Fix web platform code generation to use appropriate DOM types

### Phase 2: JSDoc Parser Enhancement
- Extend existing parser to extract JSDoc annotations
- Add view type configuration data structures
- Implement basic validation

### Phase 3: Codegen Engine Updates
- Modify Kotlin codegen to use custom view types
- Update import generation logic for Android view types
- Enhance template generation for custom view types
- Ensure web codegen uses proper web types

### Phase 4: Error Handling & Validation
- Implement comprehensive validation
- Add error reporting and fallback mechanisms
- Create view type registry

### Phase 5: Testing & Documentation
- Comprehensive test suite
- Update documentation and examples
- Backward compatibility verification

### Priority Order

**CRITICAL (Phase 1)**: The TypeScript generation issues must be fixed first as they prevent the generated code from compiling and being usable.

**HIGH (Phases 2-3)**: Android view type support is the main feature request.

**MEDIUM (Phases 4-5)**: Polish and testing to ensure production readiness.

## Backward Compatibility

The design ensures full backward compatibility:

1. **Default Behavior**: Elements without `@androidViewType` annotations continue to use `View`
2. **Existing Code**: No changes required to existing TypeScript interfaces
3. **Generated Code**: Existing generated code remains valid
4. **API Stability**: No breaking changes to public APIs
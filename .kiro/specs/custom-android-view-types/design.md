# Design Document

## Overview

This design outlines the refactoring of the custom native element generation system to eliminate the intermediate spec file approach. The new system will generate complete, self-contained element classes that users can directly modify, simplifying the development workflow and reducing complexity.

## Architecture

### Current Architecture (To Be Removed)

```
TypeScript Interface → Codegen → Spec File (Abstract) + Implementation File (Extends Spec)
                                     ↓
                               User extends spec file
```

### New Architecture (Target)

```
TypeScript Interface → Codegen → Complete Element Class (with annotations, default View type)
                                     ↓
                               User modifies element class directly
```

## Components and Interfaces

### 1. Element Generation System

#### Modified Components

**`src/codegen/elements.ts`**
- **generateAndroidElement()**: Remove spec file generation, create complete element class
- **generateKotlinElement()**: Remove - no longer needed as separate function
- **generateKotlinElementImplementation()**: Merge logic into main generation function
- **generateJavaElement()**: Remove - no longer needed as separate function  
- **generateJavaElementImplementation()**: Merge logic into main generation function

#### New Element Class Structure

```kotlin
@LynxElement(name = "elementname")
class ElementName(context: LynxContext) : LynxUI<View>(context) {
    
    override fun createView(context: Context): View {
        // Generated view instantiation with TODO comments for user customization
        return View(context).apply {
            // TODO: Configure your View properties here
        }
    }
    
    @LynxProp(name = "propertyName")
    fun setPropertyName(propertyName: Type?) {
        // Generated property setter with TODO comments
        // TODO: Update your View with propertyName
    }
    
    // Helper methods for event emission
    protected fun emitEvent(name: String, value: Map<String, Any>?) {
        val detail = LynxCustomEvent(sign, name)
        value?.forEach { (key, v) ->
            detail.addDetail(key, v)
        }
        lynxContext.eventEmitter.sendCustomEvent(detail)
    }
}
```

### 2. File Generation Strategy

#### Directory Structure Changes

**Before:**
```
android/src/main/kotlin/com/package/
├── generated/
│   └── ElementNameSpec.kt (abstract base class)
└── ElementName.kt (extends spec)
```

**After:**
```
android/src/main/kotlin/com/package/
└── ElementName.kt (complete implementation with annotations)
```

#### Generation Logic

1. **Single File Generation**: Create only the main element class file
2. **Complete Implementation**: Include all necessary annotations and method stubs
3. **User-Modifiable**: Generate with TODO comments for user customization
4. **Simplified View Type**: Use standard View as default base type (no custom view type configuration)
5. **Element Config Simplification**: Elements array contains only objects with "name" property

### 3. Gradle Plugin Integration

#### Discovery Mechanism

The existing gradle plugin already supports `@LynxElement` annotation discovery:

```kotlin
// Current ExtensionRegistry generation (no changes needed)
@LynxElement(name = "ExplorerInput")
try {
    LynxEnv.inst().addBehavior(object : Behavior("ExplorerInput") {
        override fun createUI(context: LynxContext): ExplorerInput {
            return ExplorerInput(context)
        }
    })
    android.util.Log.d("ExtensionRegistry", "Registered element: ExplorerInput")
} catch (e: Exception) {
    android.util.Log.e("ExtensionRegistry", "Failed to register element ExplorerInput: ${e.message}")
}
```

#### Class Pattern Detection

The gradle plugin scans for classes matching:
- Annotated with `@LynxElement(name = "...")`
- Extends `LynxUI<ViewType>` pattern
- Constructor signature: `(context: LynxContext)`

### 4. Build System Integration

#### File Copying Process

The existing build system already copies source files to dist:
- Source files in `android/src/main/kotlin/` → `dist/android/src/main/kotlin/`
- Maintains package structure and annotations
- Preserves file permissions and timestamps

## Data Models

### Element Generation Context

```typescript
interface ElementGenerationContext extends CodegenContext {
  elementName: string;
  properties: PropertyInfo[];
  generateSpecFile: false; // Always false in new system
}
```

### Simplified Element Configuration

```typescript
// Old configuration (being removed)
interface ElementConfig {
  name: string;
  androidViewType?: AndroidViewTypeConfig;
}

// New simplified configuration
interface ElementConfig {
  name: string; // Only name is required
}
```

### Property Information

```typescript
interface PropertyInfo {
  name: string;
  isOptional: boolean;
  typeText: string;
}
```

### Android View Type Configuration (Removed)

The AndroidViewTypeConfig interface and related custom view type functionality will be removed. All elements will use the standard `android.view.View` as the base type, allowing users to modify the generated class to use their preferred view type.

## Error Handling

### Generation Errors

1. **Standard View Type**: Always use `android.view.View` as base type (no custom view type validation needed)
2. **Property Type Conversion**: Use fallback types for unknown TypeScript types
3. **File System Errors**: Graceful handling with detailed error messages
4. **Import Resolution**: Standard imports for View and LynxUI framework

### Validation Strategy

1. **Pre-Generation Validation**: Verify element name and properties are valid
2. **Post-Generation Validation**: Check generated file syntax and structure
3. **Build-Time Validation**: Gradle plugin validates annotations and class structure

### Error Recovery

1. **Partial Generation**: Continue with other elements if one fails
2. **Fallback Generation**: Generate basic template if advanced features fail
3. **User Notification**: Clear error messages with suggested fixes

## Testing Strategy

### Unit Tests

1. **Element Generation Tests**: Verify correct file generation for simplified configurations
2. **Property Handling Tests**: Test property type conversion and annotation generation
3. **Standard View Generation Tests**: Validate standard View type usage and import generation
4. **Error Handling Tests**: Test graceful failure scenarios

### Integration Tests

1. **End-to-End Generation**: Test complete workflow from TypeScript interface to generated files
2. **Gradle Plugin Integration**: Verify element discovery and registration
3. **Build System Integration**: Test file copying and distribution
4. **Multi-Platform Generation**: Ensure iOS and Web generation still works

### Test Data

```typescript
// Test element configurations (simplified)
const testElements = [
  { name: "TestButton" }, // Only name is required
  { name: "TestInput" }
];

// Properties are automatically parsed from TypeScript interfaces like:
// interface TestButtonProps {
//   title: string;
//   disabled?: boolean;
// }
```

### Backward Compatibility Testing

1. **Existing Projects**: Ensure existing projects continue to work
2. **Migration Path**: Test conversion from spec-based to direct implementation
3. **Native Module Compatibility**: Verify native modules (which keep spec files) still work

## Implementation Phases

### Phase 1: Configuration Simplification
- Update ElementConfig interface to only require "name" property
- Remove AndroidViewTypeConfig support from element generation
- Update parsers to handle simplified element configuration

### Phase 2: Core Generation Refactoring
- Modify `generateAndroidElement()` to create complete classes with standard View type
- Remove spec file generation logic
- Update property and method generation to use direct implementation

### Phase 3: Template Enhancement
- Improve generated code quality with better TODO comments
- Add standard View instantiation examples
- Enhance property implementation templates with generic View handling

### Phase 4: Cleanup and Optimization
- Remove unused spec generation functions
- Remove AndroidViewTypeConfig related code
- Clean up imports and dependencies
- Optimize file generation performance

### Phase 5: Testing and Validation
- Comprehensive testing of new simplified generation system
- Validation of gradle plugin compatibility
- End-to-end workflow testing with simplified configuration
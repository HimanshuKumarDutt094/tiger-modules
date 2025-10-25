# Requirements Document

## Introduction

The tiger-module codegen system currently hardcodes `LynxUI<View>` for all Android elements, but developers need the ability to specify custom Android view types like `AppCompatEditText`, `Button`, `RecyclerView`, etc. This enhancement will allow developers to specify the desired Android view type in their TypeScript interface definitions, enabling the codegen to generate the appropriate `LynxUI<CustomViewType>` base classes.

## Glossary

- **Tiger_Module_System**: The CLI tool and code generator for LynxJS native modules
- **Codegen_Engine**: The TypeScript-to-native code generation component
- **Android_View_Type**: The specific Android View class (e.g., AppCompatEditText, Button) used as the generic parameter for LynxUI
- **TypeScript_Interface**: The interface definition that describes element properties and methods
- **Base_Class_Generator**: The component that generates the abstract base classes for elements

## Requirements

### Requirement 1

**User Story:** As a module developer, I want to specify custom Android view types in my TypeScript interface definitions, so that the generated code uses the appropriate LynxUI generic type.

#### Acceptance Criteria

1. WHEN a developer defines an element interface with Android view type metadata, THE Codegen_Engine SHALL generate LynxUI base classes with the specified Android view type
2. WHERE an Android view type is specified, THE Base_Class_Generator SHALL import the required Android view class in the generated Kotlin code
3. THE Tiger_Module_System SHALL validate that specified Android view types are valid Android View classes
4. IF no Android view type is specified, THEN THE Codegen_Engine SHALL default to using View as the generic type
5. THE Codegen_Engine SHALL preserve all existing functionality for iOS and Web platforms when Android view types are specified

### Requirement 2

**User Story:** As a module developer, I want to use JSDoc annotations or interface properties to specify Android view types, so that I can configure the codegen without changing the runtime interface.

#### Acceptance Criteria

1. THE Tiger_Module_System SHALL support JSDoc @androidViewType annotations for specifying Android view types
2. THE Codegen_Engine SHALL parse JSDoc annotations from TypeScript interface definitions
3. WHEN multiple Android view type specifications exist, THE Tiger_Module_System SHALL use the most specific annotation
4. THE Tiger_Module_System SHALL provide clear error messages for invalid Android view type specifications
5. THE Codegen_Engine SHALL ignore Android view type annotations when generating iOS and Web code

### Requirement 3

**User Story:** As a module developer, I want the generated implementation templates to include proper imports and type-safe view creation, so that I can immediately use the specified Android view type.

#### Acceptance Criteria

1. WHEN an Android view type is specified, THE Base_Class_Generator SHALL include the appropriate import statement in generated Kotlin files
2. THE Base_Class_Generator SHALL generate createView method signatures that return the specified Android view type
3. THE Base_Class_Generator SHALL update the implementation template to use the specified view type in createView method
4. THE Tiger_Module_System SHALL ensure generated code compiles without additional manual imports
5. THE Base_Class_Generator SHALL maintain backward compatibility with existing elements that use the default View type
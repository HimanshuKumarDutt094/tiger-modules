# Requirements Document

## Introduction

This feature simplifies the custom native element generation process by eliminating the intermediate spec file approach. Instead of generating separate spec files that users must extend, the system will generate complete, self-contained element classes with proper annotations that users can directly modify and extend.

## Glossary

- **LynxElement**: An annotation used to mark custom UI elements for automatic discovery and registration
- **LynxUI**: Base class for all custom UI elements in the Lynx framework
- **LynxProp**: Annotation used to mark property setter methods in custom elements
- **ExtensionRegistry**: Auto-generated class that registers all discovered extensions with the Lynx framework
- **Spec File**: Previously generated abstract base class that users had to extend (being removed)
- **Element Class**: The concrete implementation class that users will directly modify
- **Codegen System**: The code generation system that creates platform-specific code from TypeScript interfaces
- **Element Config**: Simplified configuration object containing only the element name
- **AndroidViewTypeConfig**: Previously used custom view configuration (being removed)

## Requirements

### Requirement 1

**User Story:** As a developer creating custom native elements, I want to work with a single, complete element class instead of extending generated spec files, so that I have a simpler development workflow.

#### Acceptance Criteria

1. WHEN the codegen system processes a custom element interface, THE Codegen_System SHALL generate a complete element class with @LynxElement annotation
2. WHEN generating element classes, THE Codegen_System SHALL include all property setters with @LynxProp annotations directly in the main class
3. WHEN generating element classes, THE Codegen_System SHALL extend LynxUI with the appropriate native view type
4. WHEN generating element classes, THE Codegen_System SHALL include TODO comments for property implementations that require user customization
5. THE Codegen_System SHALL NOT generate separate spec files for custom elements

### Requirement 2

**User Story:** As a developer, I want the gradle plugin to automatically discover my custom elements through annotations, so that I don't need to manually register them.

#### Acceptance Criteria

1. WHEN the gradle plugin scans for extensions, THE Gradle_Plugin SHALL detect classes annotated with @LynxElement
2. WHEN discovering element classes, THE Gradle_Plugin SHALL identify classes that extend LynxUI pattern
3. WHEN generating the ExtensionRegistry, THE Gradle_Plugin SHALL create registration code using the element name from @LynxElement annotation
4. THE Gradle_Plugin SHALL register elements using the Behavior pattern with createUI method
5. THE Gradle_Plugin SHALL handle registration errors gracefully with appropriate logging

### Requirement 3

**User Story:** As a developer, I want to modify the generated element class directly, so that I can implement custom behavior without dealing with inheritance complexity.

#### Acceptance Criteria

1. WHEN an element class is generated, THE Element_Class SHALL be a concrete implementation that users can modify directly
2. WHEN users modify property setters, THE Element_Class SHALL maintain @LynxProp annotations for framework compatibility
3. WHEN users implement createView method, THE Element_Class SHALL return the appropriate native view type
4. THE Element_Class SHALL include helper methods for event emission when needed
5. THE Element_Class SHALL maintain proper package structure and imports

### Requirement 4

**User Story:** As a developer, I want the build system to copy my modified element classes to the distribution folder, so that they are available for consumption by other projects.

#### Acceptance Criteria

1. WHEN the build process runs, THE Build_System SHALL copy modified element classes from source to dist folder
2. WHEN copying element classes, THE Build_System SHALL preserve package structure and annotations
3. WHEN element classes are copied, THE Build_System SHALL maintain proper file permissions and timestamps
4. THE Build_System SHALL handle both Kotlin and Java element classes appropriately
5. THE Build_System SHALL validate that copied classes maintain required annotations and structure

### Requirement 5

**User Story:** As a developer, I want the codegen system to remove the spec file generation for elements, so that the codebase is simplified and easier to maintain.

#### Acceptance Criteria

1. WHEN processing element interfaces, THE Codegen_System SHALL NOT create files in generated/ directories for elements
2. WHEN cleaning up existing implementations, THE Codegen_System SHALL remove references to spec file imports
3. WHEN generating new elements, THE Codegen_System SHALL create only the main element class file
4. THE Codegen_System SHALL update existing element classes to remove spec file dependencies
5. THE Codegen_System SHALL maintain backward compatibility for existing native modules (which still use spec files)

### Requirement 6

**User Story:** As a developer, I want the element configuration to be simplified to only require the element name, so that I don't need to manage complex view type configurations.

#### Acceptance Criteria

1. WHEN configuring elements in tiger.config.ts, THE Configuration_System SHALL accept elements as an array of objects with only "name" property
2. WHEN processing element configurations, THE Codegen_System SHALL NOT require AndroidViewTypeConfig or custom view type specifications
3. WHEN generating element classes, THE Codegen_System SHALL use standard View as the default base type
4. THE Configuration_System SHALL remove support for custom view type configurations in element definitions
5. THE Parser_System SHALL be updated to handle the simplified element configuration structure
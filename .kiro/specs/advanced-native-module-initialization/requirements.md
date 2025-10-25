# Requirements Document

## Introduction

The current Lynx autolink system only supports basic native module registration through simple class instantiation. However, many native modules require complex initialization patterns such as registering lifecycle callbacks, setting up global listeners, or performing application-level configuration. The current approach requires separate activity listener classes and rigid configuration, making it difficult to maintain and extend. This feature will extend the autolink system to support self-contained module initialization where modules handle their own setup internally, eliminating the need for external configuration and separate listener classes.

## Glossary

- **Autolink System**: The gradle plugin and CLI tooling that automatically discovers and integrates Lynx native extensions
- **Native Module**: A Kotlin/Java class that provides native functionality to JavaScript code
- **Extension Registry**: Auto-generated code that registers all discovered native modules and components
- **Initialization Hook**: Custom code that runs during module registration to perform setup beyond basic instantiation
- **Application Context**: Android Application instance required for system-level operations
- **Activity Lifecycle Callbacks**: Android mechanism for monitoring activity state changes
- **tiger.config.json**: Configuration file that defines extension metadata and requirements

## Requirements

### Requirement 1

**User Story:** As a native module developer, I want my module to handle its own ActivityLifecycleCallbacks registration internally through an init method, so that I don't need external configuration or separate listener classes.

#### Acceptance Criteria

1. WHEN a native module defines an init method with Context parameter, THE Extension_Registry SHALL call the init method during module registration
2. WHEN the init method is called, THE Extension_Registry SHALL pass the Application context as a parameter
3. WHEN a module's init method fails, THE Extension_Registry SHALL log the error and continue with other modules
4. WHERE a module requires Application context, THE Extension_Registry SHALL validate context type before calling init
5. WHILE calling init methods, THE Extension_Registry SHALL handle exceptions gracefully without breaking other module registrations

### Requirement 2

**User Story:** As a native module developer, I want to eliminate external configuration requirements by handling all initialization logic within my module class, so that the autolink system can automatically detect and call my initialization method.

#### Acceptance Criteria

1. WHEN a module class contains an init method, THE Extension_Registry SHALL automatically detect and call it during registration
2. WHEN the init method is detected, THE Extension_Registry SHALL call it before standard module registration
3. IF the init method fails, THEN THE Extension_Registry SHALL log the failure and skip that module's registration
4. WHERE no init method exists, THE Extension_Registry SHALL fall back to standard constructor-based registration
5. WHILE calling init methods, THE Extension_Registry SHALL ensure proper error isolation between modules

### Requirement 3

**User Story:** As a developer integrating native modules, I want the autolink system to automatically handle complex module dependencies and initialization order, so that I don't need to manually configure module setup.

#### Acceptance Criteria

1. WHEN modules declare dependencies in tiger.config.json, THE Extension_Registry SHALL resolve and initialize modules in dependency order
2. WHEN circular dependencies are detected, THE Extension_Registry SHALL report the error and fail the build
3. WHILE resolving dependencies, THE Extension_Registry SHALL validate that all required modules are available
4. WHERE dependency resolution fails, THE Extension_Registry SHALL provide clear error messages indicating missing dependencies
5. WHEN all dependencies are satisfied, THE Extension_Registry SHALL initialize modules in topologically sorted order

### Requirement 4

**User Story:** As a native module developer, I want to use instance-based init methods instead of static methods, so that my module can maintain state and handle lifecycle callbacks more naturally.

#### Acceptance Criteria

1. WHEN a module class defines an instance init method, THE Extension_Registry SHALL call the method after instantiation
2. WHEN the init method requires Application context, THE Extension_Registry SHALL pass the context as a parameter
3. IF the instance init method throws an exception, THEN THE Extension_Registry SHALL catch and log the error
4. WHERE no init method exists, THE Extension_Registry SHALL fall back to standard constructor-based registration
5. WHILE calling init methods, THE Extension_Registry SHALL ensure the module instance is properly initialized before registration

### Requirement 5

**User Story:** As a build system maintainer, I want the gradle plugin to automatically detect init methods in module classes, so that no manual configuration is required for advanced initialization patterns.

#### Acceptance Criteria

1. WHEN scanning module classes, THE Extension_Discovery SHALL detect init methods with Context parameters automatically
2. WHEN modules contain init methods, THE Extension_Discovery SHALL mark them for advanced initialization in the registry
3. IF init method signatures are invalid, THEN THE Extension_Discovery SHALL provide specific error messages with correction suggestions
4. WHERE dependency declarations are present, THE Config_Validator SHALL validate dependency names and versions
5. WHILE scanning module classes, THE Extension_Discovery SHALL check for common initialization anti-patterns and warn developers

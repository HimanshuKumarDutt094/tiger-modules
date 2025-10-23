# Requirements Document

## Introduction

This specification extends the LynxJS Autolink system to handle both Java and Kotlin files for Android and ensure a single unified registry handles all native modules regardless of quantity. The goal is to provide robust support for Java-based extensions and efficient registry generation that scales from one to dozens of native modules.

## Glossary

- **Autolink_System**: The automatic integration mechanism that discovers and integrates native extensions without manual configuration
- **Native_Module**: A module that provides interfaces for frontend code to call native capabilities (e.g., LocalStorage)
- **Extension_Registry**: A single generated class that registers all discovered native modules from all Extension_Packages
- **Extension_Package**: An npm package containing LynxJS native code following the standardized package structure
- **Module_Registration**: The process of registering native modules with the LynxJS NativeModuleRegistry
- **Java_Support**: The ability to process and integrate Java source files in addition to Kotlin for Android
- **lynx_ext_json**: The configuration file (lynx.ext.json) that declares extension metadata including native modules
- **Unified_Registry**: A single registry file that consolidates all module registrations regardless of the number of Extension_Packages

## Requirements

### Requirement 1

**User Story:** As an Android developer, I want to write native modules in Java, so that I can use existing Java codebases and libraries.

#### Acceptance Criteria

1. THE Autolink_System SHALL discover and process Java source files in android/src/main/java directories
2. THE Extension_Registry SHALL generate proper Java imports and class references for Java-based modules
3. WHEN an Extension_Package contains both Java and Kotlin files, THE Autolink_System SHALL process both file types
4. THE Gradle_Plugin SHALL include Java source directories in the compilation classpath
5. THE Extension_Registry SHALL use appropriate syntax for Java class instantiation and registration

### Requirement 2

**User Story:** As a build system maintainer, I want a single unified registry, so that the system scales efficiently regardless of module count from multiple authors.

#### Acceptance Criteria

1. THE Gradle_Plugin SHALL scan all packages in node_modules for lynx_ext_json files
2. THE Gradle_Plugin SHALL aggregate modules from all discovered Extension_Packages (e.g., 10 packages from 10 different authors)
3. THE Gradle_Plugin SHALL generate exactly one Extension_Registry class containing all modules from all packages
4. THE Extension_Registry SHALL register all discovered Native_Modules in a single setupGlobal method
5. WHEN 10 Extension_Packages each declare 1 module, THE Extension_Registry SHALL register all 10 modules in one class

### Requirement 3

**User Story:** As an extension developer, I want to declare module metadata in lynx.ext.json, so that the Autolink system knows which modules to register.

#### Acceptance Criteria

1. THE lynx_ext_json SHALL include a "nativeModules" array with objects containing "name" and "className" fields
2. THE lynx_ext_json SHALL specify the module registration name (e.g., "LocalStorage") in the "name" field
3. THE lynx_ext_json platforms.android SHALL specify the fully qualified Java/Kotlin class name (e.g., "com.myapp.modules.LocalStorageModule")
4. THE CLI init command SHALL automatically populate lynx_ext_json with module metadata during scaffolding
5. WHERE module configuration is missing or invalid, THE Gradle_Plugin SHALL fail with clear error messages

### Requirement 4

**User Story:** As a LynxJS application developer, I want all native modules to be registered automatically, so that I can use any installed module without manual setup.

#### Acceptance Criteria

1. THE Extension_Registry SHALL register all Native_Modules from all Extension_Packages in setupGlobal method
2. WHEN the Host_Application calls ExtensionRegistry.setupGlobal(), THE Extension_Registry SHALL register all modules
3. THE Extension_Registry SHALL handle module registration failures gracefully with error logging
4. THE Native_Module SHALL be accessible via NativeModules API after registration
5. THE Extension_Registry SHALL register modules in dependency order when inter-module dependencies exist

### Requirement 5

**User Story:** As a build system maintainer, I want efficient registry generation, so that build times remain fast even with many extensions.

#### Acceptance Criteria

1. THE Gradle_Plugin SHALL cache discovery results to avoid redundant scanning
2. THE Gradle_Plugin SHALL only regenerate Extension_Registry when Extension_Packages change
3. THE Extension_Registry generation SHALL complete in under 5 seconds for 50 Extension_Packages
4. THE Gradle_Plugin SHALL use incremental compilation for registry code changes
5. THE Gradle_Plugin SHALL provide progress feedback during registry generation

### Requirement 6

**User Story:** As an Android developer, I want proper Java/Kotlin interoperability, so that mixed-language projects work seamlessly.

#### Acceptance Criteria

1. THE Extension_Registry SHALL be generated in Kotlin with proper Java interop annotations
2. WHEN a Native_Module is implemented in Java, THE Extension_Registry SHALL instantiate it correctly
3. THE Extension_Registry SHALL handle Java class constructors with Context parameters
4. THE Gradle_Plugin SHALL ensure Java classes are compiled before Kotlin registry generation
5. THE Extension_Registry SHALL use fully qualified class names to avoid import conflicts

### Requirement 7

**User Story:** As a build system maintainer, I want simple module discovery based on configuration, so that the system is maintainable and reliable.

#### Acceptance Criteria

1. THE Gradle_Plugin SHALL read lynx_ext_json from each Extension_Package to discover modules
2. THE Gradle_Plugin SHALL use the "nativeModules" array as the source of truth for module registration
3. THE Gradle_Plugin SHALL extract module name and className from each entry in the nativeModules array
4. THE Gradle_Plugin SHALL validate that the specified class files exist in the package source directories
5. THE Gradle_Plugin SHALL aggregate all modules from all Extension_Packages into a single registry

# Requirements Document

## Introduction

This specification defines the requirements for enhancing web platform support in the tiger-module system. The goal is to provide seamless web implementations for native modules and elements that work alongside existing Android and iOS implementations, enabling developers to create cross-platform extensions that work consistently across all platforms including web browsers.

## Glossary

- **Tiger Module System**: The CLI tool and code generator for LynxJS native modules that scaffolds projects and generates platform-specific code
- **Native Module**: A module that provides interfaces for frontend code to call native platform capabilities (storage, device APIs, etc.)
- **Element**: Custom UI components implemented with native code that can be used in LynxJS applications
- **Web Implementation**: JavaScript/TypeScript code that provides the same functionality as native implementations but runs in web browsers
- **Autolink Framework**: The system that automatically discovers and integrates extensions without manual configuration
- **Rsbuild Plugin**: The build system plugin that handles web platform integration and code generation
- **JSDoc Annotations**: Special comments used to mark classes for automatic discovery (@lynxnativemodule, @lynxelement)
- **Extension Registry**: Generated code that registers all discovered extensions with the runtime system

## Requirements

### Requirement 1

**User Story:** As a module developer, I want to create web implementations for my native modules, so that my extensions work consistently across Android, iOS, and web platforms.

#### Acceptance Criteria

1. WHEN a developer creates a native module interface, THE Tiger Module System SHALL generate web implementation templates with the same API surface
2. WHEN a developer implements a web native module, THE Tiger Module System SHALL support JSDoc annotation @lynxnativemodule for automatic discovery
3. WHEN a web native module is implemented, THE Tiger Module System SHALL extend the generated spec class to maintain type safety
4. WHERE web platform is configured in tiger.config.ts, THE Tiger Module System SHALL include web-specific build and discovery logic
5. WHEN building for web, THE Tiger Module System SHALL generate registration code that binds web implementations to the NativeModules interface

### Requirement 2

**User Story:** As a module developer, I want to create web implementations for custom elements, so that my UI components work seamlessly across all platforms.

#### Acceptance Criteria

1. WHEN a developer defines a custom element interface, THE Tiger Module System SHALL generate web implementation templates extending HTMLElement
2. WHEN a web element is implemented, THE Tiger Module System SHALL support JSDoc annotation @lynxelement for automatic discovery
3. WHEN a web element is created, THE Tiger Module System SHALL automatically register it as a custom element with the browser
4. WHILE the element is active, THE Tiger Module System SHALL provide property setters that match the native element API
5. WHEN element events occur, THE Tiger Module System SHALL emit events that match the native element event system

### Requirement 3

**User Story:** As an application developer, I want web extensions to be automatically discovered and integrated, so that I don't need manual configuration when adding web support to my app.

#### Acceptance Criteria

1. WHEN the Rsbuild plugin is configured with autoLink enabled, THE Tiger Module System SHALL scan node_modules for web extensions
2. WHEN web extensions are discovered, THE Tiger Module System SHALL generate an ExtensionRegistry for web platform
3. WHEN the application builds, THE Tiger Module System SHALL automatically import and register all discovered web extensions
4. WHERE extensions support multiple platforms, THE Tiger Module System SHALL only include web implementations in web builds
5. WHEN extensions are registered, THE Tiger Module System SHALL make them available through the same NativeModules interface as native platforms

### Requirement 4

**User Story:** As a module developer, I want consistent development workflow for web implementations, so that creating web support follows the same patterns as native development.

#### Acceptance Criteria

1. WHEN running tiger-module codegen, THE Tiger Module System SHALL generate web implementation stubs in the web/src directory
2. WHEN web configuration is present, THE Tiger Module System SHALL include web entry points in the build process
3. WHEN developing web implementations, THE Tiger Module System SHALL provide the same TypeScript interfaces as native implementations
4. WHERE web implementations exist, THE Tiger Module System SHALL validate that they implement the required interface methods
5. WHEN building modules, THE Tiger Module System SHALL compile web implementations alongside native code

### Requirement 5

**User Story:** As an application developer, I want web implementations to provide the same functionality as native implementations, so that my app works consistently across platforms.

#### Acceptance Criteria

1. WHEN a native module method is called on web, THE Tiger Module System SHALL route the call to the web implementation
2. WHEN web implementations use browser APIs, THE Tiger Module System SHALL provide appropriate fallbacks for missing capabilities
3. WHILE maintaining API compatibility, THE Tiger Module System SHALL allow web implementations to use web-specific features like localStorage, fetch, etc.
4. WHERE native implementations use callbacks, THE Tiger Module System SHALL support the same callback patterns in web implementations
5. WHEN web implementations emit events, THE Tiger Module System SHALL ensure they follow the same event structure as native implementations
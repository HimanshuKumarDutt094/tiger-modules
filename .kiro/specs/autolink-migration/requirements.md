# Requirements Document

## Introduction

This specification defines the migration of the tiger-module CLI from a fragile file pattern matching approach to a robust Autolink mechanism for automatic integration of LynxJS native extensions. The goal is to eliminate manual configuration and provide seamless npm-based distribution of native modules that automatically integrate into host applications without requiring developers to modify build configurations.

## Glossary

- **Autolink_System**: The automatic integration mechanism that discovers and integrates native extensions without manual configuration
- **Extension_Package**: An npm package containing LynxJS native module code following the standardized package structure
- **Host_Application**: The main LynxJS application that consumes Extension_Packages
- **Build_Plugin**: Platform-specific build system integration (Gradle plugin for Android, CocoaPods plugin for iOS)
- **Discovery_Mechanism**: The automated process of finding and cataloging Extension_Packages in a Host_Application
- **Integration_Registry**: Generated code that registers all discovered extensions with the LynxJS runtime
- **Configuration_File**: The tiger.config.json file that defines extension metadata and platform configurations
- **Legacy_CLI**: The current tiger-module CLI that uses file pattern matching for integration

## Requirements

### Requirement 1

**User Story:** As a LynxJS developer, I want to install native extensions via npm without manual build configuration, so that I can quickly add functionality to my application.

#### Acceptance Criteria

1. WHEN a developer runs `npm install @lynxjs/extension-name`, THE Autolink_System SHALL automatically discover the Extension_Package
2. WHEN the Host_Application builds, THE Build_Plugin SHALL automatically integrate the Extension_Package without manual configuration changes
3. THE Autolink_System SHALL generate Integration_Registry code that registers all discovered extensions
4. THE Host_Application SHALL compile successfully without requiring manual modification of build.gradle.kts or Podfile
5. THE Extension_Package SHALL be immediately available for use in the Host_Application after installation

### Requirement 2

**User Story:** As an extension developer, I want to create extensions using a standardized package format, so that my extensions work reliably across different host applications.

#### Acceptance Criteria

1. THE Legacy_CLI SHALL generate Extension_Packages that conform to the standardized package structure
2. THE Extension_Package SHALL include a Configuration_File with platform-specific metadata
3. THE Extension_Package SHALL contain generated native code for Android (Kotlin) and iOS (Swift) platforms
4. THE Extension_Package SHALL include TypeScript declarations for the JavaScript interface
5. THE Extension_Package SHALL be publishable as a standard npm package

### Requirement 3

**User Story:** As a build system maintainer, I want automatic discovery of extensions, so that I don't need to maintain fragile file pattern matching logic.

#### Acceptance Criteria

1. THE Discovery_Mechanism SHALL scan node_modules for Extension_Packages containing Configuration_File
2. THE Build_Plugin SHALL parse Configuration_File to determine platform support and integration requirements
3. THE Discovery_Mechanism SHALL generate platform-specific Integration_Registry code at build time
4. THE Build_Plugin SHALL handle missing or malformed Configuration_File gracefully with clear error messages
5. THE Discovery_Mechanism SHALL support incremental builds by detecting changes in Extension_Packages

### Requirement 4

**User Story:** As a LynxJS application developer, I want seamless migration from the current CLI, so that existing projects continue to work while gaining Autolink benefits.

#### Acceptance Criteria

1. THE Legacy_CLI SHALL provide a migration command that converts existing modules to the new format
2. THE Autolink_System SHALL support both legacy and new Extension_Package formats during transition
3. THE Migration_Command SHALL preserve existing functionality while adding Autolink compatibility
4. THE Legacy_CLI SHALL warn users about deprecated file pattern matching approaches
5. THE Migration_Command SHALL update Configuration_File and package structure automatically

### Requirement 5

**User Story:** As a platform maintainer, I want robust build system integration, so that extensions work reliably across different project configurations.

#### Acceptance Criteria

1. THE Build_Plugin SHALL integrate with standard Gradle build lifecycle for Android projects
2. THE Build_Plugin SHALL integrate with CocoaPods dependency management for iOS projects
3. THE Build_Plugin SHALL generate Integration_Registry code in appropriate platform-specific locations
4. THE Build_Plugin SHALL handle extension conflicts and provide clear resolution guidance
5. THE Build_Plugin SHALL support custom build configurations without breaking extension integration

# Requirements Document

## Introduction

The tiger build command needs focused enhancements to complete support for the RFC-based autolink extension structure. The current build system successfully handles platform folders and basic configuration, but needs improvements for generated TypeScript files integration and export validation.

## Glossary

- **Tiger_Module_CLI**: The command-line interface tool for building LynxJS native extensions
- **Generated_Folder**: Directory containing auto-generated TypeScript bindings from codegen command
- **Export_Validation**: Process of verifying that declared exports in index.ts actually exist in source files
- **Package_Exports**: The exports field in package.json that defines how consumers access module functionality
- **TypeScript_Bindings**: Generated .ts and .d.ts files that provide type-safe interfaces for native modules

## Requirements

### Requirement 1

**User Story:** As a LynxJS extension developer, I want the build command to include generated TypeScript files, so that consuming applications can access the auto-generated module bindings.

#### Acceptance Criteria

1. WHEN a generated folder exists in the module directory, THE Tiger_Module_CLI SHALL copy all files from the generated folder to the distribution package
2. WHEN generated TypeScript files are copied, THE Tiger_Module_CLI SHALL preserve the exact file structure and naming
3. WHEN the generated folder contains module bindings, THE Tiger_Module_CLI SHALL add appropriate exports to the package.json exports map
4. WHEN generated files include .d.ts declarations, THE Tiger_Module_CLI SHALL ensure they are accessible for TypeScript consumers
5. WHERE the generated folder is missing, THE Tiger_Module_CLI SHALL continue building without errors but log an informational message

### Requirement 2

**User Story:** As a LynxJS extension developer, I want the build command to validate export declarations, so that I can catch missing exports before publishing.

#### Acceptance Criteria

1. WHEN the build command encounters export warnings from tsdown, THE Tiger_Module_CLI SHALL provide clear guidance on fixing missing exports
2. WHEN source files declare exports that don't exist, THE Tiger_Module_CLI SHALL suggest adding type-only imports where appropriate
3. WHEN generated files are referenced in exports but missing, THE Tiger_Module_CLI SHALL recommend running the codegen command first
4. WHEN export validation detects issues, THE Tiger_Module_CLI SHALL continue the build but highlight potential runtime problems
5. WHEN all exports are valid, THE Tiger_Module_CLI SHALL confirm successful export validation in the build output

### Requirement 3

**User Story:** As a LynxJS extension developer, I want the build command to enhance package exports for generated files, so that consumers can access both main exports and generated bindings.

#### Acceptance Criteria

1. WHEN generated TypeScript files exist, THE Tiger_Module_CLI SHALL add a "./generated/*" export pattern to package.json
2. WHEN the generated folder contains module bindings, THE Tiger_Module_CLI SHALL add specific exports for each generated file
3. WHEN updating the files array in package.json, THE Tiger_Module_CLI SHALL include "generated" folder in the published files
4. WHEN creating exports map, THE Tiger_Module_CLI SHALL ensure generated files are accessible with proper TypeScript support
5. WHEN the package.json is written, THE Tiger_Module_CLI SHALL maintain existing exports while adding generated file exports

### Requirement 4

**User Story:** As a LynxJS extension developer, I want the build command to provide helpful guidance, so that I can understand what was built and how to fix any issues.

#### Acceptance Criteria

1. WHEN the build completes, THE Tiger_Module_CLI SHALL report which folders were copied and which were skipped
2. WHEN generated files are included, THE Tiger_Module_CLI SHALL list the specific generated files that were copied
3. WHEN export issues are detected, THE Tiger_Module_CLI SHALL provide actionable suggestions for fixing them
4. WHEN the build succeeds, THE Tiger_Module_CLI SHALL summarize the final package contents and available exports
5. WHEN optional folders are missing, THE Tiger_Module_CLI SHALL explain which folders are optional vs required

### Requirement 5

**User Story:** As a LynxJS extension developer, I want the build command to maintain backward compatibility, so that existing extensions continue to work while supporting new RFC features.

#### Acceptance Criteria

1. WHEN building an extension without a generated folder, THE Tiger_Module_CLI SHALL complete successfully without errors
2. WHEN building legacy extensions with module.config.ts, THE Tiger_Module_CLI SHALL continue to support the existing build process
3. WHEN new RFC features are unavailable, THE Tiger_Module_CLI SHALL gracefully degrade functionality without breaking the build
4. WHEN both old and new features are present, THE Tiger_Module_CLI SHALL prioritize RFC-based configuration and features
5. WHEN legacy patterns are detected, THE Tiger_Module_CLI SHALL provide informational messages about available upgrades
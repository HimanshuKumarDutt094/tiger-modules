# Requirements Document

## Introduction

The lynxjs-module system provides a complete toolkit for developing, building, and distributing native modules for the LynxJS framework. The system enables module developers to scaffold projects, generate native code from TypeScript interfaces, build distributable packages, and automatically integrate modules into host applications through a post-install mechanism. The installer component detects host project structure (Android Kotlin/Java and iOS Swift/Objective-C), copies native files to appropriate locations, and registers modules with the LynxJS runtime.

## Glossary

- **LynxJS**: A cross-platform mobile framework that bridges JavaScript and native code
- **Module Developer**: A developer creating a reusable native module for LynxJS
- **Host Application**: The end-user's LynxJS application that consumes published modules
- **CLI System**: The lynxjs-module command-line interface with init, codegen, and build commands
- **Installer System**: The post-install script that integrates module native code into host applications
- **Module Config**: Configuration file (module.config.ts) containing module metadata
- **Native Registration**: The process of registering a module class with LynxEnv (Android) or LynxModule config (iOS)
- **Package Path**: The Java/Kotlin package structure (e.g., com.modules.localstorage)
- **Bridging Header**: Objective-C header file that exposes Swift classes to Objective-C runtime
- **Host Root**: The root directory of the host application project
- **Module Directory**: The directory containing the installed module in node_modules

## Requirements

### Requirement 1

**User Story:** As a module developer, I want to scaffold a new module project with a single command, so that I can start developing without manual setup

#### Acceptance Criteria

1. WHEN THE Module_Developer executes "lynxjs-module init", THE CLI_System SHALL prompt for module name, Android package name, and description
2. WHEN THE Module_Developer provides a PascalCase module name, THE CLI_System SHALL create a directory structure with src/, android/, and ios/ folders
3. WHEN THE CLI_System creates the scaffold, THE CLI_System SHALL generate package.json with correct exports, scripts, and dependencies
4. WHEN THE CLI_System creates the scaffold, THE CLI_System SHALL generate module.config.ts with the provided metadata
5. WHEN THE CLI_System creates the scaffold, THE CLI_System SHALL generate tsconfig.json and tsdown.config.ts for TypeScript compilation

### Requirement 2

**User Story:** As a module developer, I want to generate native code from TypeScript interfaces, so that I maintain a single source of truth for my module API

#### Acceptance Criteria

1. WHEN THE Module_Developer executes "lynxjs-module codegen", THE CLI_System SHALL parse the TypeScript interface extending TigerModule
2. WHEN THE CLI_System parses the interface, THE CLI_System SHALL extract method signatures including parameters and return types
3. WHEN THE CLI_System extracts method signatures, THE CLI_System SHALL generate Kotlin code in android/src/main/java with correct package structure
4. WHEN THE CLI_System extracts method signatures, THE CLI_System SHALL generate Swift code in ios/modules with LynxModule protocol conformance
5. WHEN THE CLI_System generates native code, THE CLI_System SHALL create TypeScript declaration files for type safety

### Requirement 3

**User Story:** As a module developer, I want to build a distributable package, so that other developers can install my module via npm

#### Acceptance Criteria

1. WHEN THE Module_Developer executes "lynxjs-module build", THE CLI_System SHALL run tsdown to compile TypeScript to JavaScript
2. WHEN THE CLI_System compiles TypeScript, THE CLI_System SHALL copy android/ and ios/ directories to dist/
3. WHEN THE CLI_System copies native directories, THE CLI_System SHALL generate dist/install.js that imports the installer
4. WHEN THE CLI_System generates install.js, THE CLI_System SHALL modify package.json to include postinstall script
5. WHEN THE CLI_System modifies package.json, THE CLI_System SHALL ensure files array includes android, ios, and dist directories

### Requirement 4

**User Story:** As a host application developer, I want modules to auto-install when I run npm install, so that I don't need manual integration steps

#### Acceptance Criteria

1. WHEN THE Host_Application executes npm install for a module, THE Installer_System SHALL detect the host application root directory
2. WHEN THE Installer_System detects the host root, THE Installer_System SHALL read module.config.ts or module.config.js for module metadata
3. WHERE THE Installer_System cannot find module config, THE Installer_System SHALL fallback to package.json for module name
4. WHEN THE Installer_System reads module metadata, THE Installer_System SHALL locate Android and iOS source directories in the module
5. IF THE Installer_System cannot read module config, THEN THE Installer_System SHALL log a warning and abort installation

### Requirement 5

**User Story:** As a host application developer, I want Android native files copied to my project, so that the module code is available for compilation

#### Acceptance Criteria

1. WHEN THE Installer_System processes Android files, THE Installer_System SHALL use fast-glob to find Kotlin and Java files matching the package structure
2. WHEN THE Installer_System finds Android source files, THE Installer_System SHALL search the host project for android/**/src/**/java directories
3. WHEN THE Installer_System locates host Java directories, THE Installer_System SHALL copy module files to the matching package path
4. WHEN THE Installer_System copies files, THE Installer_System SHALL skip copying if source and destination content are identical
5. WHERE THE Installer_System finds multiple host Java roots, THE Installer_System SHALL copy files to all matching locations

### Requirement 6

**User Story:** As a host application developer, I want the module automatically registered in my Android Application class, so that it's available at runtime

#### Acceptance Criteria

1. WHEN THE Installer_System patches Android registration, THE Installer_System SHALL search for files containing "LynxEnv.inst()"
2. WHEN THE Installer_System finds LynxEnv.inst() usage, THE Installer_System SHALL add import statement for the module class
3. WHEN THE Installer_System adds imports, THE Installer_System SHALL use Kotlin syntax for .kt files and Java syntax for .java files
4. WHEN THE Installer_System adds imports, THE Installer_System SHALL insert registration line "LynxEnv.inst().registerModule()" with correct class reference
5. IF THE Installer_System detects existing registration, THEN THE Installer_System SHALL skip adding duplicate registration

### Requirement 7

**User Story:** As a host application developer, I want iOS native files copied to my project, so that the module code is available for compilation

#### Acceptance Criteria

1. WHEN THE Installer_System processes iOS files, THE Installer_System SHALL use fast-glob to find Swift and Objective-C files in ios/modules
2. WHEN THE Installer_System finds iOS source files, THE Installer_System SHALL search the host project for ios/ or apple/ directories
3. WHEN THE Installer_System locates host iOS directories, THE Installer_System SHALL copy module files to a modules/ subdirectory
4. WHEN THE Installer_System copies iOS files, THE Installer_System SHALL preserve file structure and naming
5. WHEN THE Installer_System copies files, THE Installer_System SHALL skip copying if source and destination content are identical

### Requirement 8

**User Story:** As a host application developer using Objective-C, I want the bridging header updated, so that Swift modules are accessible

#### Acceptance Criteria

1. WHEN THE Installer_System patches iOS for Objective-C projects, THE Installer_System SHALL search for files matching "\*-Bridging-Header.h"
2. WHEN THE Installer_System finds bridging headers, THE Installer_System SHALL add "#import <Lynx/LynxModule.h>" if not present
3. WHEN THE Installer_System adds Lynx import, THE Installer_System SHALL add "#import \"ModuleName.h\"" for the module
4. WHEN THE Installer_System modifies bridging headers, THE Installer_System SHALL preserve existing content
5. WHERE THE Installer_System finds multiple bridging headers, THE Installer_System SHALL update all matching files

### Requirement 9

**User Story:** As a host application developer using Swift, I want the module automatically registered in my iOS setup code, so that it's available at runtime

#### Acceptance Criteria

1. WHEN THE Installer_System patches Swift registration, THE Installer_System SHALL search for Swift files containing "config.register"
2. WHEN THE Installer_System finds registration patterns, THE Installer_System SHALL replace placeholder comments with actual registration
3. WHEN THE Installer_System adds registration, THE Installer_System SHALL use syntax "config.register(ModuleNameModule.self)"
4. WHEN THE Installer_System modifies Swift files, THE Installer_System SHALL preserve existing registrations
5. IF THE Installer_System detects existing module registration, THEN THE Installer_System SHALL skip adding duplicate registration

### Requirement 10

**User Story:** As a module developer, I want clear error messages when operations fail, so that I can troubleshoot issues quickly

#### Acceptance Criteria

1. WHEN THE CLI_System encounters invalid module names, THE CLI_System SHALL display an error message indicating PascalCase requirement
2. WHEN THE Installer_System cannot find module config, THE Installer_System SHALL log a warning with searched file paths
3. WHEN THE Installer_System cannot locate host directories, THE Installer_System SHALL log the search patterns used
4. WHEN THE CLI_System operations complete successfully, THE CLI_System SHALL display confirmation messages with file paths
5. WHEN THE Installer_System completes, THE Installer_System SHALL log summary of files copied and patches applied

### Requirement 11

**User Story:** As a module developer, I want the build process to handle both TypeScript and JavaScript configs, so that I have flexibility in my setup

#### Acceptance Criteria

1. WHEN THE CLI_System reads module.config, THE CLI_System SHALL attempt to load module.config.ts first
2. WHERE module.config.ts does not exist, THE CLI_System SHALL attempt to load module.config.js
3. WHERE neither config file exists, THE CLI_System SHALL attempt to load from dist/module.config.js
4. WHEN THE CLI_System parses TypeScript config, THE CLI_System SHALL use regex extraction for moduleName and androidPackageName
5. WHEN THE CLI_System parses JavaScript config, THE CLI_System SHALL use dynamic import or require

### Requirement 12

**User Story:** As a host application developer, I want the installer to be idempotent, so that running npm install multiple times doesn't break my project

#### Acceptance Criteria

1. WHEN THE Installer_System copies files, THE Installer_System SHALL compare file content before overwriting
2. WHEN THE Installer_System detects identical content, THE Installer_System SHALL skip the copy operation
3. WHEN THE Installer_System adds imports, THE Installer_System SHALL check for existing imports before adding
4. WHEN THE Installer_System adds registrations, THE Installer_System SHALL check for existing registrations before adding
5. WHEN THE Installer_System runs multiple times, THE Installer_System SHALL produce the same result without duplication

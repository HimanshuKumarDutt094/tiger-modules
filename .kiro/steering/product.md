# Product Overview

**lynxjs-module** is a CLI tool and code generator for LynxJS native modules. It scaffolds new native modules and generates platform-specific code (TypeScript declarations, Kotlin for Android, Swift for iOS) from TypeScript interface definitions.

## Core Functionality

- **Scaffolding**: Creates new LynxJS module projects with proper structure and configuration
- **Code Generation**: Parses TypeScript interfaces extending `MyModuleGenerator` and generates:
  - TypeScript declaration files (.d.ts)
  - Kotlin modules for Android
  - Swift modules for iOS
- **Build System**: Provides build and development commands for module development

## Key Commands

- `lynxjs-module init [moduleName]` - Scaffold a new module
- `lynxjs-module codegen` - Generate native platform code from TypeScript interfaces
- `lynxjs-module build` - Build the module

## Target Users

Developers building cross-platform native modules for LynxJS applications that need to bridge JavaScript with native Android (Kotlin) and iOS (Swift) code.

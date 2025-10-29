# Product Overview

**tiger** is a CLI tool and code generator for LynxJS native modules. It scaffolds new native modules and generates platform-specific code (TypeScript declarations, Kotlin for Android, Swift for iOS) from TypeScript interface definitions.

## Core Functionality

- **Scaffolding**: Creates new LynxJS module projects with proper structure and configuration
- **Code Generation**: Parses TypeScript interfaces extending `TigerModule` and generates:
  - TypeScript declaration files (.d.ts)
  - Kotlin modules for Android
  - Swift modules for iOS
- **Build System**: Provides build and development commands for module development

## Key Commands

- `tiger init [moduleName]` - Scaffold a new module
- `tiger codegen` - Generate native platform code from TypeScript interfaces
- `tiger build` - Build the module

## Target Users

Developers building cross-platform native modules for LynxJS applications that need to bridge JavaScript with native Android (Kotlin) and iOS (Swift) code.

# TigerModule Autolink Gradle Plugin

Gradle plugins for automatic discovery and integration of TigerModule native extensions in Android projects. Inspired by Expo's autolinking approach, this plugin scans `node_modules` at build time and generates centralized registration code.

## Overview

This is a unified Gradle plugin that automatically handles both discovery and integration of TigerModule extensions:

- **Settings Phase**: Discovers TigerModule extensions in `node_modules` and includes them as Gradle subprojects
- **Build Phase**: Generates type-safe registry code using KotlinPoet and manages dependencies

The same plugin ID works in both `settings.gradle.kts` and `build.gradle.kts` - it automatically detects the context and applies the appropriate functionality.

## Key Features

- 🔍 **Automatic Discovery**: Scans `node_modules` for extensions with `tiger.config.json`
- 🏗️ **Subproject Integration**: Includes extensions as Gradle subprojects (similar to Expo)
- 📝 **Type-Safe Code Generation**: Uses KotlinPoet for generating `ExtensionRegistry.kt`
- 🔖 **Annotation Support**: Discovers `@LynxNativeModule`, `@LynxElement`, and `@LynxService` annotations
- 🔄 **Smart Regeneration**: Only regenerates registry when configurations change (content-hash based)
- ✅ **Validation**: Validates extension configurations and source files

## Installation

### From Gradle Plugin Portal

In your Android project's `settings.gradle.kts`:

```kotlin
plugins {
    id("io.github.himanshukumardutt094.tiger-autolink") version "1.0.0"
}
```

In your Android app module's `build.gradle.kts`:

```kotlin
plugins {
    id("com.android.application")
    id("io.github.himanshukumardutt094.tiger-autolink") version "1.0.0"
}
```

That's it! The same plugin ID works in both places - it automatically detects whether it's being applied to Settings or Project and behaves accordingly.

### Local Development

1. Build and publish to local Maven:

```bash
cd plugins/gradle-autolink-plugin
./gradlew publishToMavenLocal
```

2. In your Android project's `settings.gradle.kts`:

```kotlin
pluginManagement {
    repositories {
        mavenLocal()
        gradlePluginPortal()
        google()
        mavenCentral()
    }
}

plugins {
    id("io.github.himanshukumardutt094.tiger-autolink") version "1.0.0"
}
```

3. In your Android app module's `build.gradle.kts`:

```kotlin
plugins {
    id("com.android.application")
    id("io.github.himanshukumardutt094.tiger-autolink") version "1.0.0"
}
```

## Usage

### 1. Discovering Extensions

The settings plugin automatically scans `node_modules` during Gradle sync. To see what was discovered:

```bash
./gradlew listTigerModuleExtensions
```

This will show:

- Extension name and version
- Android package name and source directory
- Discovered native modules, elements, and services

### 2. Automatic Build Integration

The build plugin automatically:

- Generates `ExtensionRegistry.kt` before compilation
- Adds extension subprojects as dependencies
- Generates annotation classes for extension development
- Hooks into the Android build lifecycle

To manually trigger registry generation:

```bash
./gradlew generateTigerModuleExtensionRegistry
```

### 3. Using in Your App

In your Android application's `Application` or `Activity`:

```kotlin
import com.tigermodule.autolink.generated.ExtensionRegistry

class MyApplication : Application() {
    override fun onCreate() {
        super.onCreate()

        // Register all discovered extensions
        ExtensionRegistry.setupGlobal(this)
    }
}
```

The generated registry will:

- Register all native modules with `LynxEnv.inst().registerModule()`
- Register all custom elements with `LynxEnv.inst().addBehavior()`
- Initialize all services

## How It Works

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ Settings Phase (settings.gradle.kts)                        │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 1. Scan node_modules for tiger.config.json             │ │
│ │ 2. Include extensions as Gradle subprojects             │ │
│ │ 3. Store discovered extensions in project properties    │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Build Phase (build.gradle.kts)                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 1. Add extension subprojects as dependencies            │ │
│ │ 2. Generate annotation classes                          │ │
│ │ 3. Scan compiled classes for annotations (optional)     │ │
│ │ 4. Generate ExtensionRegistry.kt using KotlinPoet      │ │
│ │ 5. Add generated sources to Android source sets        │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Compilation Phase                                            │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 1. Compile extension sources from subprojects           │ │
│ │ 2. Compile generated ExtensionRegistry.kt               │ │
│ │ 3. Package everything into APK                          │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Discovery Process

1. **Settings Phase**: Scans `node_modules` (or parent's `node_modules`) for packages containing `tiger.config.json` or `dist/tiger.config.json`
2. **Validation**: Validates each extension's configuration and checks for required Android platform support
3. **Inclusion**: Includes each extension's `android/` directory as a Gradle subproject
4. **Storage**: Stores discovered extensions in project extra properties for the build plugin

### Code Generation

The build plugin uses **KotlinPoet** for type-safe code generation:

1. Reads extension configurations from project properties
2. Optionally scans compiled `.class` files using ASM for annotation validation
3. Generates `ExtensionRegistry.kt` with:
   - Module registration calls
   - Element behavior registration
   - Service initialization
4. Uses content-hash to skip regeneration when nothing changed

### Generated Code Example

```kotlin
// Auto-generated by TigerModule Autolink Gradle Plugin
package com.tigermodule.autolink.generated

import android.content.Context
import android.util.Log
import com.lynx.tasm.LynxEnv
import com.lynx.tasm.behavior.Behavior
import com.lynx.tasm.behavior.LynxContext

object ExtensionRegistry {
    fun setupGlobal(context: Context) {
        // Register native modules
        try {
            LynxEnv.inst().registerModule("storage", LocalStorageModule::class.java)
            Log.d("ExtensionRegistry", "Registered module: storage")
        } catch (e: Exception) {
            Log.e("ExtensionRegistry", "Failed to register module storage: " + e.message)
        }

        // Register custom elements
        try {
            LynxEnv.inst().addBehavior(object : Behavior("custom-button", false, false) {
                override fun createUI(context: LynxContext) = CustomButton(context)
            })
            Log.d("ExtensionRegistry", "Registered element: CustomButton as tag 'custom-button'")
        } catch (e: Exception) {
            Log.e("ExtensionRegistry", "Failed to register element CustomButton: " + e.message)
        }
    }
}
```

## Extension Configuration

Extensions must have a `tiger.config.json` file in their root or `dist/` directory:

```json
{
  "name": "@tigermodule/my-extension",
  "version": "1.0.0",
  "platforms": {
    "android": {
      "packageName": "com.tigermodule.myextension",
      "sourceDir": "android/src/main",
      "buildTypes": ["debug", "release"],
      "language": "kotlin"
    }
  },
  "nativeModules": [
    {
      "name": "MyModule",
      "className": "MyModuleImpl"
    }
  ],
  "elements": [
    {
      "name": "MyElement"
    }
  ],
  "services": ["MyService"]
}
```

### Configuration Fields

- `name` (required): Package name (e.g., `@tigermodule/storage`)
- `version` (required): Package version
- `platforms.android` (required for Android): Android-specific configuration
  - `packageName` (required): Kotlin/Java package name
  - `sourceDir`: Path to Android source directory (default: `android/src/main`)
  - `buildTypes`: Build types to include (default: `["debug", "release"]`)
  - `language`: Source language (default: `kotlin`)
- `nativeModules`: Array of native module configurations
  - `name`: Module name exposed to JavaScript
  - `className`: Kotlin class name
- `elements`: Array of custom element configurations
  - `name`: Element class name
- `services`: Array of service class names

## Annotation Support

The plugin provides three annotations for marking extension classes:

```kotlin
import com.tigermodule.autolink.LynxNativeModule
import com.tigermodule.autolink.LynxElement
import com.tigermodule.autolink.LynxService

@LynxNativeModule(name = "storage")
class LocalStorageModule : LocalStorageSpec() {
    // Implementation
}

@LynxElement(name = "custom-button")
class CustomButton(context: LynxContext) : LynxUI<View>(context) {
    // Implementation
}

@LynxService
class MyService : IMyService {
    // Implementation
}
```

**Note**: These annotations are for **autolink discovery only**. They are separate from Lynx SDK annotations like `@LynxMethod`, `@LynxProp`, etc., which come from the Lynx SDK itself.

## Available Gradle Tasks

The plugin provides several tasks for managing extensions:

- `listTigerModuleExtensions` - Lists all discovered extensions with details
- `generateTigerModuleExtensionRegistry` - Generates the ExtensionRegistry.kt file
- `generateTigerModuleAnnotations` - Generates annotation classes for extension development
- `addTigerModuleExtensionDependencies` - Adds extension subprojects as dependencies

## Troubleshooting

### Extensions not discovered

1. Ensure `tiger.config.json` exists in extension root or `dist/` directory
2. Check that `node_modules` is in project root or parent directory
3. Run `./gradlew listTigerModuleExtensions` to see what was found
4. Verify extension has `platforms.android` configuration

### Registry not regenerating

The plugin uses content-hash to skip unnecessary regeneration. To force regeneration:

```bash
./gradlew clean generateTigerModuleExtensionRegistry
```

### Build errors with generated code

1. Ensure Android plugin is applied before the extension-build plugin
2. Check that generated sources are in build output: `build/generated/source/tigermodule/`
3. Verify extension classes are accessible (correct package names)

### Subproject inclusion fails

1. Check that extension has `android/` directory
2. Verify `android/build.gradle.kts` exists and is valid
3. Look for error messages during Gradle sync

## Development

### Building

```bash
./gradlew build
```

### Testing

```bash
./gradlew test
```

### Publishing Locally

```bash
./gradlew publishToMavenLocal
```

### Publishing to Gradle Plugin Portal

1. Set up your API keys (see [PUBLISHING.md](PUBLISHING.md))
2. Run the publish script:
   ```bash
   ./publish.sh
   ```
   Or manually:
   ```bash
   ./gradlew publishPlugins
   ```

For detailed publishing instructions, see [PUBLISHING.md](PUBLISHING.md) and [PUBLISHING_CHECKLIST.md](PUBLISHING_CHECKLIST.md).

## Technical Details

### Dependencies

- **ASM 9.6**: Bytecode analysis for annotation scanning
- **Gson 2.10.1**: JSON parsing for `tiger.config.json`
- **KotlinPoet 1.16.0**: Type-safe Kotlin code generation

### Code Generation Strategy

The plugin uses KotlinPoet's builder API for type-safe code generation:

- `FileSpec.builder()` for file structure
- `TypeSpec.objectBuilder()` for singleton objects
- `FunSpec.builder()` for functions
- `CodeBlock` for code statements
- `ClassName` for type references

No string templates are used for Kotlin code generation, ensuring type safety and proper formatting.

### Annotation Scanning

Uses ASM's `ClassVisitor` pattern to scan compiled bytecode:

1. Reads `.class` files from extension directories
2. Visits class annotations using `AnnotationVisitor`
3. Extracts annotation parameters (e.g., module names)
4. Validates against configuration

This approach works after compilation, unlike KAPT which runs during compilation.

## Requirements

- Gradle 7.0+
- Kotlin 1.8+
- Android Gradle Plugin 7.0+
- Java 11+
- Node.js and npm (for managing extensions)

## License

MIT

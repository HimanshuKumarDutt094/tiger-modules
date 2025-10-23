# TigerModule Autolink Gradle Plugin

Gradle plugins for automatic discovery and integration of TigerModule native extensions in Android projects.

## Overview

This plugin provides two Gradle plugins:

- **Settings Plugin** (`com.tigermodule.extension-settings`): Discovers TigerModule extensions in `node_modules`
- **Build Plugin** (`com.tigermodule.extension-build`): Generates registry code and integrates extensions

## Installation

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
    id("com.tigermodule.extension-settings") version "0.0.1"
}
```

3. In your Android project's `build.gradle.kts`:

```kotlin
plugins {
    id("com.android.application")
    id("com.tigermodule.extension-build") version "0.0.1"
}
```

## Usage

### Discovering Extensions

The plugin automatically scans `node_modules` for packages containing `tiger.config.json`.

To list discovered extensions:

```bash
./gradlew listTigerModuleExtensions
```

### Generating Registry

The plugin generates `ExtensionRegistry.kt` during the build:

```bash
./gradlew generateTigerModuleExtensionRegistry
```

### Using in Your App

In your Android application code:

```kotlin
import com.tigermodule.autolink.generated.ExtensionRegistry

class MainActivity : Activity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Register all discovered extensions
        ExtensionRegistry.setupGlobal(this)

        // ... rest of your code
    }
}
```

## How It Works

1. **Settings Phase**: The settings plugin scans `node_modules` for `tiger.config.json` files
2. **Configuration Phase**: Discovered extensions are stored in project extra properties
3. **Build Phase**: The build plugin generates `ExtensionRegistry.kt` with registration code
4. **Compilation**: Generated code is added to Android source sets and compiled

## Extension Format

Extensions must have a `tiger.config.json` file:

```json
{
  "name": "@tigermodule/my-extension",
  "version": "1.0.0",
  "platforms": {
    "android": {
      "packageName": "com.tigermodule.myextension",
      "sourceDir": "android/src/main"
    }
  },
  "nativeModules": ["MyModule"],
  "elements": ["MyElement"]
}
```

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

## Requirements

- Gradle 7.0+
- Kotlin 1.8+
- Android Gradle Plugin 7.0+
- Java 11+

## License

MIT

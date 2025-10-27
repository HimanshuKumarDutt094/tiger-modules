# Unified Plugin Migration Guide

## What Changed

We've merged the two separate plugins into a single unified plugin for a better developer experience.

### Before (v1.0.0 - Two Plugins)

```kotlin
// settings.gradle.kts
plugins {
    id("io.github.himanshukumardutt094.extension-settings") version "1.0.0"
}

// build.gradle.kts
plugins {
    id("io.github.himanshukumardutt094.extension-build") version "1.0.0"
}
```

### After (v1.0.0+ - Unified Plugin)

```kotlin
// settings.gradle.kts
plugins {
    id("io.github.himanshukumardutt094.tiger-autolink") version "1.0.0"
}

// build.gradle.kts
plugins {
    id("io.github.himanshukumardutt094.tiger-autolink") version "1.0.0"
}
```

## Benefits

1. **Simpler Setup**: One plugin ID to remember instead of two
2. **Less Confusion**: No need to remember which plugin goes where
3. **Cleaner Configuration**: Same ID in both files
4. **Better DX**: Follows the principle of least surprise

## How It Works

The unified plugin (`TigerModuleAutolinkPlugin`) automatically detects the context:

- When applied to `Settings`: Runs discovery and subproject inclusion
- When applied to `Project`: Runs registry generation and dependency management

This is similar to how Lepo's plugin works, but published to Gradle Plugin Portal instead of being embedded.

## Implementation Details

### New File Structure

```
TigerModuleAutolinkPlugin.kt (NEW)
├── Detects context (Settings vs Project)
├── Delegates to TigerModuleExtensionSettingsPlugin for Settings
└── Delegates to TigerModuleExtensionBuildPlugin for Project

TigerModuleExtensionSettingsPlugin.kt (UNCHANGED)
└── Discovery and subproject inclusion logic

TigerModuleExtensionBuildPlugin.kt (UNCHANGED)
└── Registry generation and dependency management
```

### Plugin Registration

In `build.gradle.kts`:

```kotlin
gradlePlugin {
    plugins {
        create("tigerModuleAutolink") {
            id = "io.github.himanshukumardutt094.tiger-autolink"
            implementationClass = "com.tigermodule.autolink.TigerModuleAutolinkPlugin"
            displayName = "TigerModule Autolink Plugin"
            description = "Unified Gradle plugin for TigerModule extension autolink..."
            tags = listOf("tigermodule", "autolink", "native-modules", "android", "lynxjs", "codegen", "discovery")
        }
    }
}
```

## Migration for Existing Users

If you're already using the old plugin IDs, simply replace them:

1. In `settings.gradle.kts`:
   ```kotlin
   // OLD
   id("io.github.himanshukumardutt094.extension-settings") version "1.0.0"
   
   // NEW
   id("io.github.himanshukumardutt094.tiger-autolink") version "1.0.0"
   ```

2. In `build.gradle.kts`:
   ```kotlin
   // OLD
   id("io.github.himanshukumardutt094.extension-build") version "1.0.0"
   
   // NEW
   id("io.github.himanshukumardutt094.tiger-autolink") version "1.0.0"
   ```

Everything else remains the same - no code changes needed!

## Publishing

To publish the unified plugin:

```bash
cd plugins/gradle-autolink-plugin
./gradlew publishPlugins
```

Or use the publish script:

```bash
./publish.sh
```

## Backward Compatibility

The old plugin IDs (`extension-settings` and `extension-build`) are no longer published. Users should migrate to the unified plugin ID.

If you need to support both for a transition period, you can publish all three plugin IDs from the same codebase by adding them to the `gradlePlugin` block.

## Testing

Test the unified plugin locally:

```bash
# Build and publish to local Maven
./gradlew publishToMavenLocal

# In your test project's settings.gradle.kts
pluginManagement {
    repositories {
        mavenLocal()
        gradlePluginPortal()
    }
}

plugins {
    id("io.github.himanshukumardutt094.tiger-autolink") version "1.0.0"
}

# In your test project's app/build.gradle.kts
plugins {
    id("com.android.application")
    id("io.github.himanshukumardutt094.tiger-autolink") version "1.0.0"
}
```

Then run:

```bash
./gradlew listTigerModuleExtensions
./gradlew generateTigerModuleExtensionRegistry
```

## Comparison with Lepo

| Aspect | Lepo | Tiger Module (Old) | Tiger Module (New) |
|--------|------|-------------------|-------------------|
| Plugin Count | 1 (embedded) | 2 (published) | 1 (published) |
| Plugin ID | `com.lepo` | Two different IDs | Single ID |
| Distribution | Embedded via `includeBuild` | Gradle Plugin Portal | Gradle Plugin Portal |
| Setup Complexity | Medium | Low | Very Low |
| Reusability | Per-project | All projects | All projects |

## Summary

The unified plugin provides the best of both worlds:
- **Simplicity** of Lepo's single plugin approach
- **Reusability** of published plugins on Gradle Plugin Portal
- **Clarity** of explicit context detection

This makes Tiger Module Autolink even easier to use than before!

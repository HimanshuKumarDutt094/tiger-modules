# Design Document

## Overview

This design extends the existing Lynx autolink system to support advanced native module initialization patterns. The solution introduces a flexible configuration system in `tiger.config.json` that allows modules to declare initialization requirements, and enhances the gradle plugin to generate appropriate registration code.

The design maintains full backward compatibility while adding powerful new capabilities for complex modules like the `LynxjsLinkingModule` that need Application context access and lifecycle callback registration.

## Architecture

### Configuration Layer

- **Enhanced tiger.config.json**: Extended schema supporting initialization hooks, dependencies, and context requirements
- **Validation Engine**: Build-time validation of initialization configurations
- **Dependency Resolver**: Topological sorting of module initialization order

### Code Generation Layer

- **Registry Generator**: Enhanced to produce initialization code based on module requirements
- **Template System**: Flexible code templates for different initialization patterns
- **Error Handling**: Robust error isolation and logging for initialization failures

### Runtime Layer

- **Extension Registry**: Generated code that handles complex initialization sequences
- **Context Management**: Proper handling and validation of Android Application context
- **Lifecycle Integration**: Automatic registration of activity lifecycle callbacks

## Components and Interfaces

### Enhanced tiger.config.json Schema

```json
{
  "name": "@lynxjs/linking",
  "version": "1.0.0",
  "platforms": {
    "android": {
      "packageName": "com.modules.linking",
      "sourceDir": "android/src/main",
      "initialization": {
        "requiresApplicationContext": true,
        "hooks": [
          {
            "type": "static_method",
            "method": "initialize",
            "parameters": ["context"]
          },
          {
            "type": "lifecycle_callbacks",
            "className": "LynxLinkingActivityListener"
          }
        ],
        "dependencies": []
      }
    }
  },
  "nativeModules": [
    {
      "name": "LynxjsLinking",
      "className": "LynxjsLinkingModule"
    }
  ]
}
```

### Initialization Hook Types

1. **static_method**: Calls a static method on the module class
2. **lifecycle_callbacks**: Registers ActivityLifecycleCallbacks
3. **custom_initializer**: Executes custom initialization code
4. **dependency_injection**: Handles dependency injection patterns

### Enhanced AutolinkConfig Data Classes

```kotlin
data class AndroidConfig(
    val packageName: String,
    val sourceDir: String = "android/src/main",
    val buildTypes: List<String> = listOf("debug", "release"),
    val language: String = "kotlin",
    val initialization: InitializationConfig? = null
)

data class InitializationConfig(
    val requiresApplicationContext: Boolean = false,
    val hooks: List<InitializationHook> = emptyList(),
    val dependencies: List<String> = emptyList(),
    val order: Int = 0
)

data class InitializationHook(
    val type: String, // "static_method", "lifecycle_callbacks", "custom_initializer"
    val method: String? = null,
    val className: String? = null,
    val parameters: List<String> = emptyList(),
    val code: String? = null
)
```

### Enhanced Registry Generator

The `RegistryGenerator` will be extended to produce more sophisticated initialization code:

```kotlin
fun setupGlobal(context: Context) {
    val applicationContext = when (context) {
        is Application -> context
        else -> context.applicationContext as? Application
    }

    if (applicationContext == null) {
        Log.e("ExtensionRegistry", "Application context required but not available")
        return
    }

    // Initialize modules in dependency order
    initializeModulesInOrder(applicationContext)
}

private fun initializeModulesInOrder(application: Application) {
    // Generated initialization code for each module
    initializeLynxjsLinkingModule(application)
    // ... other modules
}

private fun initializeLynxjsLinkingModule(application: Application) {
    try {
        // Register lifecycle callbacks
        val listener = LynxLinkingActivityListener()
        application.registerActivityLifecycleCallbacks(listener)
        Log.d("ExtensionRegistry", "LynxLinkingActivityListener registered")

        // Register the module
        LynxEnv.inst().registerModule("LynxjsLinking", LynxjsLinkingModule::class.java)
        Log.d("ExtensionRegistry", "Registered module: LynxjsLinking")
    } catch (e: Exception) {
        Log.e("ExtensionRegistry", "Failed to initialize LynxjsLinkingModule: ${e.message}")
    }
}
```

## Data Models

### Dependency Graph

- **Node**: Represents a native module with its initialization requirements
- **Edge**: Represents dependency relationships between modules
- **Resolver**: Topological sort algorithm for determining initialization order

### Initialization Context

- **Application Context**: Android Application instance
- **Module Registry**: Map of registered modules and their states
- **Error Collector**: Aggregates initialization errors for reporting

### Configuration Validation

- **Schema Validator**: Validates tiger.config.json against extended schema
- **Dependency Validator**: Checks for circular dependencies and missing modules
- **Class Validator**: Verifies that declared classes and methods exist

## Error Handling

### Build-Time Validation

- Invalid initialization hook configurations
- Missing dependency declarations
- Circular dependency detection
- Non-existent class or method references

### Runtime Error Handling

- Graceful degradation when initialization fails
- Detailed logging for debugging
- Isolation of module failures to prevent cascade effects
- Fallback to basic registration when advanced initialization fails

### Error Messages

- Clear, actionable error messages with suggested fixes
- Context-aware suggestions based on common patterns
- Links to documentation for complex scenarios

## Testing Strategy

### Unit Tests

- Configuration parsing and validation
- Dependency resolution algorithms
- Code generation templates
- Error handling scenarios

### Integration Tests

- End-to-end module initialization
- Application context handling
- Lifecycle callback registration
- Multi-module dependency scenarios

### Build Tests

- Gradle plugin integration
- Generated code compilation
- Android project integration
- Backward compatibility verification

## Implementation Phases

### Phase 1: Configuration Schema Extension

- Extend AutolinkConfig data classes
- Update JSON parsing logic
- Add basic validation for new fields

### Phase 2: Enhanced Registry Generation

- Implement initialization hook code generation
- Add Application context handling
- Create error handling templates

### Phase 3: Dependency Resolution

- Implement dependency graph construction
- Add topological sorting algorithm
- Create dependency validation logic

### Phase 4: Advanced Initialization Patterns

- Support for static method initialization
- Lifecycle callback registration
- Custom initializer code execution

### Phase 5: Testing and Documentation

- Comprehensive test suite
- Documentation updates
- Migration guide for existing modules

## Backward Compatibility

The design maintains full backward compatibility:

- Existing tiger.config.json files continue to work unchanged
- Modules without initialization configuration use the current registration pattern
- Generated registry code includes fallback logic for legacy modules
- No breaking changes to existing APIs or interfaces

## Migration Path

For the specific `LynxjsLinkingModule` case:

1. Update `tiger.config.json` to declare lifecycle callback requirements
2. Regenerate the extension registry using the enhanced gradle plugin
3. The generated code will automatically handle ActivityLifecycleCallbacks registration
4. No changes required to the module implementation itself

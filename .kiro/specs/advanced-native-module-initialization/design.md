# Design Document

## Overview

This design extends the existing Lynx autolink system to support advanced native module initialization patterns through automatic detection of init methods in module classes. The solution eliminates the need for external configuration by allowing modules to handle their own initialization internally, following the pattern suggested by the Lynx maintainers.

The design maintains full backward compatibility while providing a cleaner, more maintainable approach for complex modules like the `LynxjsLinkingModule` that need Application context access and lifecycle callback registration. Modules simply implement an `init(Context)` method and the autolink system automatically detects and calls it during registration.

## Architecture

### Configuration Layer

- **Simplified tiger.config.json**: Minimal configuration with automatic init method detection
- **Class Analysis Engine**: Build-time analysis of module classes to detect init methods
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

### Simplified tiger.config.json Schema

```json
{
  "name": "@lynxjs/linking",
  "version": "1.0.0",
  "platforms": {
    "android": {
      "packageName": "com.modules.linking",
      "sourceDir": "android/src/main"
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

### Module Class Pattern

```kotlin
@LynxNativeModule(name = "LynxjsLinking")
class LynxjsLinkingModule(context: Context) : LynxModule(context) {
    companion object {
        var initialUrl: String? = null
        private var installed = false
        private var callbacks: Application.ActivityLifecycleCallbacks? = null
    }

    override fun init(ctx: Context) {
        if (installed) return
        
        val app = (ctx.applicationContext as? Application)
            ?: throw IllegalArgumentException("Context must be Application or provide applicationContext")
        
        if (callbacks == null) {
            callbacks = object : Application.ActivityLifecycleCallbacks {
                override fun onActivityCreated(activity: Activity, savedInstanceState: Bundle?) {
                    onReceiveURL(activity.intent)
                }
                override fun onActivityResumed(activity: Activity) {
                    onReceiveURL(activity.intent)
                }
                // ... other lifecycle methods
            }
        }
        
        app.unregisterActivityLifecycleCallbacks(callbacks!!)
        app.registerActivityLifecycleCallbacks(callbacks!!)
        installed = true
    }
    
    private fun onReceiveURL(intent: Intent?) {
        try {
            val data: Uri? = intent?.data
            if (data != null) {
                initialUrl = data.toString()
            }
        } catch (e: Exception) {
            // Handle error
        }
    }
}
```

### Init Method Detection

The system automatically detects modules that require advanced initialization by scanning for:

1. **init(Context) method**: Instance method that takes Context parameter
2. **init(Application) method**: Instance method that takes Application parameter  
3. **Inheritance from base classes**: Modules extending classes with init methods
4. **Method overrides**: Modules overriding init methods from parent classes

### Enhanced AutolinkConfig Data Classes

```kotlin
data class AndroidConfig(
    val packageName: String,
    val sourceDir: String = "android/src/main",
    val buildTypes: List<String> = listOf("debug", "release"),
    val language: String = "kotlin"
)

data class NativeModuleInfo(
    val name: String,
    val className: String,
    val hasInitMethod: Boolean = false,
    val initMethodSignature: String? = null,
    val dependencies: List<String> = emptyList()
)

data class ExtensionInfo(
    val config: AutolinkConfig,
    val nativeModules: List<NativeModuleInfo>,
    val elements: List<ElementInfo> = emptyList(),
    val services: List<ServiceInfo> = emptyList()
)
```

### Enhanced Registry Generator

The `RegistryGenerator` will be extended to produce initialization code that calls init methods:

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
        // Create module instance
        val module = LynxjsLinkingModule(application)
        
        // Call init method if it exists
        module.init(application)
        
        // Register the module
        LynxEnv.inst().registerModule("LynxjsLinking", module)
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

1. Remove the separate `LynxjsLinkingActivityListener` class
2. Add an `init(Context)` method to `LynxjsLinkingModule` that handles lifecycle callback registration internally
3. Simplify `tiger.config.json` by removing initialization configuration
4. Regenerate the extension registry using the enhanced gradle plugin
5. The generated code will automatically detect and call the init method

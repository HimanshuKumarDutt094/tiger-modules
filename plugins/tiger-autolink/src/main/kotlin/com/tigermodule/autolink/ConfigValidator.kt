package com.tigermodule.autolink

import org.gradle.api.GradleException
import java.io.File

/**
 * Validates TigerModule extension configuration and provides helpful error messages
 */
class ConfigValidator {
    
    /**
     * Validates an extension package configuration
     * @throws GradleException if validation fails
     */
    fun validateExtension(extension: ExtensionPackage) {
        validateBasicFields(extension)
        
        extension.config.platforms.android?.let { androidConfig ->
            validateAndroidConfig(extension.name, androidConfig)
        }
        
        validateNativeModules(extension)
    }
    
    /**
     * Validates basic required fields
     */
    private fun validateBasicFields(extension: ExtensionPackage) {
        if (extension.name.isBlank()) {
            throw GradleException(
                "Extension has empty name field. " +
                "Ensure 'name' is set in tiger.config.json at ${extension.path}"
            )
        }
        
        if (extension.version.isBlank()) {
            throw GradleException(
                "Extension '${extension.name}' has empty version field. " +
                "Ensure 'version' is set in tiger.config.json"
            )
        }
        
        if (extension.config.platforms.android == null) {
            throw GradleException(
                "Extension '${extension.name}' is missing Android platform configuration. " +
                "Add 'platforms.android' section to tiger.config.json"
            )
        }
    }
    
    /**
     * Validates Android platform configuration
     */
    private fun validateAndroidConfig(extensionName: String, androidConfig: AndroidConfig) {
        // Validate packageName
        if (androidConfig.packageName.isBlank()) {
            throw GradleException(
                "Extension '$extensionName' has empty Android packageName. " +
                "Set 'platforms.android.packageName' in tiger.config.json\n" +
                "Example: \"packageName\": \"com.example.myextension\""
            )
        }
        
        if (!isValidPackageName(androidConfig.packageName)) {
            throw GradleException(
                "Extension '$extensionName' has invalid Android packageName: '${androidConfig.packageName}'\n" +
                "Package name must:\n" +
                "  - Use lowercase letters\n" +
                "  - Contain at least one dot (.)\n" +
                "  - Start with a letter\n" +
                "  - Use only letters, numbers, and underscores\n" +
                "Example: \"com.example.myextension\""
            )
        }
        
        // Validate language
        if (androidConfig.language !in listOf("kotlin", "java")) {
            throw GradleException(
                "Extension '$extensionName' has invalid language: '${androidConfig.language}'\n" +
                "Language must be either 'kotlin' or 'java'\n" +
                "Set 'platforms.android.language' in tiger.config.json"
            )
        }
    }
    
    /**
     * Validates native module configurations
     */
    private fun validateNativeModules(extension: ExtensionPackage) {
        extension.config.nativeModules.forEachIndexed { index, module ->
            validateNativeModule(extension.name, module, index)
        }
    }
    
    /**
     * Validates a single native module configuration
     */
    private fun validateNativeModule(extensionName: String, module: NativeModuleConfig, index: Int) {
        // Validate name field
        if (module.name.isBlank()) {
            throw GradleException(
                "Extension '$extensionName' has a native module at index $index with empty 'name' field.\n" +
                "Each module must have a 'name' field for registration.\n" +
                "Example: {\"name\": \"LocalStorage\", \"className\": \"LocalStorageModule\"}"
            )
        }
        
        // Validate className field
        if (module.className.isBlank()) {
            throw GradleException(
                "Extension '$extensionName' module '${module.name}' has empty 'className' field.\n" +
                "Each module must have a 'className' field specifying the implementation class.\n" +
                "Example: {\"name\": \"LocalStorage\", \"className\": \"LocalStorageModule\"}"
            )
        }
        
        // Validate className follows Java/Kotlin naming conventions
        if (!isValidClassName(module.className)) {
            throw GradleException(
                "Extension '$extensionName' module '${module.name}' has invalid className: '${module.className}'\n" +
                "Class name must:\n" +
                "  - Start with an uppercase letter\n" +
                "  - Use only letters, numbers, and underscores\n" +
                "  - Follow Java/Kotlin naming conventions\n" +
                "Example: \"LocalStorageModule\" or \"CameraModule\""
            )
        }
        

    }
    
    /**
     * Validates source files exist for modules
     */
    fun validateSourceFiles(extension: ExtensionPackage): List<ValidationWarning> {
        val warnings = mutableListOf<ValidationWarning>()
        val androidConfig = extension.config.platforms.android ?: return warnings
        
        val packageDir = File(extension.path)
        val sourceDir = File(packageDir, androidConfig.sourceDir)
        
        if (!sourceDir.exists()) {
            warnings.add(
                ValidationWarning(
                    extension.name,
                    null,
                    "Source directory not found: ${sourceDir.absolutePath}\n" +
                    "   Expected directory: ${androidConfig.sourceDir}"
                )
            )
            return warnings
        }
        
        extension.config.nativeModules.forEach { module ->
            val moduleWarning = validateModuleSourceFile(
                extension.name,
                packageDir,
                androidConfig,
                module
            )
            if (moduleWarning != null) {
                warnings.add(moduleWarning)
            }
        }
        
        return warnings
    }
    
    /**
     * Validates that a module's source file exists
     */
    private fun validateModuleSourceFile(
        extensionName: String,
        packageDir: File,
        androidConfig: AndroidConfig,
        module: NativeModuleConfig
    ): ValidationWarning? {
        val sourceDir = File(packageDir, androidConfig.sourceDir)
        val packagePath = androidConfig.packageName.replace('.', '/')
        
        // Check for Kotlin file
        val kotlinFile = File(sourceDir, "kotlin/$packagePath/${module.className}.kt")
        
        // Check for Java file
        val javaFile = File(sourceDir, "java/$packagePath/${module.className}.java")
        
        val exists = kotlinFile.exists() || javaFile.exists()
        
        if (!exists) {
            val platformLanguage = androidConfig.language
            val expectedExtension = if (platformLanguage == "java") "java" else "kt"
            val expectedDir = if (platformLanguage == "java") "java" else "kotlin"
            val expectedFile = File(sourceDir, "$expectedDir/$packagePath/${module.className}.$expectedExtension")
            
            return ValidationWarning(
                extensionName,
                module.name,
                "Module class '${module.className}' not found in source directory\n" +
                "   Expected: ${expectedFile.absolutePath}\n" +
                "   Also checked: ${if (platformLanguage == "java") kotlinFile.absolutePath else javaFile.absolutePath}\n" +
                "   Make sure the class file exists and the package structure matches the packageName"
            )
        }
        
        return null
    }
    
    /**
     * Validates a Java package name follows naming conventions
     */
    private fun isValidPackageName(packageName: String): Boolean {
        // Must contain at least one dot
        if (!packageName.contains('.')) {
            return false
        }
        
        // Each segment must be a valid identifier
        val segments = packageName.split('.')
        return segments.all { segment ->
            segment.isNotEmpty() &&
            segment[0].isLowerCase() &&
            segment.all { it.isLetterOrDigit() || it == '_' }
        }
    }
    
    /**
     * Validates a Java/Kotlin class name follows naming conventions
     */
    private fun isValidClassName(className: String): Boolean {
        if (className.isEmpty()) {
            return false
        }
        
        // Must start with uppercase letter
        if (!className[0].isUpperCase()) {
            return false
        }
        
        // Must contain only letters, numbers, and underscores
        return className.all { it.isLetterOrDigit() || it == '_' }
    }
}

/**
 * Represents a validation warning (non-fatal)
 */
data class ValidationWarning(
    val extensionName: String,
    val moduleName: String?,
    val message: String
)

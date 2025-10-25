package com.tigermodule.autolink

import java.io.File
import java.security.MessageDigest

/**
 * Generates ExtensionRegistry.kt for Android
 */
class RegistryGenerator {
    
    private val validator = ConfigValidator()
    
    /**
     * Generates a hash of the extension configurations to detect changes
     * Uses raw config file content for reliable change detection
     */
    private fun generateExtensionsHash(extensions: List<ExtensionPackage>): String {
        val content = extensions.sortedBy { it.name }.joinToString("\n") { ext ->
            // Read the raw tiger.config.json content for hashing
            val configContent = try {
                val configFile = findTigerConfigFile(File(ext.path))
                if (configFile?.exists() == true) {
                    configFile.readText().trim()
                } else {
                    "${ext.name}:${ext.version}:no-config"
                }
            } catch (e: Exception) {
                "${ext.name}:${ext.version}:error-reading-config"
            }
            
            "${ext.name}:${ext.version}:$configContent"
        }
        
        val digest = MessageDigest.getInstance("SHA-256")
        val hashBytes = digest.digest(content.toByteArray())
        return hashBytes.joinToString("") { "%02x".format(it) }
    }
    
    /**
     * Finds the tiger.config.json file (prefers dist/ over root)
     */
    private fun findTigerConfigFile(packageDir: File): File? {
        val distConfig = File(packageDir, "dist/tiger.config.json")
        val rootConfig = File(packageDir, "tiger.config.json")
        
        return when {
            distConfig.exists() -> distConfig
            rootConfig.exists() -> rootConfig
            else -> null
        }
    }
    
    /**
     * Reads the stored hash from the registry file header comment
     */
    private fun readStoredHash(registryFile: File): String? {
        if (!registryFile.exists()) return null
        
        return try {
            registryFile.readLines()
                .find { it.contains("Content-Hash:") }
                ?.substringAfter("Content-Hash:")
                ?.trim()
        } catch (e: Exception) {
            null
        }
    }
    
    /**
     * Checks if registry needs regeneration based on content hash
     */
    private fun shouldRegenerateRegistry(extensions: List<ExtensionPackage>, registryFile: File): Boolean {
        if (!registryFile.exists()) {
            println("   📝 Registry file doesn't exist, generating...")
            return true
        }
        
        val currentHash = generateExtensionsHash(extensions)
        val storedHash = readStoredHash(registryFile)
        
        if (storedHash == null) {
            println("   📝 No hash found in existing registry, regenerating...")
            return true
        }
        
        if (currentHash != storedHash) {
            println("   📝 Extension configurations changed, regenerating...")
            return true
        }
        
        println("   ✅ Registry is up-to-date, skipping generation")
        return false
    }
    
    /**
     * Generates the ExtensionRegistry.kt file
     */
    fun generateAndroidRegistry(
        extensions: List<ExtensionPackage>,
        outputDir: File,
        packageName: String = "com.tigermodule.autolink.generated"
    ) {
        if (extensions.isEmpty()) {
            println("ℹ️  No extensions to register, skipping registry generation")
            return
        }
        
        // Validate all extensions before generating
        try {
            extensions.forEach { ext ->
                validator.validateExtension(ext)
            }
        } catch (e: Exception) {
            throw Exception(
                "Cannot generate registry due to validation errors.\n" +
                "Fix the configuration errors above and try again.\n" +
                "Original error: ${e.message}"
            )
        }
        
        // Ensure output directory exists
        outputDir.mkdirs()
        
        // Check if regeneration is needed
        val registryFile = File(outputDir, "ExtensionRegistry.kt")
        if (!shouldRegenerateRegistry(extensions, registryFile)) {
            return
        }
        
        // Generate content hash for the current extensions
        val currentHash = generateExtensionsHash(extensions)
        
        // Generate the registry code
        val registryCode = buildString {
            appendLine("package $packageName")
            appendLine()
            appendLine("import android.content.Context")
            appendLine("import android.app.Application")
            appendLine("import com.lynx.tasm.LynxEnv")
            appendLine("import com.lynx.tasm.behavior.Behavior")
            appendLine("import com.lynx.tasm.behavior.LynxContext")
            appendLine()
            
            // Import statements for discovered modules
            extensions.forEach { ext ->
                val androidConfig = ext.config.platforms.android ?: return@forEach
                
                if (ext.config.nativeModules.isNotEmpty()) {
                    appendLine("// Native Modules from ${ext.name}")
                    ext.config.nativeModules.forEach { moduleConfig ->
                        appendLine("import ${androidConfig.packageName}.${moduleConfig.className}")
                    }
                }
                
                if (ext.config.elements.isNotEmpty()) {
                    appendLine("// Elements from ${ext.name}")
                    ext.config.elements.forEach { elementConfig ->
                        appendLine("import ${androidConfig.packageName}.${elementConfig.name}")
                    }
                }
                
                if (ext.config.services.isNotEmpty()) {
                    appendLine("// Services from ${ext.name}")
                    ext.config.services.forEach { serviceName ->
                        appendLine("import ${androidConfig.packageName}.${serviceName}")
                    }
                }
                
                appendLine()
            }
            
            appendLine("/**")
            appendLine(" * Auto-generated registry for TigerModule extensions")
            appendLine(" * Generated by TigerModule Autolink Gradle Plugin v${BuildConfig.VERSION}")
            appendLine(" * Content-Hash: $currentHash")
            appendLine(" * ")
            appendLine(" * This file is automatically generated. Do not edit manually.")
            appendLine(" * ")
            appendLine(" * Discovered extensions:")
            extensions.forEach { ext ->
                appendLine(" *   - ${ext.name}@${ext.version}")
            }
            appendLine(" */")
            appendLine("object ExtensionRegistry {")
            appendLine()
            appendLine("    /**")
            appendLine("     * Registers all discovered TigerModule extensions with the application")
            appendLine("     * Call this method in your Application.onCreate() or Activity.onCreate()")
            appendLine("     * ")
            appendLine("     * @param context Android application context")
            appendLine("     */")
            appendLine("    fun setupGlobal(context: Context) {")
            
            appendLine("        // Register native modules discovered via @LynxNativeModule annotation")
            
            val hasModules = extensions.any { it.config.nativeModules.isNotEmpty() }
            if (hasModules) {
                extensions.forEach { ext ->
                    val androidConfig = ext.config.platforms.android ?: return@forEach
                    ext.config.nativeModules.forEach { moduleConfig ->
                        appendLine("        // From ${ext.name}: ${androidConfig.packageName}.${moduleConfig.className}")
                        appendLine("        // Discovered via @LynxNativeModule(name = \"${moduleConfig.name}\")")
                        appendLine("        try {")
                        appendLine("            LynxEnv.inst().registerModule(\"${moduleConfig.name}\", ${moduleConfig.className}::class.java)")
                        appendLine("            android.util.Log.d(\"ExtensionRegistry\", \"Registered module: ${moduleConfig.name}\")")
                        appendLine("        } catch (e: Exception) {")
                        appendLine("            android.util.Log.e(\"ExtensionRegistry\", \"Failed to register module ${moduleConfig.name}: \${e.message}\")")
                        appendLine("        }")
                    }
                }
            } else {
                appendLine("        // No native modules discovered")
            }
            
            appendLine()
            appendLine("        // Register custom elements discovered via @LynxElement annotation")
            
            val hasElements = extensions.any { it.config.elements.isNotEmpty() }
            if (hasElements) {
                extensions.forEach { ext ->
                    ext.config.elements.forEach { elementConfig ->
                        // Convert PascalCase to kebab-case for tag name (ExplorerInput -> explorer-input)
                        val tagName = elementConfig.name.replace(Regex("([a-z])([A-Z])"), "$1-$2").lowercase()
                        appendLine("        // Discovered via @LynxElement(name = \"${elementConfig.name}\")")
                        appendLine("        try {")
                        appendLine("            LynxEnv.inst().addBehavior(object : Behavior(\"${tagName}\") {")
                        appendLine("                override fun createUI(context: LynxContext): ${elementConfig.name} {")
                        appendLine("                    return ${elementConfig.name}(context)")
                        appendLine("                }")
                        appendLine("            })")
                        appendLine("            android.util.Log.d(\"ExtensionRegistry\", \"Registered element: ${elementConfig.name} as tag '${tagName}'\")")
                        appendLine("        } catch (e: Exception) {")
                        appendLine("            android.util.Log.e(\"ExtensionRegistry\", \"Failed to register element ${elementConfig.name}: \${e.message}\")")
                        appendLine("        }")
                    }
                }
            } else {
                appendLine("        // No custom elements discovered")
            }
            
            appendLine()
            appendLine("        // Register services discovered via @LynxService annotation")
            
            val hasServices = extensions.any { it.config.services.isNotEmpty() }
            if (hasServices) {
                extensions.forEach { ext ->
                    ext.config.services.forEach { serviceName ->
                        appendLine("        // Discovered via @LynxService annotation")
                        appendLine("        try {")
                        appendLine("            ${serviceName}.initialize() // Call service initialization if available")
                        appendLine("            android.util.Log.d(\"ExtensionRegistry\", \"Initialized service: ${serviceName}\")")
                        appendLine("        } catch (e: Exception) {")
                        appendLine("            android.util.Log.e(\"ExtensionRegistry\", \"Failed to initialize service ${serviceName}: \${e.message}\")")
                        appendLine("        }")
                    }
                }
            } else {
                appendLine("        // No services discovered")
            }
            
            appendLine("    }")
            appendLine("}")
        }
        
        // Write registry file
        registryFile.writeText(registryCode)
        
        println("✅ Generated ExtensionRegistry.kt")
        println("   📁 ${registryFile.absolutePath}")
        println("   🔍 Content hash: ${currentHash.take(8)}...")
    }
}
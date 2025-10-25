package com.tigermodule.autolink

import com.google.gson.Gson
import com.google.gson.JsonSyntaxException
import java.io.File

/**
 * Discovers TigerModule extensions in node_modules
 */
class ExtensionDiscovery(private val projectRoot: File) {
    
    private val gson = createAutolinkGson()
    private val validator = ConfigValidator()
    private val classAnalyzer = ClassAnalyzer()
    
    /**
     * Discovers all TigerModule extensions in node_modules
     */
    fun discoverExtensions(): List<ExtensionPackage> {
        val nodeModules = File(projectRoot, "node_modules")
        
        if (!nodeModules.exists() || !nodeModules.isDirectory) {
            println("⚠️  Warning: node_modules directory not found at ${nodeModules.absolutePath}")
            println("   Run 'npm install' first to install dependencies")
            return emptyList()
        }
        
        val extensions = mutableListOf<ExtensionPackage>()
        
        // Scan node_modules for packages with tiger.ext.json (root or dist/)
        scanDirectory(nodeModules, extensions, 0)
        
        if (extensions.isNotEmpty()) {
            println("✅ Discovered ${extensions.size} TigerModule extension(s):")
            extensions.forEach { ext ->
                println("   📦 ${ext.name}@${ext.version}")
            }
            
            // Analyze modules for init methods
            val enhancedExtensions = analyzeInitMethods(extensions)
            
            // Validate all discovered extensions
            validateExtensions(enhancedExtensions)
            
            return enhancedExtensions
        } else {
            println("ℹ️  No TigerModule extensions found in node_modules")
        }
        
        return extensions
    }
    
    /**
     * Analyzes extensions for init methods and enhances module configurations
     */
    private fun analyzeInitMethods(extensions: List<ExtensionPackage>): List<ExtensionPackage> {
        println()
        println("🔍 Analyzing modules for init methods...")
        
        return extensions.map { extension ->
            val analysisResults = classAnalyzer.analyzeExtensionModules(extension)
            
            if (analysisResults.isNotEmpty()) {
                // Update module configurations with init method information
                val enhancedModules = extension.config.nativeModules.map { moduleConfig ->
                    val analysisResult = analysisResults.find { it.moduleName == moduleConfig.name }
                    
                    if (analysisResult != null && analysisResult.initMethodInfo.hasInitMethod) {
                        println("   ✅ ${extension.name}: ${moduleConfig.name} has init method")
                        if (analysisResult.initMethodInfo.signature != null) {
                            println("      Signature: ${analysisResult.initMethodInfo.signature}")
                        }
                        
                        moduleConfig.copy(
                            hasInitMethod = true,
                            initMethodSignature = analysisResult.initMethodInfo.signature
                        )
                    } else {
                        if (analysisResult?.initMethodInfo?.error != null) {
                            println("   ⚠️  ${extension.name}: ${moduleConfig.name} - ${analysisResult.initMethodInfo.error}")
                        }
                        moduleConfig
                    }
                }
                
                // Create enhanced extension with updated module configurations
                extension.copy(
                    config = extension.config.copy(nativeModules = enhancedModules)
                )
            } else {
                extension
            }
        }
    }
    
    /**
     * Validates all discovered extensions
     */
    private fun validateExtensions(extensions: List<ExtensionPackage>) {
        println()
        println("🔍 Validating extension configurations...")
        
        var hasErrors = false
        
        extensions.forEach { ext ->
            try {
                // Validate configuration
                validator.validateExtension(ext)
                
                // Validate source files (warnings only)
                val warnings = validator.validateSourceFiles(ext)
                if (warnings.isNotEmpty()) {
                    warnings.forEach { warning ->
                        println()
                        println("⚠️  Warning in ${warning.extensionName}:")
                        if (warning.moduleName != null) {
                            println("   Module: ${warning.moduleName}")
                        }
                        println("   ${warning.message}")
                    }
                }
            } catch (e: Exception) {
                hasErrors = true
                println()
                println("❌ Validation failed for ${ext.name}:")
                println("   ${e.message}")
            }
        }
        
        if (!hasErrors) {
            println("✅ All extensions validated successfully")
        }
        println()
    }
    
    /**
     * Recursively scans directory for extension packages
     */
    private fun scanDirectory(dir: File, extensions: MutableList<ExtensionPackage>, depth: Int) {
        // Limit recursion depth to avoid performance issues
        if (depth > 3) return
        
        // Skip nested node_modules to avoid deep recursion
        if (dir.name == "node_modules" && dir.parentFile?.name == "node_modules") {
            return
        }
        
        // Look for tiger.config.json in both root and dist/ directories
        // Prefer dist/tiger.config.json (compiled from TS/JS configs) over root tiger.config.json
        val distTigerConfigJson = File(dir, "dist/tiger.config.json")
        val rootTigerConfigJson = File(dir, "tiger.config.json")
        
        val tigerConfigJson = when {
            distTigerConfigJson.exists() -> distTigerConfigJson
            rootTigerConfigJson.exists() -> rootTigerConfigJson
            else -> null
        }
        
        if (tigerConfigJson != null) {
            // Found an extension package
            val configSource = if (tigerConfigJson.name == "tiger.config.json" && tigerConfigJson.parentFile.name == "dist") {
                "compiled config"
            } else {
                "JSON config"
            }
            parseExtension(dir, tigerConfigJson, configSource)?.let { extensions.add(it) }
        } else {
            // Continue scanning subdirectories
            dir.listFiles()?.forEach { child ->
                if (child.isDirectory && !child.name.startsWith(".")) {
                    scanDirectory(child, extensions, depth + 1)
                }
            }
        }
    }
    
    /**
     * Parses an extension package from its directory
     */
    private fun parseExtension(packageDir: File, configFile: File, @Suppress("UNUSED_PARAMETER") configSource: String = "config"): ExtensionPackage? {
        return try {
            val configJson = configFile.readText()
            val config = gson.fromJson(configJson, AutolinkConfig::class.java)
            
            // Check for missing required fields
            if (config.name.isBlank()) {
                println("   ❌ Error in ${packageDir.name}: tiger.config.json is missing 'name' field")
                println("      Add a 'name' field to tiger.config.json")
                return null
            }
            
            if (config.version.isBlank()) {
                println("   ❌ Error in ${config.name}: tiger.config.json is missing 'version' field")
                println("      Add a 'version' field to tiger.config.json")
                return null
            }
            
            // Validate that Android platform is configured
            if (config.platforms.android == null) {
                println("   ⚠️  Skipping ${config.name}: No Android platform support")
                println("      Add 'platforms.android' section to tiger.config.json if you want Android support")
                return null
            }
            
            ExtensionPackage(
                name = config.name,
                version = config.version,
                path = packageDir.absolutePath,
                config = config
            )
        } catch (e: JsonSyntaxException) {
            println("   ❌ Error parsing tiger.config.json in ${packageDir.name}:")
            println("      Invalid JSON syntax: ${e.message}")
            println("      Check that tiger.config.json is valid JSON")
            null
        } catch (e: NullPointerException) {
            println("   ❌ Error processing extension in ${packageDir.name}:")
            println("      Missing required field in tiger.config.json")
            println("      Ensure 'name', 'version', and 'platforms' fields are present")
            null
        } catch (e: Exception) {
            println("   ❌ Error processing extension in ${packageDir.name}:")
            println("      ${e.message}")
            null
        }
    }
}

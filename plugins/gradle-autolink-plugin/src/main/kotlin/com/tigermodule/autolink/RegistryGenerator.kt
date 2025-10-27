package com.tigermodule.autolink

import com.squareup.kotlinpoet.*
import java.io.File
import java.security.MessageDigest

/**
 * Generates ExtensionRegistry.kt for Android using KotlinPoet for type-safe code generation
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
     * Generates the ExtensionRegistry.kt file using KotlinPoet
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
        
        // Build the setupGlobal function using KotlinPoet
        val setupGlobalFunction = buildSetupGlobalFunction(extensions)
        
        // Build the ExtensionRegistry object
        val registryObject = TypeSpec.objectBuilder("ExtensionRegistry")
            .addKdoc(buildKdoc(extensions, currentHash))
            .addFunction(setupGlobalFunction)
            .build()
        
        // Build the file with all necessary imports
        val fileSpec = buildFileSpec(packageName, registryObject, extensions)
        
        // Write to file
        fileSpec.writeTo(outputDir)
        
        println("✅ Generated ExtensionRegistry.kt using KotlinPoet")
        println("   📁 ${File(outputDir, "$packageName/ExtensionRegistry.kt".replace('.', '/')).absolutePath}")
        println("   🔍 Content hash: ${currentHash.take(8)}...")
    }
    
    /**
     * Builds the KDoc for the ExtensionRegistry object
     */
    private fun buildKdoc(extensions: List<ExtensionPackage>, currentHash: String): CodeBlock {
        return buildCodeBlock {
            add("Auto-generated registry for TigerModule extensions\n")
            add("Generated by TigerModule Autolink Gradle Plugin v%L\n", BuildConfig.VERSION)
            add("Content-Hash: %L\n", currentHash)
            add("\n")
            add("This file is automatically generated. Do not edit manually.\n")
            add("\n")
            add("Discovered extensions:\n")
            extensions.forEach { ext ->
                add("  - %L@%L\n", ext.name, ext.version)
            }
        }
    }
    
    /**
     * Builds the setupGlobal function
     */
    private fun buildSetupGlobalFunction(extensions: List<ExtensionPackage>): FunSpec {
        val contextClassName = ClassName("android.content", "Context")
        
        return FunSpec.builder("setupGlobal")
            .addKdoc(
                """
                Registers all discovered TigerModule extensions with the application
                Call this method in your Application.onCreate() or Activity.onCreate()
                
                @param context Android application context
                """.trimIndent()
            )
            .addParameter("context", contextClassName)
            .addCode(buildSetupGlobalCode(extensions))
            .build()
    }
    
    /**
     * Builds the code block for setupGlobal function
     */
    private fun buildSetupGlobalCode(extensions: List<ExtensionPackage>): CodeBlock {
        return buildCodeBlock {
            // Register native modules
            addStatement("// Register native modules discovered via @LynxNativeModule annotation")
            
            val hasModules = extensions.any { it.config.nativeModules.isNotEmpty() }
            if (hasModules) {
                extensions.forEach { ext ->
                    val androidConfig = ext.config.platforms.android ?: return@forEach
                    ext.config.nativeModules.forEach { moduleConfig ->
                        val moduleClassName = ClassName(androidConfig.packageName, moduleConfig.className)
                        
                        addStatement("// From %L: %L", ext.name, "$androidConfig.packageName.${moduleConfig.className}")
                        addStatement("// Discovered via @LynxNativeModule(name = %S)", moduleConfig.name)
                        beginControlFlow("try")
                        addStatement(
                            "%T.inst().registerModule(%S, %T::class.java)",
                            ClassName("com.lynx.tasm", "LynxEnv"),
                            moduleConfig.name,
                            moduleClassName
                        )
                        addStatement(
                            "%T.d(%S, %S)",
                            ClassName("android.util", "Log"),
                            "ExtensionRegistry",
                            "Registered module: ${moduleConfig.name}"
                        )
                        nextControlFlow("catch (e: %T)", ClassName("kotlin", "Exception"))
                        addStatement(
                            "%T.e(%S, %S + e.message)",
                            ClassName("android.util", "Log"),
                            "ExtensionRegistry",
                            "Failed to register module ${moduleConfig.name}: "
                        )
                        endControlFlow()
                    }
                }
            } else {
                addStatement("// No native modules discovered")
            }
            
            addStatement("")
            addStatement("// Register custom elements discovered via @LynxElement annotation")
            
            val hasElements = extensions.any { it.config.elements.isNotEmpty() }
            if (hasElements) {
                // Scan for actual annotation values to get the correct tag names
                val annotationScanner = AnnotationScanner()
                val allDiscoveries = annotationScanner.scanExtensionPackages(extensions)
                
                extensions.forEach { ext ->
                    val androidConfig = ext.config.platforms.android ?: return@forEach
                    val discoveries = allDiscoveries[ext.name] ?: emptyList()
                    
                    ext.config.elements.forEach { elementConfig ->
                        val elementClassName = ClassName(androidConfig.packageName, elementConfig.name)
                        
                        // Try to find the actual annotation name from scanning
                        val discovery = discoveries.find { 
                            it.className == elementConfig.name && it.type == AnnotationScanner.Type.ELEMENT 
                        }
                        
                        val tagName = discovery?.annotationName ?: run {
                            // Fallback to kebab-case conversion if annotation scanning fails
                            val fallbackName = elementConfig.name.replace(Regex("([a-z])([A-Z])"), "$1-$2").lowercase()
                            println("        ⚠️  Could not find @LynxElement annotation for ${elementConfig.name}, using fallback: $fallbackName")
                            fallbackName
                        }
                        
                        addStatement("// Discovered via @LynxElement(name = %S)", tagName)
                        beginControlFlow("try")
                        
                        // Create anonymous Behavior object
                        val behaviorType = TypeSpec.anonymousClassBuilder()
                            .superclass(ClassName("com.lynx.tasm.behavior", "Behavior"))
                            .addSuperclassConstructorParameter("%S", tagName)
                            .addFunction(
                                FunSpec.builder("createUI")
                                    .addModifiers(KModifier.OVERRIDE)
                                    .addParameter("context", ClassName("com.lynx.tasm.behavior", "LynxContext"))
                                    .returns(elementClassName)
                                    .addStatement("return %T(context)", elementClassName)
                                    .build()
                            )
                            .build()
                        
                        addStatement(
                            "%T.inst().addBehavior(%L)",
                            ClassName("com.lynx.tasm", "LynxEnv"),
                            behaviorType
                        )
                        addStatement(
                            "%T.d(%S, %S)",
                            ClassName("android.util", "Log"),
                            "ExtensionRegistry",
                            "Registered element: ${elementConfig.name} as tag '$tagName'"
                        )
                        nextControlFlow("catch (e: %T)", ClassName("kotlin", "Exception"))
                        addStatement(
                            "%T.e(%S, %S + e.message)",
                            ClassName("android.util", "Log"),
                            "ExtensionRegistry",
                            "Failed to register element ${elementConfig.name}: "
                        )
                        endControlFlow()
                    }
                }
            } else {
                addStatement("// No custom elements discovered")
            }
            
            addStatement("")
            addStatement("// Register services discovered via @LynxService annotation")
            
            val hasServices = extensions.any { it.config.services.isNotEmpty() }
            if (hasServices) {
                extensions.forEach { ext ->
                    val androidConfig = ext.config.platforms.android ?: return@forEach
                    ext.config.services.forEach { serviceName ->
                        val serviceClassName = ClassName(androidConfig.packageName, serviceName)
                        
                        addStatement("// Discovered via @LynxService annotation")
                        beginControlFlow("try")
                        addStatement(
                            "%T.initialize() // Call service initialization if available",
                            serviceClassName
                        )
                        addStatement(
                            "%T.d(%S, %S)",
                            ClassName("android.util", "Log"),
                            "ExtensionRegistry",
                            "Initialized service: $serviceName"
                        )
                        nextControlFlow("catch (e: %T)", ClassName("kotlin", "Exception"))
                        addStatement(
                            "%T.e(%S, %S + e.message)",
                            ClassName("android.util", "Log"),
                            "ExtensionRegistry",
                            "Failed to initialize service $serviceName: "
                        )
                        endControlFlow()
                    }
                }
            } else {
                addStatement("// No services discovered")
            }
        }
    }
    
    /**
     * Builds the FileSpec with all necessary imports
     */
    private fun buildFileSpec(
        packageName: String,
        registryObject: TypeSpec,
        extensions: List<ExtensionPackage>
    ): FileSpec {
        val fileBuilder = FileSpec.builder(packageName, "ExtensionRegistry")
            .addType(registryObject)
        
        // Add imports for all extension classes
        extensions.forEach { ext ->
            val androidConfig = ext.config.platforms.android ?: return@forEach
            
            // Import native modules
            ext.config.nativeModules.forEach { moduleConfig ->
                fileBuilder.addImport(androidConfig.packageName, moduleConfig.className)
            }
            
            // Import elements
            ext.config.elements.forEach { elementConfig ->
                fileBuilder.addImport(androidConfig.packageName, elementConfig.name)
            }
            
            // Import services
            ext.config.services.forEach { serviceName ->
                fileBuilder.addImport(androidConfig.packageName, serviceName)
            }
        }
        
        return fileBuilder.build()
    }
}
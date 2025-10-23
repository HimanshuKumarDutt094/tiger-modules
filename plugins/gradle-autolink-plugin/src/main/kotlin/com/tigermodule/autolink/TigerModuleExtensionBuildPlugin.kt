package com.tigermodule.autolink

import org.gradle.api.Plugin
import org.gradle.api.Project
import java.io.File

/**
 * Gradle Build plugin for TigerModule extension integration
 * Applied in build.gradle.kts to generate registry and configure dependencies
 * 
 * Usage in build.gradle.kts:
 * ```
 * plugins {
 *     id("com.tigermodule.extension-build") version "0.0.1"
 * }
 * ```
 */
class TigerModuleExtensionBuildPlugin : Plugin<Project> {
    
    override fun apply(project: Project) {
        println("🔌 TigerModule Extension Build Plugin v${BuildConfig.VERSION}")
        println("   Project: ${project.name}")
        
        // Get discovered extensions from settings plugin
        @Suppress("UNCHECKED_CAST")
        val extensions = try {
            project.rootProject.extensions.extraProperties.get("tigerModuleExtensions") as? List<ExtensionPackage>
        } catch (e: Exception) {
            println("   ⚠️  Warning: Could not retrieve tigerModuleExtensions")
            println("   Make sure TigerModuleExtensionSettingsPlugin is applied in settings.gradle.kts")
            null
        } ?: emptyList()
        
        if (extensions.isEmpty()) {
            println("   ℹ️  No TigerModule extensions found")
            println()
            return
        }
        
        println("   Found ${extensions.size} extension(s)")
        println()
        
        // Register task to copy extension source files
        val copyExtensionSourcesTask = project.tasks.register("copyTigerModuleExtensionSources") {
            group = "tigermodule"
            description = "Copies native source files from TigerModule extensions"
            
            doLast {
                println("📦 Copying extension source files...")
                
                extensions.forEach { ext ->
                    val androidConfig = ext.config.platforms.android ?: return@forEach
                    
                    // Source: extension's android directory
                    val extensionAndroidDir = File(ext.path, androidConfig.sourceDir)
                    
                    if (!extensionAndroidDir.exists()) {
                        println("   ⚠️  Source directory not found: ${extensionAndroidDir.absolutePath}")
                        return@forEach
                    }
                    
                    // Destination: app's generated sources
                    val packagePath = androidConfig.packageName.replace('.', '/')
                    val destDir = File(
                        project.layout.buildDirectory.get().asFile,
                        "generated/source/tigermodule-extensions/main/java/$packagePath"
                    )
                    
                    destDir.mkdirs()
                    
                    // Copy Kotlin/Java files from the package directory
                    // Check both java/ and kotlin/ directories
                    val javaPackageDir = File(extensionAndroidDir, "java/$packagePath")
                    val kotlinPackageDir = File(extensionAndroidDir, "kotlin/$packagePath")
                    
                    var filesCopied = false
                    
                    // Copy from java/ directory if it exists
                    if (javaPackageDir.exists()) {
                        javaPackageDir.walkTopDown()
                            .filter { it.isFile && (it.extension == "kt" || it.extension == "java") }
                            .forEach { sourceFile ->
                                val destFile = File(destDir, sourceFile.name)
                                destFile.parentFile.mkdirs()
                                sourceFile.copyTo(destFile, overwrite = true)
                                println("   ✓ Copied: ${sourceFile.name}")
                                filesCopied = true
                            }
                    }
                    
                    // Copy from kotlin/ directory if it exists
                    if (kotlinPackageDir.exists()) {
                        kotlinPackageDir.walkTopDown()
                            .filter { it.isFile && (it.extension == "kt" || it.extension == "java") }
                            .forEach { sourceFile ->
                                val destFile = File(destDir, sourceFile.name)
                                destFile.parentFile.mkdirs()
                                sourceFile.copyTo(destFile, overwrite = true)
                                println("   ✓ Copied: ${sourceFile.name}")
                                filesCopied = true
                            }
                    }
                    
                    if (!filesCopied) {
                        println("   ⚠️  No source files found in:")
                        println("      ${javaPackageDir.absolutePath}")
                        println("      ${kotlinPackageDir.absolutePath}")
                    }
                }
                
                println()
            }
        }
        
        // Register task to generate extension registry
        val generateRegistryTask = project.tasks.register("generateTigerModuleExtensionRegistry") {
            group = "tigermodule"
            description = "Generates ExtensionRegistry.kt for discovered TigerModule extensions"
            
            dependsOn(copyExtensionSourcesTask)
            
            doLast {
                println("🔨 Generating TigerModule Extension Registry...")
                
                try {
                    val outputDir = File(
                        project.layout.buildDirectory.get().asFile,
                        "generated/source/tigermodule/main/kotlin/com/tigermodule/autolink/generated"
                    )
                    
                    val generator = RegistryGenerator()
                    generator.generateAndroidRegistry(
                        extensions = extensions,
                        outputDir = outputDir,
                        packageName = "com.tigermodule.autolink.generated"
                    )
                } catch (e: Exception) {
                    println()
                    println("❌ Failed to generate extension registry:")
                    println("   ${e.message}")
                    println()
                    throw e
                }
                
                println()
            }
        }
        
        // Hook into Android build lifecycle if Android plugin is applied
        project.afterEvaluate {
            // Try to find Android application or library plugin
            val androidExtension = project.extensions.findByName("android")
            
            if (androidExtension != null) {
                println("   ✅ Android plugin detected")
                
                // Hook into preBuild task
                project.tasks.findByName("preBuild")?.dependsOn(generateRegistryTask)
                
                // Add generated source directories to Android sourceSet
                try {
                    val generatedSourceDir = File(
                        project.layout.buildDirectory.get().asFile,
                        "generated/source/tigermodule/main/kotlin"
                    )
                    
                    val extensionSourceDir = File(
                        project.layout.buildDirectory.get().asFile,
                        "generated/source/tigermodule-extensions/main/java"
                    )
                    
                    // Add to Android source sets using reflection (works with both AGP 7.x and 8.x)
                    try {
                        val sourceSetsMethod = androidExtension.javaClass.getMethod("getSourceSets")
                        val sourceSets = sourceSetsMethod.invoke(androidExtension)
                        val mainSourceSet = sourceSets.javaClass.getMethod("getByName", String::class.java)
                            .invoke(sourceSets, "main")
                        
                        val javaMethod = mainSourceSet.javaClass.getMethod("getJava")
                        val javaSourceSet = javaMethod.invoke(mainSourceSet)
                        
                        val srcDirMethod = javaSourceSet.javaClass.getMethod("srcDir", Any::class.java)
                        srcDirMethod.invoke(javaSourceSet, generatedSourceDir)
                        srcDirMethod.invoke(javaSourceSet, extensionSourceDir)
                        
                        println("   ✅ Added generated sources to Android source sets")
                    } catch (e: Exception) {
                        println("   ⚠️  Could not add to source sets (will try alternative method): ${e.message}")
                    }
                    
                    println("   📁 Generated sources will be at: ${generatedSourceDir.absolutePath}")
                    println("   📁 Extension sources will be at: ${extensionSourceDir.absolutePath}")
                } catch (e: Exception) {
                    println("   ⚠️  Could not configure source sets: ${e.message}")
                }
            } else {
                println("   ⚠️  Android plugin not detected")
                println("   Registry will be generated but not integrated into build")
            }
            
            println()
        }
        
        // Create a task to list discovered extensions
        project.tasks.register("listTigerModuleExtensions") {
            group = "tigermodule"
            description = "Lists all discovered TigerModule extensions"
            
            doLast {
                println()
                println("=" .repeat(60))
                println("Discovered TigerModule Extensions")
                println("=" .repeat(60))
                
                if (extensions.isEmpty()) {
                    println("No extensions found")
                } else {
                    extensions.forEach { ext ->
                        println()
                        println("📦 ${ext.name}@${ext.version}")
                        println("   Path: ${ext.path}")
                        
                        ext.config.platforms.android?.let { android ->
                            println("   Android:")
                            println("     Package: ${android.packageName}")
                            println("     Source: ${android.sourceDir}")
                            println("     Build Types: ${android.buildTypes.joinToString(", ")}")
                        }
                        
                        if (ext.config.nativeModules.isNotEmpty()) {
                            println("   Native Modules:")
                            ext.config.nativeModules.forEach { module ->
                                println("     - $module")
                            }
                        }
                        
                        if (ext.config.elements.isNotEmpty()) {
                            println("   Elements:")
                            ext.config.elements.forEach { element ->
                                println("     - $element")
                            }
                        }
                        
                        if (ext.config.services.isNotEmpty()) {
                            println("   Services:")
                            ext.config.services.forEach { service ->
                                println("     - $service")
                            }
                        }
                    }
                }
                
                println()
                println("=" .repeat(60))
                println()
            }
        }
    }
}

package com.tigermodule.autolink

import org.gradle.api.Plugin
import org.gradle.api.Project
import java.io.File
import java.security.MessageDigest

/**
 * RFC-Compliant Gradle Build plugin for TigerModule extension integration
 * 
 * This plugin scans compiled classes for @LynxNativeModule, @LynxElement, and @LynxService
 * annotations to automatically discover and register extensions, making it fully RFC-compliant.
 * 
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
        
        // Register task to generate annotations
        val generateAnnotationsTask = project.tasks.register("generateTigerModuleAnnotations") {
            group = "tigermodule"
            description = "Generates TigerModule annotations for extension development"
            
            doLast {
                println("📝 Generating TigerModule annotations...")
                
                val annotationsDir = File(
                    project.layout.buildDirectory.get().asFile,
                    "generated/source/tigermodule/main/kotlin/com/tigermodule/autolink"
                )
                
                annotationsDir.mkdirs()
                
                val annotationsFile = File(annotationsDir, "LynxAnnotations.kt")
                annotationsFile.writeText("""
package com.tigermodule.autolink

/**
 * Lynx Autolink Discovery Annotations
 * These annotations are used to mark native modules, elements, and services
 * for automatic discovery and registration by the Autolink framework.
 * 
 * Note: These are NOT the same as Lynx SDK annotations like @LynxMethod, @LynxProp, etc.
 * Those come from the Lynx SDK itself (com.lynx.jsbridge.*, com.lynx.tasm.behavior.*)
 */

/**
 * Marks a class as a Lynx Native Module for autolink discovery.
 * The annotated class should extend the generated *Spec base class.
 * 
 * @param name The name of the native module as it will be exposed to JavaScript
 */
@Target(AnnotationTarget.CLASS)
@Retention(AnnotationRetention.RUNTIME)
annotation class LynxNativeModule(val name: String)

/**
 * Marks a class as a Lynx UI Element for autolink discovery.
 * The annotated class should extend LynxUI and the generated *Spec base class.
 * 
 * @param name The tag name of the element as it will be used in Lynx templates
 */
@Target(AnnotationTarget.CLASS)
@Retention(AnnotationRetention.RUNTIME)
annotation class LynxElement(val name: String)

/**
 * Marks a class as a Lynx Service for autolink discovery.
 * The annotated class should implement the service interface.
 */
@Target(AnnotationTarget.CLASS)
@Retention(AnnotationRetention.RUNTIME)
annotation class LynxService
""".trimIndent())
                
                println("   ✅ Generated annotations at: ${annotationsFile.absolutePath}")
                println()
            }
        }

        // Add extension dependencies directly like lepo does
        println("📦 Adding extension dependencies...")
        
        // Get included project names from settings plugin
        @Suppress("UNCHECKED_CAST")
        val includedProjects = try {
            project.rootProject.extensions.extraProperties.get("tigerModuleIncludedProjects") as? List<String>
        } catch (e: Exception) {
            null
        } ?: emptyList()
        
        if (includedProjects.isEmpty()) {
            println("   ℹ️  No extension subprojects to add as dependencies")
        } else {
            // Add dependencies to included extension subprojects (lepo-style)
            project.dependencies.apply {
                includedProjects.forEach { projectName ->
                    try {
                        add("implementation", project.project(projectName))
                        println("   ✅ Added dependency: $projectName")
                    } catch (e: Exception) {
                        println("   ⚠️  Failed to add dependency $projectName: ${e.message}")
                    }
                }
            }
            println("   📦 Added ${includedProjects.size} extension dependencies")
        }
        println()
        
        // Register task to generate extension registry (lepo-style)
        val generateRegistryTask = project.tasks.register("generateTigerModuleExtensionRegistry") {
            group = "tigermodule"
            description = "Generates ExtensionRegistry.kt for discovered TigerModule extensions using annotation scanning"
            
            doLast {
                println("🔨 Generating TigerModule Extension Registry...")
                
                try {
                    val outputDir = File(
                        project.layout.buildDirectory.get().asFile,
                        "generated/source/tigermodule/main/kotlin/com/tigermodule/autolink/generated"
                    )
                    
                    // Lepo-style: Assume ExtensionProvider will be generated by KAPT
                    // We generate the registry that imports it, and Gradle ensures modules compile first
                    println("   ℹ️  Assuming ExtensionProvider will be generated by KAPT for each module")
                    println("   📦 Generating registry that imports ExtensionProviders...")
                    
                    val enhancedExtensions = extensions
                    
                    println("   ✅ Will import ${enhancedExtensions.size} ExtensionProvider(s)")
                    
                    val generator = RegistryGenerator()
                    generator.generateAndroidRegistry(
                        extensions = enhancedExtensions,
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
        
        // Hook into Android build lifecycle if Android plugin is applied (lepo-style)
        project.afterEvaluate {
            // Try to find Android application or library plugin
            val androidExtension = project.extensions.findByName("android")
            
            if (androidExtension != null) {
                println("   ✅ Android plugin detected")
                
                // Simple approach like lepo: just hook into preBuild
                project.tasks.findByName("preBuild")?.dependsOn(generateRegistryTask)
                
                // Let Gradle handle the rest naturally through implementation(project(...)) dependencies
                println("   ✅ Using lepo-style simple dependency management")
                
                // Add generated annotation source directory to Android sourceSet
                try {
                    val generatedSourceDir = File(
                        project.layout.buildDirectory.get().asFile,
                        "generated/source/tigermodule/main/kotlin"
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
                        
                        println("   ✅ Added generated annotation sources to Android source sets")
                    } catch (e: Exception) {
                        println("   ⚠️  Could not add to source sets: ${e.message}")
                    }
                    
                    println("   📁 Generated annotation sources at: ${generatedSourceDir.absolutePath}")
                    println("   📁 Extension sources from subprojects (included via dependencies)")
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

package com.tigermodule.autolink

import org.gradle.api.Plugin
import org.gradle.api.initialization.Settings
import org.gradle.api.Action
import org.gradle.api.Project
import java.io.File

/**
 * Gradle Settings plugin for TigerModule extension discovery
 * Applied in settings.gradle.kts to discover extensions early in the build lifecycle
 * 
 * Similar to Lepo's approach: discovers extensions and includes them as Gradle subprojects
 * 
 * Usage in settings.gradle.kts:
 * ```
 * plugins {
 *     id("com.tigermodule.extension-settings") version "0.0.1"
 * }
 * ```
 */
class TigerModuleExtensionSettingsPlugin : Plugin<Settings> {
    
    override fun apply(settings: Settings) {
        println("🔌 TigerModule Extension Settings Plugin v${BuildConfig.VERSION}")
        println("   Scanning for TigerModule extensions...")
        
        // Discover extensions in node_modules
        // For Android projects, the node_modules is typically in the parent directory
        val projectRoot = settings.rootDir
        val nodeModulesInRoot = java.io.File(projectRoot, "node_modules")
        val nodeModulesInParent = java.io.File(projectRoot.parentFile, "node_modules")
        
        val searchRoot = when {
            nodeModulesInRoot.exists() -> projectRoot
            nodeModulesInParent.exists() -> {
                println("   📁 Using node_modules from parent directory: ${projectRoot.parentFile.absolutePath}")
                projectRoot.parentFile
            }
            else -> projectRoot
        }
        
        val discovery = ExtensionDiscovery(searchRoot)
        val discoveredExtensions = discovery.discoverExtensions()
        
        // Include extensions as Gradle subprojects (Lepo approach)
        val includedProjects = mutableListOf<String>()
        
        discoveredExtensions.forEach { ext ->
            val androidConfig = ext.config.platforms.android
            if (androidConfig != null) {
                // Sanitize package name to create valid Gradle project name
                val sanitizedName = ext.name.replace(Regex("[/\\\\:<>\"?*|@]"), "-")
                val projectName = ":$sanitizedName"
                
                // Check if android directory exists
                val androidDir = File(ext.path, "android")
                if (androidDir.exists() && androidDir.isDirectory) {
                    try {
                        settings.include(projectName)
                        settings.project(projectName).projectDir = androidDir
                        includedProjects.add(projectName)
                        println("   ✅ Included ${ext.name} as subproject $projectName")
                    } catch (e: Exception) {
                        println("   ⚠️  Failed to include ${ext.name}: ${e.message}")
                    }
                } else {
                    println("   ⚠️  ${ext.name}: android/ directory not found at ${androidDir.absolutePath}")
                }
            }
        }
        
        // Store both discovered extensions and included project names for use by build plugin
        settings.gradle.rootProject(object : Action<Project> {
            override fun execute(project: Project) {
                project.extensions.extraProperties.set("tigerModuleExtensions", discoveredExtensions)
                project.extensions.extraProperties.set("tigerModuleIncludedProjects", includedProjects)
            }
        })
        
        if (includedProjects.isNotEmpty()) {
            println("   📦 Included ${includedProjects.size} extension(s) as Gradle subprojects")
        }
        
        println()
    }
}

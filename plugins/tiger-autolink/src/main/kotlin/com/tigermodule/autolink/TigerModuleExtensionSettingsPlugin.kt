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
        // Look for the actual project root by searching up the directory tree
        val androidProjectRoot = settings.rootDir
        val actualProjectRoot = findProjectRoot(androidProjectRoot)
        
        if (actualProjectRoot != androidProjectRoot) {
            println("   📁 Found project root at: ${actualProjectRoot.absolutePath}")
        }
        
        val searchRoot = actualProjectRoot
        
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
    
    /**
     * Finds the actual project root by looking for package.json and node_modules
     * Searches up to 3 levels up from the current directory
     */
    private fun findProjectRoot(startDir: File): File {
        var currentDir = startDir
        var levelsUp = 0
        
        while (levelsUp < 3) {
            val packageJson = File(currentDir, "package.json")
            val nodeModules = File(currentDir, "node_modules")
            
            // Check if this directory has both package.json and node_modules
            if (packageJson.exists() && nodeModules.exists()) {
                return currentDir
            }
            
            // Check if this directory has package.json (even without node_modules)
            if (packageJson.exists()) {
                return currentDir
            }
            
            // Move up one level
            val parentDir = currentDir.parentFile
            if (parentDir == null || parentDir == currentDir) {
                break
            }
            
            currentDir = parentDir
            levelsUp++
        }
        
        // If we couldn't find a project root, return the original directory
        return startDir
    }
}

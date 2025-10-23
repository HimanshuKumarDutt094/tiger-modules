package org.lynxsdk.autolink

import org.gradle.api.Plugin
import org.gradle.api.initialization.Settings
import org.gradle.api.Action
import org.gradle.api.Project

/**
 * Gradle Settings plugin for Lynx extension discovery
 * Applied in settings.gradle.kts to discover extensions early in the build lifecycle
 * 
 * Usage in settings.gradle.kts:
 * ```
 * plugins {
 *     id("org.lynxsdk.extension-settings") version "0.0.1"
 * }
 * ```
 */
class LynxExtensionSettingsPlugin : Plugin<Settings> {
    
    override fun apply(settings: Settings) {
        println("🔌 Lynx Extension Settings Plugin v0.0.1")
        println("   Scanning for Lynx extensions...")
        
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
        
        // Store discovered extensions in Gradle extra properties for use by build plugin
        // Use rootProject action to set extra properties when root project is available
        settings.gradle.rootProject(object : Action<Project> {
            override fun execute(project: Project) {
                project.extensions.extraProperties.set("lynxExtensions", discoveredExtensions)
            }
        })
        
        println()
    }
}

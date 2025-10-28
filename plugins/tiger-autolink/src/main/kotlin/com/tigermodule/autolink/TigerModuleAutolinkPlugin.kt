package com.tigermodule.autolink

import org.gradle.api.Plugin
import org.gradle.api.initialization.Settings
import org.gradle.api.Project

/**
 * Unified TigerModule Autolink Plugin
 * 
 * This plugin can be applied to both settings.gradle.kts and build.gradle.kts
 * It automatically detects the context and applies the appropriate functionality:
 * 
 * - In Settings: Discovers extensions and includes them as Gradle subprojects
 * - In Project: Generates registry and configures dependencies
 * 
 * Usage:
 * ```
 * // settings.gradle.kts
 * plugins {
 *     id("io.github.himanshukumardutt094.tiger-autolink") version "1.0.0"
 * }
 * 
 * // build.gradle.kts (app module)
 * plugins {
 *     id("io.github.himanshukumardutt094.tiger-autolink") version "1.0.0"
 * }
 * ```
 */
class TigerModuleAutolinkPlugin : Plugin<Any> {
    
    override fun apply(target: Any) {
        when (target) {
            is Settings -> {
                println("🔌 TigerModule Autolink Plugin v${BuildConfig.VERSION} (Settings Phase)")
                TigerModuleExtensionSettingsPlugin().apply(target)
            }
            is Project -> {
                println("🔌 TigerModule Autolink Plugin v${BuildConfig.VERSION} (Build Phase)")
                TigerModuleExtensionBuildPlugin().apply(target)
            }
            else -> {
                throw IllegalArgumentException(
                    "TigerModule Autolink Plugin can only be applied to Settings or Project.\n" +
                    "Apply it in settings.gradle.kts and build.gradle.kts (app module)."
                )
            }
        }
    }
}

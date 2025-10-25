package com.tigermodule.autolink

import com.google.gson.*
import com.google.gson.reflect.TypeToken
import java.lang.reflect.Type



/**
 * Native module configuration with structured metadata
 */
data class NativeModuleConfig(
    val name: String,
    val className: String,
    val hasInitMethod: Boolean = false,
    val initMethodSignature: String? = null
)

/**
 * Element configuration with optional custom view type
 */
data class ElementConfig(
    val name: String,
    val customView: CustomViewConfig? = null
)

/**
 * Custom view configuration for elements
 */
data class CustomViewConfig(
    val name: String
)

/**
 * Data classes representing tiger.config.json configuration structure
 */
data class AutolinkConfig(
    val name: String,
    val version: String,
    val tigerModuleVersion: String? = null,
    val platforms: Platforms,
    val dependencies: List<String> = emptyList(),
    val nativeModules: List<NativeModuleConfig> = emptyList(),
    val elements: List<ElementConfig> = emptyList(),
    val services: List<String> = emptyList()
)

data class Platforms(
    val android: AndroidConfig? = null,
    val ios: IOSConfig? = null,
    val web: WebConfig? = null
)

data class AndroidConfig(
    val packageName: String,
    val sourceDir: String = "android/src/main",
    val buildTypes: List<String> = listOf("debug", "release"),
    val language: String = "kotlin"
)

data class IOSConfig(
    val podspecPath: String? = null,
    val sourceDir: String = "ios/src",
    val frameworks: List<String> = emptyList()
)

data class WebConfig(
    val entry: String = "web/src/index.ts"
)

/**
 * Represents a discovered extension package
 */
data class ExtensionPackage(
    val name: String,
    val version: String,
    val path: String,
    val config: AutolinkConfig
)



/**
 * Creates a Gson instance for AutolinkConfig
 */
fun createAutolinkGson(): Gson {
    return GsonBuilder().create()
}

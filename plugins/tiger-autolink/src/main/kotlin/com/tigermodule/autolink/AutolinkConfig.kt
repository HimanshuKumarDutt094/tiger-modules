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
 * Element configuration with support for custom tag names
 */
data class ElementConfig(
    val name: String,
    val tagName: String? = null
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
 * Creates a Gson instance for AutolinkConfig with proper null handling
 */
fun createAutolinkGson(): Gson {
    return GsonBuilder()
        .registerTypeAdapter(AutolinkConfig::class.java, AutolinkConfigDeserializer())
        .create()
}

/**
 * Custom deserializer that ensures null lists are converted to empty lists
 */
class AutolinkConfigDeserializer : JsonDeserializer<AutolinkConfig> {
    override fun deserialize(
        json: JsonElement,
        typeOfT: Type,
        context: JsonDeserializationContext
    ): AutolinkConfig {
        val jsonObject = json.asJsonObject
        
        return AutolinkConfig(
            name = jsonObject.get("name")?.asString ?: "",
            version = jsonObject.get("version")?.asString ?: "",
            tigerModuleVersion = jsonObject.get("tigerModuleVersion")?.asString,
            platforms = context.deserialize(jsonObject.get("platforms"), Platforms::class.java),
            dependencies = deserializeStringList(jsonObject.get("dependencies")),
            nativeModules = deserializeNativeModules(jsonObject.get("nativeModules"), context),
            elements = deserializeElements(jsonObject.get("elements"), context),
            services = deserializeStringList(jsonObject.get("services"))
        )
    }
    
    private fun deserializeStringList(element: JsonElement?): List<String> {
        if (element == null || element.isJsonNull) return emptyList()
        return try {
            element.asJsonArray.map { it.asString }
        } catch (e: Exception) {
            emptyList()
        }
    }
    
    private fun deserializeNativeModules(
        element: JsonElement?,
        context: JsonDeserializationContext
    ): List<NativeModuleConfig> {
        if (element == null || element.isJsonNull) return emptyList()
        return try {
            val type = object : TypeToken<List<NativeModuleConfig>>() {}.type
            context.deserialize(element, type) ?: emptyList()
        } catch (e: Exception) {
            emptyList()
        }
    }
    
    private fun deserializeElements(
        element: JsonElement?,
        context: JsonDeserializationContext
    ): List<ElementConfig> {
        if (element == null || element.isJsonNull) return emptyList()
        return try {
            val type = object : TypeToken<List<ElementConfig>>() {}.type
            context.deserialize(element, type) ?: emptyList()
        } catch (e: Exception) {
            emptyList()
        }
    }
}

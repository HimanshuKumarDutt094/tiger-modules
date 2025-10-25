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
 * Data classes representing tiger.config.json configuration structure
 */
data class AutolinkConfig(
    val name: String,
    val version: String,
    val tigerModuleVersion: String? = null,
    val platforms: Platforms,
    val dependencies: List<String> = emptyList(),
    val nativeModules: List<NativeModuleConfig> = emptyList(),
    val elements: List<String> = emptyList(),
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
 * Custom deserializer for NativeModules that handles both old and new formats
 * Old format: ["Module1", "Module2"]
 * New format: [{"name": "Module1", "className": "Module1Impl"}]
 */
class NativeModulesDeserializer : JsonDeserializer<List<NativeModuleConfig>> {
    override fun deserialize(
        json: JsonElement?,
        typeOfT: Type?,
        context: JsonDeserializationContext?
    ): List<NativeModuleConfig> {
        if (json == null || json.isJsonNull) {
            return emptyList()
        }

        if (!json.isJsonArray) {
            return emptyList()
        }

        val array = json.asJsonArray
        if (array.size() == 0) {
            return emptyList()
        }

        // Check first element to determine format
        val firstElement = array.get(0)
        
        return if (firstElement.isJsonPrimitive && firstElement.asJsonPrimitive.isString) {
            // Old format: string array
            array.map { element ->
                val moduleName = element.asString
                NativeModuleConfig(
                    name = moduleName,
                    className = moduleName,
                    hasInitMethod = false,
                    initMethodSignature = null
                )
            }
        } else if (firstElement.isJsonObject) {
            // New format: object array
            array.map { element ->
                val obj = element.asJsonObject
                NativeModuleConfig(
                    name = obj.get("name")?.asString ?: "",
                    className = obj.get("className")?.asString ?: "",
                    hasInitMethod = obj.get("hasInitMethod")?.asBoolean ?: false,
                    initMethodSignature = obj.get("initMethodSignature")?.asString
                )
            }
        } else {
            emptyList()
        }
    }
}

/**
 * Creates a Gson instance configured with custom deserializers for AutolinkConfig
 */
fun createAutolinkGson(): Gson {
    return GsonBuilder()
        .registerTypeAdapter(
            object : TypeToken<List<NativeModuleConfig>>() {}.type,
            NativeModulesDeserializer()
        )
        .create()
}

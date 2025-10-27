package com.tigermodule.autolink

import java.io.File
import java.util.jar.JarFile
import java.util.zip.ZipEntry
import org.objectweb.asm.ClassReader
import org.objectweb.asm.ClassVisitor
import org.objectweb.asm.AnnotationVisitor
import org.objectweb.asm.Opcodes

/**
 * Scans compiled classes for Lynx autolink annotations
 * This makes the system RFC-compliant by discovering extensions via annotations
 * rather than configuration files
 */
class AnnotationScanner {
    
    /**
     * Discovered extension information from annotations
     */
    data class DiscoveredExtension(
        val type: Type,
        val className: String,
        val annotationName: String, // The name from the annotation (e.g., "explorer-input")
        val packageName: String
    )
    
    enum class Type {
        NATIVE_MODULE,
        ELEMENT,
        SERVICE
    }
    
    /**
     * Scans a directory or JAR file for classes with Lynx annotations
     */
    fun scanForAnnotations(sourceDir: File): List<DiscoveredExtension> {
        val discoveries = mutableListOf<DiscoveredExtension>()
        
        if (!sourceDir.exists()) {
            return discoveries
        }
        
        if (sourceDir.isDirectory) {
            scanDirectory(sourceDir, discoveries)
        } else if (sourceDir.name.endsWith(".jar")) {
            scanJarFile(sourceDir, discoveries)
        }
        
        return discoveries
    }
    
    /**
     * Scans a directory recursively for .class files
     */
    private fun scanDirectory(dir: File, discoveries: MutableList<DiscoveredExtension>) {
        dir.walkTopDown()
            .filter { it.isFile && it.extension == "class" }
            .forEach { classFile ->
                try {
                    val classBytes = classFile.readBytes()
                    scanClassBytes(classBytes, discoveries)
                } catch (e: Exception) {
                    // Skip files that can't be read or parsed
                    println("   ⚠️  Could not scan class file: ${classFile.name} - ${e.message}")
                }
            }
    }
    
    /**
     * Scans a JAR file for .class files
     */
    private fun scanJarFile(jarFile: File, discoveries: MutableList<DiscoveredExtension>) {
        try {
            JarFile(jarFile).use { jar ->
                jar.entries().asSequence()
                    .filter { entry -> entry.name.endsWith(".class") && !entry.isDirectory }
                    .forEach { entry ->
                        try {
                            val classBytes = jar.getInputStream(entry).readBytes()
                            scanClassBytes(classBytes, discoveries)
                        } catch (e: Exception) {
                            // Skip files that can't be read or parsed
                            println("   ⚠️  Could not scan class in JAR: ${entry.name} - ${e.message}")
                        }
                    }
            }
        } catch (e: Exception) {
            println("   ❌ Could not scan JAR file: ${jarFile.name} - ${e.message}")
        }
    }
    
    /**
     * Scans class bytecode for Lynx annotations using ASM
     */
    private fun scanClassBytes(classBytes: ByteArray, discoveries: MutableList<DiscoveredExtension>) {
        try {
            val classReader = ClassReader(classBytes)
            val visitor = LynxAnnotationClassVisitor(discoveries)
            classReader.accept(visitor, ClassReader.SKIP_CODE or ClassReader.SKIP_DEBUG or ClassReader.SKIP_FRAMES)
        } catch (e: Exception) {
            // Skip classes that can't be parsed
        }
    }
    
    /**
     * ASM ClassVisitor that looks for Lynx annotations
     */
    private class LynxAnnotationClassVisitor(
        private val discoveries: MutableList<DiscoveredExtension>
    ) : ClassVisitor(Opcodes.ASM9) {
        
        private var currentClassName: String? = null
        private var currentPackageName: String? = null
        
        override fun visit(
            version: Int,
            access: Int,
            name: String,
            signature: String?,
            superName: String?,
            interfaces: Array<out String>?
        ) {
            // Convert internal class name (com/example/MyClass) to fully qualified name
            val fullClassName = name.replace('/', '.')
            val lastDotIndex = fullClassName.lastIndexOf('.')
            
            if (lastDotIndex != -1) {
                currentPackageName = fullClassName.substring(0, lastDotIndex)
                currentClassName = fullClassName.substring(lastDotIndex + 1)
            } else {
                currentPackageName = ""
                currentClassName = fullClassName
            }
        }
        
        override fun visitAnnotation(descriptor: String, visible: Boolean): AnnotationVisitor? {
            val className = currentClassName ?: return null
            val packageName = currentPackageName ?: return null
            
            return when (descriptor) {
                "Lcom/tigermodule/autolink/LynxNativeModule;" -> {
                    LynxNativeModuleAnnotationVisitor(discoveries, className, packageName)
                }
                "Lcom/tigermodule/autolink/LynxElement;" -> {
                    LynxElementAnnotationVisitor(discoveries, className, packageName)
                }
                "Lcom/tigermodule/autolink/LynxService;" -> {
                    // LynxService doesn't have parameters, so we can add it immediately
                    discoveries.add(
                        DiscoveredExtension(
                            type = Type.SERVICE,
                            className = className,
                            annotationName = className, // Use class name as service name
                            packageName = packageName
                        )
                    )
                    null
                }
                else -> null
            }
        }
    }
    
    /**
     * Annotation visitor for @LynxNativeModule
     */
    private class LynxNativeModuleAnnotationVisitor(
        private val discoveries: MutableList<DiscoveredExtension>,
        private val className: String,
        private val packageName: String
    ) : AnnotationVisitor(Opcodes.ASM9) {
        
        override fun visit(name: String?, value: Any?) {
            if (name == "name" && value is String) {
                discoveries.add(
                    DiscoveredExtension(
                        type = Type.NATIVE_MODULE,
                        className = className,
                        annotationName = value,
                        packageName = packageName
                    )
                )
            }
        }
    }
    
    /**
     * Annotation visitor for @LynxElement
     */
    private class LynxElementAnnotationVisitor(
        private val discoveries: MutableList<DiscoveredExtension>,
        private val className: String,
        private val packageName: String
    ) : AnnotationVisitor(Opcodes.ASM9) {
        
        override fun visit(name: String?, value: Any?) {
            if (name == "name" && value is String) {
                discoveries.add(
                    DiscoveredExtension(
                        type = Type.ELEMENT,
                        className = className,
                        annotationName = value,
                        packageName = packageName
                    )
                )
            }
        }
    }
    
    /**
     * Scans all extension packages for annotations
     */
    fun scanExtensionPackages(extensions: List<ExtensionPackage>): Map<String, List<DiscoveredExtension>> {
        val allDiscoveries = mutableMapOf<String, List<DiscoveredExtension>>()
        
        println("🔍 Scanning for Lynx annotations...")
        
        extensions.forEach { ext ->
            val androidConfig = ext.config.platforms.android ?: return@forEach
            
            // Scan the compiled classes in the extension's Android source directory
            val sourceDir = File(ext.path, androidConfig.sourceDir)
            val discoveries = scanForAnnotations(sourceDir)
            
            if (discoveries.isNotEmpty()) {
                println("   📦 ${ext.name}: Found ${discoveries.size} annotated class(es)")
                discoveries.forEach { discovery ->
                    println("      ${discovery.type.name.lowercase()}: ${discovery.className} (name: ${discovery.annotationName})")
                }
                allDiscoveries[ext.name] = discoveries
            } else {
                println("   📦 ${ext.name}: No annotated classes found")
            }
        }
        
        return allDiscoveries
    }
    
    /**
     * Converts discovered annotations to AutolinkConfig format for compatibility
     */
    fun convertToAutolinkConfig(
        extensionPackage: ExtensionPackage,
        discoveries: List<DiscoveredExtension>
    ): AutolinkConfig {
        val nativeModules = discoveries
            .filter { it.type == Type.NATIVE_MODULE }
            .map { NativeModuleConfig(name = it.annotationName, className = it.className) }
        
        val elements = discoveries
            .filter { it.type == Type.ELEMENT }
            .map { ElementConfig(name = it.annotationName) }
        
        val services = discoveries
            .filter { it.type == Type.SERVICE }
            .map { it.className }
        
        return extensionPackage.config.copy(
            nativeModules = nativeModules,
            elements = elements,
            services = services
        )
    }
}
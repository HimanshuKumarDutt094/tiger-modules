package com.tigermodule.processor

import com.google.auto.service.AutoService
import com.squareup.kotlinpoet.*
import com.squareup.kotlinpoet.ParameterizedTypeName.Companion.parameterizedBy
import java.io.File
import javax.annotation.processing.*
import javax.lang.model.SourceVersion
import javax.lang.model.element.TypeElement
import javax.lang.model.type.TypeMirror
import javax.tools.Diagnostic

/**
 * Annotation processor for Tiger extensions
 * Generates ExtensionProvider class for each module package
 */
@AutoService(Processor::class)
@SupportedAnnotationTypes(
    "com.tigermodule.processor.LynxNativeModule",
    "com.tigermodule.processor.LynxElement",
    "com.tigermodule.processor.LynxService"
)
@SupportedSourceVersion(SourceVersion.RELEASE_11)
class TigerExtensionProcessor : AbstractProcessor() {

    private val moduleClasses = mutableMapOf<String, MutableList<ModuleInfo>>()
    private val elementClasses = mutableMapOf<String, MutableList<ElementInfo>>()
    private val serviceClasses = mutableMapOf<String, MutableList<ServiceInfo>>()

    data class ModuleInfo(
        val className: String,
        val moduleName: String,
        val packageName: String
    )

    data class ElementInfo(
        val className: String,
        val tagName: String,
        val packageName: String
    )

    data class ServiceInfo(
        val className: String,
        val interfaceType: String,
        val packageName: String
    )

    override fun process(annotations: MutableSet<out TypeElement>?, roundEnv: RoundEnvironment?): Boolean {
        if (roundEnv == null) return false

        // Clear previous round data
        moduleClasses.clear()
        elementClasses.clear()
        serviceClasses.clear()

        // Process @LynxNativeModule annotations
        processLynxNativeModule(roundEnv)

        // Process @LynxElement annotations
        processLynxElement(roundEnv)

        // Process @LynxService annotations
        processLynxService(roundEnv)

        // Generate ExtensionProvider class if we have any extensions
        val allPackages = (moduleClasses.keys + elementClasses.keys + serviceClasses.keys).toSet()
        if (allPackages.isNotEmpty()) {
            allPackages.forEach { packageName ->
                generateExtensionProvider(packageName)
            }
        }

        return true
    }

    private fun processLynxNativeModule(roundEnv: RoundEnvironment) {
        // Get the annotation type element
        val annotationType = processingEnv.elementUtils.getTypeElement("com.tigermodule.processor.LynxNativeModule")
        if (annotationType == null) {
            processingEnv.messager.printMessage(
                Diagnostic.Kind.WARNING,
                "LynxNativeModule annotation not found - make sure tiger-annotation-processor is in dependencies"
            )
            return
        }

        val annotatedElements = roundEnv.getElementsAnnotatedWith(annotationType)

        for (element in annotatedElements) {
            if (element !is TypeElement) {
                processingEnv.messager.printMessage(
                    Diagnostic.Kind.ERROR,
                    "@LynxNativeModule can only be applied to classes",
                    element
                )
                continue
            }

            // Get annotation value using mirrors
            val annotationMirror = element.annotationMirrors.find { 
                it.annotationType.toString() == "com.tigermodule.processor.LynxNativeModule" 
            }
            
            val moduleName = annotationMirror?.elementValues?.entries?.find { 
                it.key.simpleName.toString() == "name" 
            }?.value?.value as? String ?: element.simpleName.toString()
            
            val className = element.simpleName.toString()
            val packageName = processingEnv.elementUtils.getPackageOf(element).qualifiedName.toString()
            val moduleList = moduleClasses.getOrPut(packageName) { mutableListOf() }

            moduleList.add(ModuleInfo(className, moduleName, packageName))

            processingEnv.messager.printMessage(
                Diagnostic.Kind.NOTE,
                "Found native module: $className with name: $moduleName"
            )
        }
    }

    private fun processLynxElement(roundEnv: RoundEnvironment) {
        val annotationType = processingEnv.elementUtils.getTypeElement("com.tigermodule.processor.LynxElement")
        if (annotationType == null) {
            processingEnv.messager.printMessage(
                Diagnostic.Kind.WARNING,
                "LynxElement annotation not found - make sure tiger-annotation-processor is in dependencies"
            )
            return
        }

        val annotatedElements = roundEnv.getElementsAnnotatedWith(annotationType)

        for (element in annotatedElements) {
            if (element !is TypeElement) {
                processingEnv.messager.printMessage(
                    Diagnostic.Kind.ERROR,
                    "@LynxElement can only be applied to classes",
                    element
                )
                continue
            }

            val annotationMirror = element.annotationMirrors.find { 
                it.annotationType.toString() == "com.tigermodule.processor.LynxElement" 
            }
            
            val tagName = annotationMirror?.elementValues?.entries?.find { 
                it.key.simpleName.toString() == "name" 
            }?.value?.value as? String ?: element.simpleName.toString()
            
            val className = element.simpleName.toString()
            val packageName = processingEnv.elementUtils.getPackageOf(element).qualifiedName.toString()
            val elementList = elementClasses.getOrPut(packageName) { mutableListOf() }

            elementList.add(ElementInfo(className, tagName, packageName))

            processingEnv.messager.printMessage(
                Diagnostic.Kind.NOTE,
                "Found element: $className with tag: $tagName"
            )
        }
    }

    private fun processLynxService(roundEnv: RoundEnvironment) {
        val annotationType = processingEnv.elementUtils.getTypeElement("com.tigermodule.processor.LynxService")
        if (annotationType == null) {
            processingEnv.messager.printMessage(
                Diagnostic.Kind.WARNING,
                "LynxService annotation not found - make sure tiger-annotation-processor is in dependencies"
            )
            return
        }

        val annotatedElements = roundEnv.getElementsAnnotatedWith(annotationType)

        for (element in annotatedElements) {
            if (element !is TypeElement) {
                processingEnv.messager.printMessage(
                    Diagnostic.Kind.ERROR,
                    "@LynxService can only be applied to classes",
                    element
                )
                continue
            }

            val className = element.simpleName.toString()
            val packageName = processingEnv.elementUtils.getPackageOf(element).qualifiedName.toString()
            val serviceList = serviceClasses.getOrPut(packageName) { mutableListOf() }

            // Get the first interface that this class implements
            val interfaceType = getFirstInterface(element)
            if (interfaceType == null) {
                processingEnv.messager.printMessage(
                    Diagnostic.Kind.ERROR,
                    "@LynxService annotated class $className must implement at least one interface",
                    element
                )
                continue
            }

            serviceList.add(ServiceInfo(className, interfaceType, packageName))

            processingEnv.messager.printMessage(
                Diagnostic.Kind.NOTE,
                "Found service: $className implementing interface: $interfaceType"
            )
        }
    }

    private fun getFirstInterface(element: TypeElement): String? {
        val interfaces = element.interfaces
        if (interfaces.isNotEmpty()) {
            val interfaceElement = processingEnv.typeUtils.asElement(interfaces[0]) as? TypeElement
            return interfaceElement?.qualifiedName?.toString()
        }
        return null
    }

    private fun generateExtensionProvider(packageName: String) {
        try {
            val moduleList = moduleClasses[packageName] ?: emptyList()
            val elementList = elementClasses[packageName] ?: emptyList()
            val serviceList = serviceClasses[packageName] ?: emptyList()
            val className = "ExtensionProvider"

            // Create the getBehaviors function (for elements)
            val getBehaviorsFunction = FunSpec.builder("getBehaviors")
                .addAnnotation(JvmStatic::class)
                .returns(ClassName("kotlin.collections", "List").parameterizedBy(
                    ClassName("com.lynx.tasm.behavior", "Behavior")
                ))
                .addCode(buildCodeBlock {
                    add("val result = mutableListOf<%T>()\n", ClassName("com.lynx.tasm.behavior", "Behavior"))
                    elementList.forEach { elementInfo ->
                        add("result.add(object : %T(\"%L\") {\n", ClassName("com.lynx.tasm.behavior", "Behavior"), elementInfo.tagName)
                        indent()
                        add("override fun createUI(context: %T): %T {\n", ClassName("com.lynx.tasm.behavior", "LynxContext"), ClassName("com.lynx.tasm.behavior.ui", "LynxUI").parameterizedBy(STAR))
                        indent()
                        add("return %T(context)\n", ClassName(elementInfo.packageName, elementInfo.className))
                        unindent()
                        add("}\n")
                        unindent()
                        add("})\n")
                    }
                    add("return result\n")
                })
                .build()

            // Create the getModules function
            val getModulesFunction = FunSpec.builder("getModules")
                .addAnnotation(JvmStatic::class)
                .returns(ClassName("kotlin.collections", "Map").parameterizedBy(
                    ClassName("kotlin", "String"),
                    ClassName("java.lang", "Class").parameterizedBy(
                        WildcardTypeName.producerOf(ClassName("com.lynx.jsbridge", "LynxModule"))
                    )
                ))
                .addCode(buildCodeBlock {
                    add("return mapOf(\n")
                    indent()
                    moduleList.forEachIndexed { index, moduleInfo ->
                        add("\"%L\" to %T::class.java", moduleInfo.moduleName, ClassName(moduleInfo.packageName, moduleInfo.className))
                        if (index < moduleList.size - 1) {
                            add(",\n")
                        } else {
                            add("\n")
                        }
                    }
                    unindent()
                    add(")")
                })
                .build()

            // Create the getServices function
            val getServicesFunction = FunSpec.builder("getServices")
                .addAnnotation(JvmStatic::class)
                .returns(ClassName("kotlin.collections", "Map").parameterizedBy(
                    ClassName("java.lang", "Class").parameterizedBy(STAR),
                    ClassName("kotlin", "Any")
                ))
                .addCode(buildCodeBlock {
                    add("return mapOf(\n")
                    indent()
                    serviceList.forEachIndexed { index, serviceInfo ->
                        add("%T::class.java to %T()", 
                            ClassName.bestGuess(serviceInfo.interfaceType), 
                            ClassName(serviceInfo.packageName, serviceInfo.className))
                        if (index < serviceList.size - 1) {
                            add(",\n")
                        } else {
                            add("\n")
                        }
                    }
                    unindent()
                    add(")")
                })
                .build()

            // Create the object
            val extensionProviderObject = TypeSpec.objectBuilder(className)
                .addFunction(getBehaviorsFunction)
                .addFunction(getModulesFunction)
                .addFunction(getServicesFunction)
                .build()

            // Create the file with imports for element and module classes
            val fileBuilder = FileSpec.builder(packageName, className)
                .addType(extensionProviderObject)
                .addFileComment("Generated by TigerExtensionProcessor")
            
            // Add imports for element classes
            elementList.forEach { elementInfo ->
                fileBuilder.addImport(elementInfo.packageName, elementInfo.className)
            }
            
            // Add imports for module classes
            moduleList.forEach { moduleInfo ->
                fileBuilder.addImport(moduleInfo.packageName, moduleInfo.className)
            }
            
            val file = fileBuilder.build()

            // Write to file
            val kaptKotlinGeneratedDir = processingEnv.options["kapt.kotlin.generated"]
            if (kaptKotlinGeneratedDir != null) {
                file.writeTo(File(kaptKotlinGeneratedDir))
            } else {
                file.writeTo(processingEnv.filer)
            }

            processingEnv.messager.printMessage(
                Diagnostic.Kind.NOTE,
                "Generated ExtensionProvider with ${moduleList.size} modules, ${elementList.size} elements and ${serviceList.size} services"
            )

        } catch (e: Exception) {
            processingEnv.messager.printMessage(
                Diagnostic.Kind.ERROR,
                "Failed to generate ExtensionProvider: ${e.message}"
            )
        }
    }
}

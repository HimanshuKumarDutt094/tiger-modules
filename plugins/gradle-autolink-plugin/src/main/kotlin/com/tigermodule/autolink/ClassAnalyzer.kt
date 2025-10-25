package com.tigermodule.autolink

import java.io.File
import java.util.regex.Pattern

/**
 * Analyzes module classes to detect init methods that require enhanced initialization
 */
class ClassAnalyzer {
    
    companion object {
        private const val TAG = "ClassAnalyzer"
        
        // Regex patterns for detecting init methods
        private val INIT_METHOD_PATTERNS = listOf(
            // Instance method: fun init(context: Context)
            Pattern.compile(
                "\\s*(?:override\\s+)?fun\\s+init\\s*\\(\\s*(?:\\w+\\s*:\\s*)?Context\\s*\\)",
                Pattern.CASE_INSENSITIVE
            ),
            // Instance method: fun init(application: Application)
            Pattern.compile(
                "\\s*(?:override\\s+)?fun\\s+init\\s*\\(\\s*(?:\\w+\\s*:\\s*)?Application\\s*\\)",
                Pattern.CASE_INSENSITIVE
            ),
            // Instance method with parameter name: fun init(ctx: Context)
            Pattern.compile(
                "\\s*(?:override\\s+)?fun\\s+init\\s*\\(\\s*\\w+\\s*:\\s*Context\\s*\\)",
                Pattern.CASE_INSENSITIVE
            ),
            // Instance method with parameter name: fun init(app: Application)
            Pattern.compile(
                "\\s*(?:override\\s+)?fun\\s+init\\s*\\(\\s*\\w+\\s*:\\s*Application\\s*\\)",
                Pattern.CASE_INSENSITIVE
            )
        )
        
        // Pattern to detect class declaration
        private val CLASS_DECLARATION_PATTERN = Pattern.compile(
            "\\s*(?:open\\s+|abstract\\s+)?class\\s+(\\w+)",
            Pattern.CASE_INSENSITIVE
        )
    }
    
    /**
     * Analyzes a module class file to detect init methods
     */
    fun analyzeModuleClass(sourceFile: File, className: String): InitMethodInfo {
        if (!sourceFile.exists() || !sourceFile.isFile) {
            return InitMethodInfo(
                hasInitMethod = false,
                error = "Source file not found: ${sourceFile.absolutePath}"
            )
        }
        
        return try {
            val content = sourceFile.readText()
            analyzeClassContent(content, className, sourceFile.absolutePath)
        } catch (e: Exception) {
            InitMethodInfo(
                hasInitMethod = false,
                error = "Failed to read source file: ${e.message}"
            )
        }
    }
    
    /**
     * Analyzes class content to detect init methods
     */
    private fun analyzeClassContent(content: String, expectedClassName: String, filePath: String): InitMethodInfo {
        val lines = content.lines()
        var inTargetClass = false
        var braceDepth = 0
        var foundClassName: String? = null
        
        for ((lineNumber, line) in lines.withIndex()) {
            val trimmedLine = line.trim()
            
            // Skip comments and empty lines
            if (trimmedLine.startsWith("//") || trimmedLine.startsWith("/*") || trimmedLine.isEmpty()) {
                continue
            }
            
            // Track brace depth to know when we're inside the target class
            braceDepth += line.count { it == '{' } - line.count { it == '}' }
            
            // Look for class declaration
            if (!inTargetClass) {
                val classMatcher = CLASS_DECLARATION_PATTERN.matcher(trimmedLine)
                if (classMatcher.find()) {
                    foundClassName = classMatcher.group(1)
                    if (foundClassName == expectedClassName) {
                        inTargetClass = true
                        continue
                    }
                }
            }
            
            // If we're in the target class, look for init methods
            if (inTargetClass && braceDepth > 0) {
                for (pattern in INIT_METHOD_PATTERNS) {
                    val matcher = pattern.matcher(trimmedLine)
                    if (matcher.find()) {
                        val signature = extractMethodSignature(line, lines, lineNumber)
                        return InitMethodInfo(
                            hasInitMethod = true,
                            signature = signature,
                            lineNumber = lineNumber + 1,
                            filePath = filePath
                        )
                    }
                }
            }
            
            // If we've exited the target class (braceDepth back to 0), stop looking
            if (inTargetClass && braceDepth == 0) {
                break
            }
        }
        
        // If we found the class but no init method
        if (foundClassName == expectedClassName) {
            return InitMethodInfo(hasInitMethod = false)
        }
        
        // If we didn't find the expected class
        return InitMethodInfo(
            hasInitMethod = false,
            error = "Class '$expectedClassName' not found in file. Found: ${foundClassName ?: "no class"}"
        )
    }
    
    /**
     * Extracts the full method signature, handling multi-line declarations
     */
    private fun extractMethodSignature(startLine: String, allLines: List<String>, startIndex: Int): String {
        var signature = startLine.trim()
        var currentIndex = startIndex
        
        // If the line doesn't end with '{' or ')', it might be a multi-line signature
        while (!signature.contains("{") && !signature.endsWith(")") && currentIndex < allLines.size - 1) {
            currentIndex++
            signature += " " + allLines[currentIndex].trim()
        }
        
        // Extract just the method declaration part (before the opening brace)
        val braceIndex = signature.indexOf('{')
        if (braceIndex != -1) {
            signature = signature.substring(0, braceIndex).trim()
        }
        
        return signature
    }
    
    /**
     * Analyzes all module classes in an extension package
     */
    fun analyzeExtensionModules(extensionPackage: ExtensionPackage): List<ModuleAnalysisResult> {
        val results = mutableListOf<ModuleAnalysisResult>()
        val androidConfig = extensionPackage.config.platforms.android
        
        if (androidConfig == null) {
            return results
        }
        
        val sourceDir = File(extensionPackage.path, androidConfig.sourceDir)
        if (!sourceDir.exists()) {
            return results
        }
        
        // Analyze each native module
        for (moduleConfig in extensionPackage.config.nativeModules) {
            val analysisResult = analyzeModule(sourceDir, androidConfig.packageName, moduleConfig)
            results.add(analysisResult)
        }
        
        return results
    }
    
    /**
     * Analyzes a specific module within a source directory
     */
    private fun analyzeModule(sourceDir: File, packageName: String, moduleConfig: NativeModuleConfig): ModuleAnalysisResult {
        // Convert package name to directory path
        val packagePath = packageName.replace('.', File.separatorChar)
        val packageDir = File(sourceDir, "kotlin/$packagePath")
        
        // Look for the module class file
        val possibleFiles = listOf(
            File(packageDir, "${moduleConfig.className}.kt"),
            File(packageDir, "${moduleConfig.name}.kt")
        )
        
        for (sourceFile in possibleFiles) {
            if (sourceFile.exists()) {
                val initMethodInfo = analyzeModuleClass(sourceFile, moduleConfig.className)
                return ModuleAnalysisResult(
                    moduleName = moduleConfig.name,
                    className = moduleConfig.className,
                    sourceFile = sourceFile.absolutePath,
                    initMethodInfo = initMethodInfo
                )
            }
        }
        
        // If no source file found
        return ModuleAnalysisResult(
            moduleName = moduleConfig.name,
            className = moduleConfig.className,
            sourceFile = null,
            initMethodInfo = InitMethodInfo(
                hasInitMethod = false,
                error = "Source file not found for class ${moduleConfig.className}"
            )
        )
    }
}

/**
 * Information about an init method found in a class
 */
data class InitMethodInfo(
    val hasInitMethod: Boolean,
    val signature: String? = null,
    val lineNumber: Int? = null,
    val filePath: String? = null,
    val error: String? = null
)

/**
 * Result of analyzing a module class
 */
data class ModuleAnalysisResult(
    val moduleName: String,
    val className: String,
    val sourceFile: String?,
    val initMethodInfo: InitMethodInfo
)
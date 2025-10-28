/**
 * Code generation orchestrator
 * Coordinates the entire code generation process
 */

import { parseInterfaces, parseElementInterfaces } from "./parser.js";
import { loadCodegenConfig, validateConfig } from "./config.js";
import { generateNativeModule } from "./generators/modules.js";
import { generateElement } from "./generators/elements.js";
import { generateService } from "./generators/services.js";
import type { CodegenContext, MethodInfo } from "./types.js";

export async function runCodegenOrchestrator(): Promise<void> {
  // Load and validate configuration
  const config = await loadCodegenConfig();
  validateConfig(config);

  // Parse TypeScript interfaces
  const interfaceMethodsMap = parseInterfaces(
    config.srcFile,
    config.nativeModules.map((m) => m.className),
    config.elements.map((el) => el.name),
    config.services
  );

  // Parse element interfaces with JSDoc support
  const elementInfoMap = parseElementInterfaces(
    config.srcFile,
    config.elements
  );

  // Create codegen context
  const codegenContext: CodegenContext = {
    androidPackageName: config.androidPackageName,
    androidLanguage: config.androidLanguage,
    fileExtension: config.androidLanguage === "java" ? "java" : "kt",
    androidSourceDir: config.androidLanguage === "java" ? "java" : "kotlin",
  };

  let generatedCount = 0;

  // Process Native Modules
  for (const moduleConfig of config.nativeModules) {
    const { name: moduleName, className } = moduleConfig;

    // Find the corresponding interface by matching className or moduleName
    let methodsOrProps = interfaceMethodsMap.get(className);
    if (!methodsOrProps) {
      methodsOrProps = interfaceMethodsMap.get(moduleName);
    }
    if (!methodsOrProps) {
      methodsOrProps = interfaceMethodsMap.get(moduleName + "Module");
    }

    // Ensure we have methods (not properties) for native modules
    if (
      !methodsOrProps ||
      !Array.isArray(methodsOrProps) ||
      methodsOrProps.length === 0
    ) {
      console.warn(
        `⚠️  No interface found for module ${className}, skipping...`
      );
      continue;
    }

    // Type guard to ensure we have MethodInfo[]
    const methods = methodsOrProps as MethodInfo[];
    if (!methods[0] || !("params" in methods[0])) {
      console.warn(
        `⚠️  Interface for ${className} is not a module interface (missing methods), skipping...`
      );
      continue;
    }

    // Use the modular generator
    generateNativeModule(moduleConfig, methods, codegenContext);
    generatedCount++;
  }

  // Process Elements (RFC requirement)
  for (const elementConfig of config.elements) {
    const elementName = elementConfig.name;

    // Get ElementInfo from the parser
    const elementInfo = elementInfoMap.get(elementName);

    if (elementInfo) {
      // Add tagName from config to ElementInfo
      const enhancedElementInfo = {
        ...elementInfo,
        tagName: elementConfig.tagName
      };
      // Use the ElementInfo-based generator
      generateElement(enhancedElementInfo, codegenContext);
    } else {
      console.warn(
        `⚠️  No props interface found for element ${elementName}, creating basic template...`
      );
      
      // Create basic ElementInfo for elements without interfaces
      const basicElementInfo = {
        name: elementName,
        tagName: elementConfig.tagName,
        properties: []
      };
      
      generateElement(basicElementInfo, codegenContext);
    }
    generatedCount++;
  }

  // Process Services (RFC requirement)
  for (const serviceName of config.services) {
    // Find service interface
    const serviceMethodsOrProps = interfaceMethodsMap.get(serviceName);

    if (!serviceMethodsOrProps) {
      console.warn(
        `⚠️  No interface found for service ${serviceName}, creating basic template...`
      );
    }

    // Type guard to ensure we have MethodInfo[]
    const methods = serviceMethodsOrProps as MethodInfo[] | undefined;

    // Use the modular generator
    generateService(serviceName, methods, codegenContext);
    generatedCount++;
  }

  console.log(
    `✅ Codegen completed: Generated ${generatedCount} extension(s) following RFC architecture`
  );
  console.log(`📁 Generated base classes in generated/ folders`);
  console.log(`📁 Created implementation templates (extend base classes)`);
  console.log(`📁 Generated root TypeScript bindings in generated/`);
  console.log(
    `\n🔄 Next: Implement your logic in the generated template files!`
  );
}

/**
 * Service code generation
 * Handles generation of service interfaces and implementations
 */

import fs from "fs";
import path from "path";
import { convertType } from "../../utils/type-converter.js";
import type { MethodInfo, CodegenContext } from "../types.js";

export function generateService(
  serviceName: string,
  methods: MethodInfo[] | undefined,
  context: CodegenContext
): void {
  console.log(`🔨 Generating Service: ${serviceName}...`);

  // Generate Android service implementation
  generateAndroidService(serviceName, methods, context);

  // Generate TypeScript service interface
  generateTypeScriptService(serviceName, methods);

  console.log(`  ✅ Generated service: ${serviceName} for all platforms`);
}

function generateAndroidService(
  serviceName: string,
  methods: MethodInfo[] | undefined,
  context: CodegenContext
): void {
  const { androidPackageName, androidLanguage, fileExtension, androidSourceDir } = context;
  const serviceMethods = methods || [];

  // Generate Android service implementation template (only if it doesn't exist)
  const androidImplFile = path.join(
    `./android/src/main/${androidSourceDir}`,
    ...androidPackageName.split("."),
    `${serviceName}.${fileExtension}`
  );
  
  if (!fs.existsSync(androidImplFile)) {
    if (androidLanguage === "kotlin") {
      generateKotlinService(androidImplFile, serviceName, serviceMethods, androidPackageName);
    } else {
      generateJavaService(androidImplFile, serviceName, serviceMethods, androidPackageName);
    }
  }
}

function generateKotlinService(
  implFile: string,
  serviceName: string,
  methods: MethodInfo[],
  packageName: string
): void {
  const methodImplementations = methods.map((method) => {
    const params = method.params
      .map((p) => {
        const kotlinType = convertType(p.typeText, "kotlin");
        return `${p.paramName}: ${kotlinType}${p.isOptional ? '?' : ''}`;
      })
      .join(", ");
    const returnType = convertType(method.returnType, "kotlin");
    return `  override fun ${method.name}(${params}): ${returnType} {
    // TODO: Implement ${method.name}
    ${returnType !== "Unit" ? 'TODO("Implement return value")' : '// Implementation needed'}
  }`;
  }).join("\n\n");

  const ktImplContent = `package ${packageName}

import com.tigermodule.autolink.LynxService

/**
 * Implementation of ${serviceName} service
 * Implement your service logic here
 */
@LynxService
object ${serviceName} {

${methodImplementations}

  // Service initialization (if needed)
  fun initialize() {
    // TODO: Add any initialization logic
  }
}`;

  fs.writeFileSync(implFile, ktImplContent);
}

function generateJavaService(
  implFile: string,
  serviceName: string,
  methods: MethodInfo[],
  packageName: string
): void {
  const methodImplementations = methods.map((method) => {
    const params = method.params
      .map((p) => {
        const javaType = convertType(p.typeText, "java");
        return `${javaType} ${p.paramName}`;
      })
      .join(", ");
    const returnType = convertType(method.returnType, "java");
    return `  public ${returnType} ${method.name}(${params}) {
    // TODO: Implement ${method.name}
    ${returnType !== "void" ? 'throw new UnsupportedOperationException("Not implemented");' : '// Implementation needed'}
  }`;
  }).join("\n\n");

  const javaImplContent = `package ${packageName};

import com.tigermodule.autolink.LynxService;

/**
 * Implementation of ${serviceName} service
 * Implement your service logic here
 */
@LynxService
public class ${serviceName} {
  
  // Singleton instance (optional pattern)
  private static ${serviceName} instance;
  
  public static ${serviceName} getInstance() {
    if (instance == null) {
      instance = new ${serviceName}();
    }
    return instance;
  }

${methodImplementations}

  // Service initialization (if needed)
  public static void initialize() {
    // TODO: Add any initialization logic
  }
}`;

  fs.writeFileSync(implFile, javaImplContent);
}

function generateTypeScriptService(
  serviceName: string,
  methods: MethodInfo[] | undefined
): void {
  // Generate root service bindings
  const rootServiceDir = path.join("./generated");
  fs.mkdirSync(rootServiceDir, { recursive: true });

  const rootServiceFile = path.join(rootServiceDir, `${serviceName}.ts`);
  const serviceMethods = methods || [];

  const serviceContent = `/**
 * Generated Service interface for ${serviceName}
 * DO NOT EDIT - This file is auto-generated
 */

export interface ${serviceName}Interface {
${
  serviceMethods.length > 0
    ? serviceMethods
        .map((method) => {
          const params = method.params
            .map(
              (p) => `${p.paramName}${p.isOptional ? "?" : ""}: ${p.typeText}`
            )
            .join(", ");
          return `  ${method.name}(${params}): ${method.returnType};`;
        })
        .join("\n")
    : "  // Define your service methods in src/module.ts"
}
}

// Export for use in Lynx applications
export { ${serviceName}Interface as ${serviceName} };`;

  fs.writeFileSync(rootServiceFile, serviceContent);
}
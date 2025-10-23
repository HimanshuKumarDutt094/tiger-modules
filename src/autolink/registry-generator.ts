/**
 * Registry generator for platform-specific code
 * Generates registration code for Android (Kotlin), iOS (Objective-C), and Web (TypeScript)
 */

import type {
  ExtensionInfo,
  ModuleInfo,
  ElementInfo,
  ServiceInfo,
} from "./discovery.js";

/**
 * Registry generation result
 */
export interface RegistryGenerationResult {
  /** Generated code content */
  code: string;
  /** Output file path (relative to platform directory) */
  outputPath: string;
  /** Any warnings during generation */
  warnings: string[];
}

/**
 * Registry generator for all platforms
 */
export class RegistryGenerator {
  /**
   * Generates Android Kotlin registration code
   * @param extensions - List of extensions to register
   * @param packageName - Android package name for generated code
   * @returns Generation result with Kotlin code
   */
  generateAndroidRegistry(
    extensions: ExtensionInfo[],
    packageName: string = "com.lynxjs.generated.extensions",
  ): RegistryGenerationResult {
    const warnings: string[] = [];
    const imports = new Set<string>();
    const registrations: string[] = [];

    // Add base imports for LynxJS
    imports.add("import android.content.Context");
    imports.add("import com.lynx.tasm.LynxEnv");
    imports.add("import com.lynx.tasm.behavior.Behavior");
    imports.add("import com.lynx.tasm.behavior.LynxContext");

    // Process each extension
    for (const extension of extensions) {
      // Skip extensions without Android support
      if (!extension.platforms.includes("android")) {
        warnings.push(`Skipping ${extension.name}: no Android support`);
        continue;
      }

      const androidConfig = extension.config.platforms.android;
      if (!androidConfig) {
        warnings.push(
          `Skipping ${extension.name}: missing Android configuration`,
        );
        continue;
      }

      // Generate registrations for native modules using LynxEnv.inst().registerModule()
      for (const module of extension.nativeModules) {
        if (module.platform === "android") {
          const fullyQualifiedClassName = this.getAndroidClassName(
            module,
            androidConfig.packageName,
          );
          if (fullyQualifiedClassName) {
            imports.add(`import ${fullyQualifiedClassName}`);
            registrations.push(
              `        // Register native module: ${module.name} from ${extension.name}`,
              `        // Source: ${androidConfig.packageName}.${module.className}`,
              `        try {`,
              `            LynxEnv.inst().registerModule("${module.name}", ${module.className}::class.java)`,
              `            android.util.Log.d("ExtensionRegistry", "Registered module: ${module.name}")`,
              `        } catch (e: Exception) {`,
              `            android.util.Log.e("ExtensionRegistry", "Failed to register module ${module.name}: \${e.message}")`,
              `        }`,
            );
          }
        }
      }

      // Generate registrations for elements using LynxEnv.inst().addBehavior()
      for (const element of extension.elements) {
        if (element.platform === "android") {
          const fullyQualifiedClassName = this.getAndroidClassName(
            element,
            androidConfig.packageName,
          );
          if (fullyQualifiedClassName) {
            imports.add(`import ${fullyQualifiedClassName}`);
            registrations.push(
              `        // Register custom element: ${element.name} from ${extension.name}`,
              `        // Source: ${androidConfig.packageName}.${element.className}`,
              `        try {`,
              `            LynxEnv.inst().addBehavior(object : Behavior("${element.name}") {`,
              `                override fun createUI(context: LynxContext): ${element.className} {`,
              `                    return ${element.className}(context)`,
              `                }`,
              `            })`,
              `            android.util.Log.d("ExtensionRegistry", "Registered element: ${element.name}")`,
              `        } catch (e: Exception) {`,
              `            android.util.Log.e("ExtensionRegistry", "Failed to register element ${element.name}: \${e.message}")`,
              `        }`,
            );
          }
        }
      }

      // Generate registrations for services (if LynxJS has a service registration API)
      for (const service of extension.services) {
        if (service.platform === "android") {
          const fullyQualifiedClassName = this.getAndroidClassName(
            service,
            androidConfig.packageName,
          );
          if (fullyQualifiedClassName) {
            imports.add(`import ${fullyQualifiedClassName}`);
            registrations.push(
              `        // Register service: ${service.name} from ${extension.name}`,
              `        // Source: ${androidConfig.packageName}.${service.className}`,
              `        // TODO: Add proper service registration API call`,
              `        android.util.Log.d("ExtensionRegistry", "Service ${service.name} needs manual registration")`,
              ``,
            );
          }
        }
      }
    }

    // Build the complete Kotlin file
    const code = this.buildAndroidRegistryCode(
      packageName,
      imports,
      registrations,
    );

    return {
      code,
      outputPath: `${packageName.replace(/\./g, "/")}/ExtensionRegistry.kt`,
      warnings,
    };
  }

  /**
   * Builds the complete Android registry Kotlin code
   * @param packageName - Package name for the generated file
   * @param imports - Set of import statements
   * @param registrations - List of registration code lines
   * @returns Complete Kotlin code
   */
  private buildAndroidRegistryCode(
    packageName: string,
    imports: Set<string>,
    registrations: string[],
  ): string {
    const lines: string[] = [];

    // File header
    lines.push(
      "/**",
      " * Auto-generated extension registry for LynxJS",
      " * DO NOT EDIT - This file is generated by the Autolink system",
      " */",
      "",
      `package ${packageName}`,
      "",
    );

    // Imports
    const sortedImports = Array.from(imports).sort();
    lines.push(...sortedImports, "");

    // Registry object
    lines.push(
      "/**",
      " * Extension registry that registers all discovered extensions",
      " */",
      "object ExtensionRegistry {",
      "    /**",
      "     * Sets up all extensions with the given context",
      "     * @param context Android application context",
      "     */",
      "    fun setupGlobal(context: Context) {",
    );

    if (registrations.length > 0) {
      lines.push(...registrations);
    } else {
      lines.push("        // No extensions to register");
    }

    lines.push("    }", "}", "");

    return lines.join("\n");
  }

  /**
   * Gets the fully qualified Android class name
   * @param item - Module, element, or service info
   * @param packageName - Android package name
   * @returns Fully qualified class name
   */
  private getAndroidClassName(
    item: ModuleInfo | ElementInfo | ServiceInfo,
    packageName: string,
  ): string | null {
    if (!item.className) {
      return null;
    }
    return `${packageName}.${item.className}`;
  }

  /**
   * Generates iOS Objective-C header file
   * @param extensions - List of extensions to register
   * @returns Header file code
   */
  generateIOSRegistryHeader(extensions: ExtensionInfo[]): string {
    return this.buildIOSHeaderCode();
  }

  /**
   * Generates iOS Objective-C implementation file
   * @param extensions - List of extensions to register
   * @returns Implementation file code
   */
  generateIOSRegistryImplementation(extensions: ExtensionInfo[]): string {
    const warnings: string[] = [];
    const imports = new Set<string>();
    const registrations: string[] = [];

    // Add base imports
    imports.add("#import <Foundation/Foundation.h>");
    imports.add("#import <Lynx/LynxConfig.h>");

    // Process each extension
    for (const extension of extensions) {
      // Skip extensions without iOS support
      if (!extension.platforms.includes("ios")) {
        continue;
      }

      const iosConfig = extension.config.platforms.ios;
      if (!iosConfig) {
        continue;
      }

      // Generate registrations for native modules
      for (const module of extension.nativeModules) {
        if (module.platform === "ios") {
          const headerName = this.getIOSHeaderName(module);
          if (headerName) {
            imports.add(`#import "${headerName}"`);
            registrations.push(
              `    // Register module: ${module.name} from ${extension.name}`,
              `    @try {`,
              `        [config registerNativeModule:[${module.className} class] withName:@"${module.name}"];`,
              `    } @catch (NSException *exception) {`,
              `        NSLog(@"Failed to register module ${module.name}: %@", exception.reason);`,
              `    }`,
            );
          }
        }
      }

      // Generate registrations for elements
      for (const element of extension.elements) {
        if (element.platform === "ios") {
          const headerName = this.getIOSHeaderName(element);
          if (headerName) {
            imports.add(`#import "${headerName}"`);
            registrations.push(
              `    // Register element: ${element.name} from ${extension.name}`,
              `    @try {`,
              `        [config registerElement:[${element.className} class] withName:@"${element.name}"];`,
              `    } @catch (NSException *exception) {`,
              `        NSLog(@"Failed to register element ${element.name}: %@", exception.reason);`,
              `    }`,
            );
          }
        }
      }

      // Generate registrations for services
      for (const service of extension.services) {
        if (service.platform === "ios") {
          const headerName = this.getIOSHeaderName(service);
          if (headerName) {
            imports.add(`#import "${headerName}"`);
            registrations.push(
              `    // Register service: ${service.name} from ${extension.name}`,
              `    @try {`,
              `        [config registerService:[${service.className} class]];`,
              `    } @catch (NSException *exception) {`,
              `        NSLog(@"Failed to register service ${service.name}: %@", exception.reason);`,
              `    }`,
            );
          }
        }
      }
    }

    return this.buildIOSImplementationCode(imports, registrations);
  }

  /**
   * Generates iOS Objective-C registration code
   * @param extensions - List of extensions to register
   * @returns Generation results for header and implementation files
   */
  generateIOSRegistry(extensions: ExtensionInfo[]): {
    header: RegistryGenerationResult;
    implementation: RegistryGenerationResult;
  } {
    const warnings: string[] = [];
    const imports = new Set<string>();
    const registrations: string[] = [];

    // Add base imports
    imports.add("#import <Foundation/Foundation.h>");
    imports.add("#import <Lynx/LynxConfig.h>");

    // Process each extension
    for (const extension of extensions) {
      // Skip extensions without iOS support
      if (!extension.platforms.includes("ios")) {
        warnings.push(`Skipping ${extension.name}: no iOS support`);
        continue;
      }

      const iosConfig = extension.config.platforms.ios;
      if (!iosConfig) {
        warnings.push(`Skipping ${extension.name}: missing iOS configuration`);
        continue;
      }

      // Generate registrations for native modules
      for (const module of extension.nativeModules) {
        if (module.platform === "ios") {
          const headerName = this.getIOSHeaderName(module);
          if (headerName) {
            imports.add(`#import "${headerName}"`);
            registrations.push(
              `    // Register module: ${module.name} from ${extension.name}`,
              `    @try {`,
              `        [config registerNativeModule:[${module.className} class] withName:@"${module.name}"];`,
              `    } @catch (NSException *exception) {`,
              `        NSLog(@"Failed to register module ${module.name}: %@", exception.reason);`,
              `    }`,
            );
          }
        }
      }

      // Generate registrations for elements
      for (const element of extension.elements) {
        if (element.platform === "ios") {
          const headerName = this.getIOSHeaderName(element);
          if (headerName) {
            imports.add(`#import "${headerName}"`);
            registrations.push(
              `    // Register element: ${element.name} from ${extension.name}`,
              `    @try {`,
              `        [config registerElement:[${element.className} class] withName:@"${element.name}"];`,
              `    } @catch (NSException *exception) {`,
              `        NSLog(@"Failed to register element ${element.name}: %@", exception.reason);`,
              `    }`,
            );
          }
        }
      }

      // Generate registrations for services
      for (const service of extension.services) {
        if (service.platform === "ios") {
          const headerName = this.getIOSHeaderName(service);
          if (headerName) {
            imports.add(`#import "${headerName}"`);
            registrations.push(
              `    // Register service: ${service.name} from ${extension.name}`,
              `    @try {`,
              `        [config registerService:[${service.className} class]];`,
              `    } @catch (NSException *exception) {`,
              `        NSLog(@"Failed to register service ${service.name}: %@", exception.reason);`,
              `    }`,
            );
          }
        }
      }
    }

    // Build header file
    const headerCode = this.buildIOSHeaderCode();

    // Build implementation file
    const implementationCode = this.buildIOSImplementationCode(
      imports,
      registrations,
    );

    return {
      header: {
        code: headerCode,
        outputPath: "ExtensionRegistry.h",
        warnings: [],
      },
      implementation: {
        code: implementationCode,
        outputPath: "ExtensionRegistry.m",
        warnings,
      },
    };
  }

  /**
   * Builds the iOS header file code
   * @returns Objective-C header code
   */
  private buildIOSHeaderCode(): string {
    const lines: string[] = [];

    lines.push(
      "/**",
      " * Auto-generated extension registry for LynxJS",
      " * DO NOT EDIT - This file is generated by the Autolink system",
      " */",
      "",
      "#import <Foundation/Foundation.h>",
      "",
      "@class LynxConfig;",
      "",
      "NS_ASSUME_NONNULL_BEGIN",
      "",
      "/**",
      " * Extension registry that registers all discovered extensions",
      " */",
      "@interface ExtensionRegistry : NSObject",
      "",
      "/**",
      " * Sets up all extensions with the given configuration",
      " * @param config LynxJS configuration object",
      " */",
      "- (void)setupWithConfig:(LynxConfig *)config;",
      "",
      "@end",
      "",
      "NS_ASSUME_NONNULL_END",
      "",
    );

    return lines.join("\n");
  }

  /**
   * Builds the iOS implementation file code
   * @param imports - Set of import statements
   * @param registrations - List of registration code lines
   * @returns Objective-C implementation code
   */
  private buildIOSImplementationCode(
    imports: Set<string>,
    registrations: string[],
  ): string {
    const lines: string[] = [];

    // File header
    lines.push(
      "/**",
      " * Auto-generated extension registry for LynxJS",
      " * DO NOT EDIT - This file is generated by the Autolink system",
      " */",
      "",
      '#import "ExtensionRegistry.h"',
    );

    // Imports
    const sortedImports = Array.from(imports).sort();
    lines.push(...sortedImports, "");

    // Implementation
    lines.push(
      "@implementation ExtensionRegistry",
      "",
      "- (void)setupWithConfig:(LynxConfig *)config {",
    );

    if (registrations.length > 0) {
      lines.push(...registrations);
    } else {
      lines.push("    // No extensions to register");
    }

    lines.push("}", "", "@end", "");

    return lines.join("\n");
  }

  /**
   * Gets the iOS header file name for a module/element/service
   * @param item - Module, element, or service info
   * @returns Header file name
   */
  private getIOSHeaderName(
    item: ModuleInfo | ElementInfo | ServiceInfo,
  ): string | null {
    if (!item.className) {
      return null;
    }
    return `${item.className}.h`;
  }

  /**
   * Generates Web TypeScript registration code
   * @param extensions - List of extensions to register
   * @returns Generation result with TypeScript code
   */
  generateWebRegistry(extensions: ExtensionInfo[]): RegistryGenerationResult {
    const warnings: string[] = [];
    const imports: string[] = [];
    const registrations: string[] = [];

    // Process each extension
    for (const extension of extensions) {
      // Skip extensions without web support
      if (!extension.platforms.includes("web")) {
        warnings.push(`Skipping ${extension.name}: no web support`);
        continue;
      }

      const webConfig = extension.config.platforms.web;
      if (!webConfig) {
        warnings.push(`Skipping ${extension.name}: missing web configuration`);
        continue;
      }

      // Generate dynamic imports and registrations for native modules
      for (const module of extension.nativeModules) {
        if (module.platform === "web") {
          const importPath = this.getWebImportPath(extension, module);
          if (importPath) {
            imports.push(
              `// Import module: ${module.name} from ${extension.name}`,
              `const ${module.className}Module = await import('${importPath}');`,
            );
            registrations.push(
              `    // Register module: ${module.name}`,
              `    try {`,
              `        NativeModuleRegistry.register('${module.name}', ${module.className}Module.${module.className});`,
              `    } catch (error) {`,
              `        console.error('Failed to register module ${module.name}:', error);`,
              `    }`,
            );
          }
        }
      }

      // Generate dynamic imports and registrations for elements
      for (const element of extension.elements) {
        if (element.platform === "web") {
          const importPath = this.getWebImportPath(extension, element);
          if (importPath) {
            imports.push(
              `// Import element: ${element.name} from ${extension.name}`,
              `const ${element.className}Element = await import('${importPath}');`,
            );
            registrations.push(
              `    // Register element: ${element.name}`,
              `    try {`,
              `        customElements.define('${element.name}', ${element.className}Element.${element.className});`,
              `    } catch (error) {`,
              `        console.error('Failed to register element ${element.name}:', error);`,
              `    }`,
            );
          }
        }
      }

      // Generate dynamic imports and registrations for services
      for (const service of extension.services) {
        if (service.platform === "web") {
          const importPath = this.getWebImportPath(extension, service);
          if (importPath) {
            imports.push(
              `// Import service: ${service.name} from ${extension.name}`,
              `const ${service.className}Service = await import('${importPath}');`,
            );
            registrations.push(
              `    // Register service: ${service.name}`,
              `    try {`,
              `        ServiceRegistry.register(${service.className}Service.${service.className});`,
              `    } catch (error) {`,
              `        console.error('Failed to register service ${service.name}:', error);`,
              `    }`,
            );
          }
        }
      }
    }

    // Build the complete TypeScript file
    const code = this.buildWebRegistryCode(imports, registrations);

    return {
      code,
      outputPath: "extension-registry.ts",
      warnings,
    };
  }

  /**
   * Builds the complete web registry TypeScript code
   * @param imports - List of import statements
   * @param registrations - List of registration code lines
   * @returns Complete TypeScript code
   */
  private buildWebRegistryCode(
    imports: string[],
    registrations: string[],
  ): string {
    const lines: string[] = [];

    // File header
    lines.push(
      "/**",
      " * Auto-generated extension registry for LynxJS",
      " * DO NOT EDIT - This file is generated by the Autolink system",
      " */",
      "",
    );

    // Registry function
    lines.push(
      "/**",
      " * Sets up all extensions for the web platform",
      " * Uses dynamic imports for code splitting and lazy loading",
      " */",
      "export async function setupExtensions(): Promise<void> {",
    );

    if (imports.length > 0) {
      lines.push(
        "    // Dynamic imports",
        ...imports.map((line) => `    ${line}`),
        "",
      );
    }

    if (registrations.length > 0) {
      lines.push(...registrations);
    } else {
      lines.push("    // No extensions to register");
    }

    lines.push(
      "}",
      "",
      "/**",
      " * Initializes the extension registry",
      " * Call this function during application startup",
      " */",
      "export function initializeExtensionRegistry(): void {",
      "    setupExtensions().catch((error) => {",
      "        console.error('Failed to initialize extension registry:', error);",
      "    });",
      "}",
      "",
    );

    return lines.join("\n");
  }

  /**
   * Gets the web import path for a module/element/service
   * @param extension - Extension info
   * @param item - Module, element, or service info
   * @returns Import path for dynamic import
   */
  private getWebImportPath(
    extension: ExtensionInfo,
    item: ModuleInfo | ElementInfo | ServiceInfo,
  ): string | null {
    if (!item.className) {
      return null;
    }

    const webConfig = extension.config.platforms.web;
    if (!webConfig?.entry) {
      return `${extension.name}`;
    }

    // Use the package name for npm imports
    return extension.name;
  }
}

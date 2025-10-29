#!/usr/bin/env node

import { Project, SourceFile, InterfaceDeclaration } from "ts-morph";
import fs from "fs";
import path from "path";
import { loadConfig } from "../autolink/config-loader.js";

// Load config from tiger.config.ts/js/json (async version)
async function loadModuleConfig(): Promise<{
  moduleName: string;
  androidPackageName: string;
  srcFile: string;
  moduleType: "service" | "element" | "mixed";
}> {
  const { config: autolinkConfig, configFile } = await loadConfig();
  console.log(`✓ Loaded configuration from ${configFile}`);

  if (!autolinkConfig.platforms?.android?.packageName) {
    throw new Error(`${configFile} missing platforms.android.packageName`);
  }

  const hasNativeModules =
    autolinkConfig.nativeModules && autolinkConfig.nativeModules.length > 0;
  const hasElements =
    autolinkConfig.elements && autolinkConfig.elements.length > 0;

  let moduleName: string;
  let moduleType: "service" | "element" | "mixed";

  if (hasNativeModules && hasElements) {
    moduleType = "mixed";
    moduleName = autolinkConfig.nativeModules![0].name;
  } else if (hasNativeModules) {
    moduleType = "service";
    moduleName = autolinkConfig.nativeModules![0].name;
  } else if (hasElements) {
    moduleType = "element";
    moduleName = autolinkConfig.elements![0].name;
  } else {
    throw new Error(
      `${configFile} must have either nativeModules or elements defined`
    );
  }

  return {
    moduleName,
    androidPackageName: autolinkConfig.platforms.android.packageName,
    srcFile: "./src/module.ts",
    moduleType,
  };
}

export async function generateGlobalDts(
  outputPath: string = "./global.d.ts"
): Promise<void> {
  const config = await loadModuleConfig();

  // --- Load TS source ---
  const project = new Project();
  const srcPath = path.resolve(config.srcFile);

  let sourceFile: SourceFile | undefined;
  let interfaceDecl: InterfaceDeclaration | undefined;
  let methods: any[] = [];

  // Load source file if it exists (for both services and elements)
  if (fs.existsSync(srcPath)) {
    sourceFile = project.addSourceFileAtPath(srcPath);

    // For service modules, look for TigerModule interface
    if (config.moduleType === "service" || config.moduleType === "mixed") {
      interfaceDecl = sourceFile
        .getInterfaces()
        .find((i) => i.getExtends().some((e) => e.getText() === "TigerModule"));

      if (interfaceDecl) {
        methods = interfaceDecl.getMethods().map((m) => {
          const name = m.getName();
          const params = m.getParameters().map((p) => {
            const paramName = p.getName();
            const isOptional = p.isOptional();
            const typeNode = p.getTypeNode();
            const typeText = typeNode
              ? typeNode.getText()
              : p.getType().getText();
            return { paramName, isOptional, typeText };
          });
          const returnType = m.getReturnType().getText() || "void";
          return { name, params, returnType };
        });
      }
    }
  }

  // --- Load autolink config to get elements and modules ---
  const { config: autolinkConfig } = await loadConfig();

  // --- Detect and preserve original import style from source ---
  let lynxImportStyle = "namespace"; // default to namespace import
  let lynxImportAlias = "Lynx"; // default alias

  if (sourceFile) {
    const imports = sourceFile.getImportDeclarations();
    const lynxImport = imports.find((imp) =>
      imp.getModuleSpecifierValue().includes("@lynx-js/types")
    );

    if (lynxImport) {
      const namespaceImport = lynxImport.getNamespaceImport();
      if (namespaceImport) {
        lynxImportStyle = "namespace";
        lynxImportAlias = namespaceImport.getText();
      } else {
        // Check if it's a named import
        const namedImports = lynxImport.getNamedImports();
        if (namedImports.length > 0) {
          lynxImportStyle = "named";
        }
      }
    }
  }

  // --- Generate d.ts content ---
  let dtsContent = `/// <reference types="@lynx-js/types" />\n`;

  // Use the detected import style
  if (lynxImportStyle === "namespace") {
    dtsContent += `import type * as ${lynxImportAlias} from "@lynx-js/types";\n`;
  } else {
    // Fallback to named imports if that's what was used
    dtsContent += `import type { BaseEvent, CSSProperties } from "@lynx-js/types";\n`;
  }

  // Add IntrinsicElements import only if we have elements
  const hasElements =
    autolinkConfig.elements && autolinkConfig.elements.length > 0;
  if (hasElements) {
    dtsContent += `import type { IntrinsicElements as LynxIntrinsicElements } from "@lynx-js/types";\n`;
  }

  dtsContent += `\n`;

  dtsContent += `declare global {\n`;

  // Auto-discover native modules from source file (interfaces extending TigerModule)
  const discoveredModules: Array<{ name: string; methods: any[] }> = [];

  if (sourceFile) {
    const tigerModuleInterfaces = sourceFile
      .getInterfaces()
      .filter((i) => i.getExtends().some((e) => e.getText() === "TigerModule"));

    tigerModuleInterfaces.forEach((iface) => {
      const moduleName = iface.getName(); // Use the exact interface name as module name
      const moduleMethods = iface.getMethods().map((m) => {
        const name = m.getName();
        const params = m.getParameters().map((p) => {
          const paramName = p.getName();
          const isOptional = p.isOptional();
          const typeNode = p.getTypeNode();
          const typeText = typeNode
            ? typeNode.getText()
            : p.getType().getText();
          return { paramName, isOptional, typeText };
        });
        const returnType = m.getReturnType().getText() || "void";
        return { name, params, returnType };
      });

      discoveredModules.push({ name: moduleName, methods: moduleMethods });
    });
  }

  // Merge config modules with discovered modules
  const configModules = autolinkConfig.nativeModules || [];
  const allModuleNames = new Set([
    ...configModules.map((m) => m.name),
    ...discoveredModules.map((m) => m.name),
  ]);

  // Generate native modules declarations
  const hasModules = allModuleNames.size > 0;
  if (hasModules) {
    dtsContent += `  interface NativeModules {\n`;

    allModuleNames.forEach((moduleName) => {
      // Find the discovered module with methods
      const discoveredModule = discoveredModules.find(
        (m) => m.name === moduleName
      );

      if (discoveredModule && discoveredModule.methods.length > 0) {
        // Use discovered methods from source
        dtsContent += `    ${moduleName}: {\n`;
        dtsContent += discoveredModule.methods
          .map((m) => {
            const params = m.params
              .map(
                (p: any) =>
                  `${p.paramName}${p.isOptional ? "?" : ""}: ${p.typeText}`
              )
              .join(", ");
            return `      ${m.name}(${params}): ${m.returnType};`;
          })
          .join("\n");
        dtsContent += `\n    };\n`;
      } else {
        // Module in config but no interface found - generate placeholder
        dtsContent += `    ${moduleName}: {\n      // Add method signatures here\n    };\n`;
      }
    });

    dtsContent += `  }\n`;
  }

  // Generate elements declarations
  if (hasElements) {
    if (hasModules) dtsContent += `\n`; // Add spacing between interfaces

    dtsContent += `  interface IntrinsicElements extends LynxIntrinsicElements {\n`;

    autolinkConfig.elements!.forEach((elementConfig) => {
      const elementName = elementConfig.name;
      // Use tagName from config if available, otherwise convert PascalCase to kebab-case
      const tagName =
        elementConfig.tagName ||
        elementName.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();

      // Look for element props interface in the source file
      const elementPropsInterface = sourceFile
        ?.getInterfaces()
        .find(
          (i: InterfaceDeclaration) => i.getName() === `${elementName}Props`
        );

      dtsContent += `    "${tagName}": {\n`;

      if (elementPropsInterface) {
        // Generate props from the interface - preserve original type references
        const props = elementPropsInterface.getProperties().map((prop: any) => {
          const name = prop.getName();
          const isOptional = prop.hasQuestionToken();
          const typeNode = prop.getTypeNode();
          let typeText = typeNode
            ? typeNode.getText()
            : prop.getType().getText();

          // If using namespace import style, preserve the namespace prefix
          // No need to transform - just use the original type text as-is

          return `      ${name}${isOptional ? "?" : ""}: ${typeText};`;
        });
        dtsContent += props.join("\n");
      } else {
        // No props interface found - element has no props
        dtsContent += `      // No props defined for this element`;
      }

      dtsContent += `\n    };\n`;
    });

    dtsContent += `  }\n`;
  }

  dtsContent += `}\n\n`;
  dtsContent += `export {};\n`;

  fs.writeFileSync(outputPath, dtsContent);
  console.log(`✅ Generated global.d.ts at ${outputPath}`);

  if (autolinkConfig.nativeModules?.length) {
    console.log(
      `   📦 Native modules: ${autolinkConfig.nativeModules
        .map((m) => m.name)
        .join(", ")}`
    );
  }

  if (autolinkConfig.elements?.length) {
    console.log(
      `   🎨 Elements: ${autolinkConfig.elements
        .map(
          (e) =>
            e.tagName ||
            e.name.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase()
        )
        .join(", ")}`
    );
  }
}

// If run directly from node
if (process.argv[1] && process.argv[1].endsWith("generate-types.ts")) {
  generateGlobalDts().catch((err: unknown) => {
    console.error(err);
    process.exit(1);
  });
}

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

  // --- Generate d.ts content ---
  let dtsContent = `/// <reference types="@lynx-js/types" />\nimport { BaseEvent, CSSProperties } from "@lynx-js/types";\n`;

  // Add IntrinsicElements import only if we have elements
  const hasElements =
    autolinkConfig.elements && autolinkConfig.elements.length > 0;
  if (hasElements) {
    dtsContent += `import { IntrinsicElements as LynxIntrinsicElements } from "@lynx-js/types";\n`;
  }

  dtsContent += `\n`;

  dtsContent += `declare global {\n`;

  // Generate native modules declarations
  const hasModules =
    autolinkConfig.nativeModules && autolinkConfig.nativeModules.length > 0;
  if (hasModules) {
    dtsContent += `  interface NativeModules {\n`;

    autolinkConfig.nativeModules!.forEach((moduleConfig) => {
      const moduleName = moduleConfig.name;

      if (
        interfaceDecl &&
        interfaceDecl.getName().toLowerCase().includes(moduleName.toLowerCase())
      ) {
        // This is the main module interface
        dtsContent += `    ${moduleName}: {\n`;
        dtsContent += methods
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
        // Other modules - generate placeholder
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
        // Generate props from the interface - ONLY the exact props defined
        const props = elementPropsInterface.getProperties().map((prop: any) => {
          const name = prop.getName();
          const isOptional = prop.hasQuestionToken();
          const typeNode = prop.getTypeNode();
          const typeText = typeNode
            ? typeNode.getText()
            : prop.getType().getText();
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

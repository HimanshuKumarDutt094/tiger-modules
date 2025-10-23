#!/usr/bin/env node

import { Project } from "ts-morph";
import fs from "fs";
import path from "path";
import { loadConfig } from "./autolink/config-loader.js";

// Load config from tiger.config.ts/js/json (async version)
async function loadModuleConfig(): Promise<{
  moduleName: string;
  androidPackageName: string;
  srcFile: string;
}> {
  const { config: autolinkConfig, configFile } = await loadConfig();
  console.log(`✓ Loaded configuration from ${configFile}`);

  if (!autolinkConfig.platforms?.android?.packageName) {
    throw new Error(`${configFile} missing platforms.android.packageName`);
  }

  // Extract module info from nativeModules array
  const firstModule = autolinkConfig.nativeModules?.[0];
  if (!firstModule) {
    throw new Error(`${configFile} missing nativeModules array or it's empty`);
  }

  let moduleName: string;
  if (typeof firstModule === "string") {
    moduleName = firstModule.replace(/Module$/, "");
  } else {
    moduleName = firstModule.name;
  }

  return {
    moduleName,
    androidPackageName: autolinkConfig.platforms.android.packageName,
    srcFile: "./src/module.ts",
  };
}

export async function generateGlobalDts(
  outputPath: string = "./global.d.ts",
): Promise<void> {
  const config = await loadModuleConfig();

  // --- Load TS source ---
  const project = new Project();
  const srcPath = path.resolve(config.srcFile);
  const sourceFile = project.addSourceFileAtPath(srcPath);

  const interfaceDecl = sourceFile
    .getInterfaces()
    .find((i) => i.getExtends().some((e) => e.getText() === "TigerModule"));

  if (!interfaceDecl) {
    console.warn(
      "No interface extending TigerModule found, skipping global.d.ts generation",
    );
    return;
  }

  const methods = interfaceDecl.getMethods().map((m) => {
    const name = m.getName();
    const params = m.getParameters().map((p) => {
      const paramName = p.getName();
      const isOptional = p.isOptional();
      const typeNode = p.getTypeNode();
      const typeText = typeNode ? typeNode.getText() : p.getType().getText();
      return { paramName, isOptional, typeText };
    });
    const returnType = m.getReturnType().getText() || "void";
    return { name, params, returnType };
  });

  // --- Generate d.ts ---
  const dtsContent = `\n/// <reference types="@lynx-js/types" />\ndeclare global {\n  interface NativeModules {\n    ${interfaceDecl.getName()}: {\n${methods
    .map((m) => {
      const params = m.params
        .map(
          (p: any) => `${p.paramName}${p.isOptional ? "?" : ""}: ${p.typeText}`,
        )
        .join(", ");
      return `      ${m.name}(${params}): ${m.returnType};`;
    })
    .join("\n")}\n    };\n  }\n}\nexport {};\n`;

  fs.writeFileSync(outputPath, dtsContent);
  console.log(`✅ Generated global.d.ts at ${outputPath}`);
}

// If run directly from node
if (process.argv[1] && process.argv[1].endsWith("generate-types.ts")) {
  generateGlobalDts().catch((err: unknown) => {
    console.error(err);
    process.exit(1);
  });
}

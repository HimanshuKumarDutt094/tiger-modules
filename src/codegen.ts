#!/usr/bin/env node

import { Project } from "ts-morph";
import fs from "fs";
import path from "path";
import { convertType } from "./util";
import { loadConfig } from "./autolink/config-loader.js";
import { validateAutolinkConfig } from "./autolink/validation.js";

// Load config from lynx.ext.ts/js/json
async function loadModuleConfig(): Promise<{
  moduleName: string;
  androidPackageName: string;
  srcFile: string;
  androidLanguage: string;
  className: string;
}> {
  console.log("📦 Loading autolink extension configuration");
  const { config: autolinkConfig, configFile } = await loadConfig();

  console.log(`✓ Loaded configuration from ${configFile}`);

  if (!autolinkConfig.platforms?.android?.packageName) {
    throw new Error(`${configFile} missing platforms.android.packageName`);
  }

  // Extract module info from nativeModules array (supports both string[] and object[] formats)
  const firstModule = autolinkConfig.nativeModules?.[0];
  if (!firstModule) {
    throw new Error(`${configFile} missing nativeModules array or it's empty`);
  }

  // Handle both legacy string format and new structured format
  let moduleName: string;
  let className: string;

  if (typeof firstModule === "string") {
    // Legacy format: just a string
    moduleName = firstModule.replace(/Module$/, "");
    className = firstModule;
  } else {
    // New structured format: object with name, className
    moduleName = firstModule.name;
    className = firstModule.className;
  }

  // Language is always from platform config
  const androidLanguage = autolinkConfig.platforms.android.language || "kotlin";

  return {
    moduleName,
    className,
    androidPackageName: autolinkConfig.platforms.android.packageName,
    srcFile: "./src/module.ts",
    androidLanguage,
  };
}

export async function runCodegen(): Promise<void> {
  const config = await loadModuleConfig();

  // Validate autolink configuration
  console.log("🔍 Validating autolink configuration...");
  const { config: autolinkConfig } = await loadConfig();
  const validation = validateAutolinkConfig(autolinkConfig);

  if (!validation.valid) {
    console.error("❌ Configuration validation failed:");
    validation.errors.forEach((err) => {
      console.error(`  - ${err.message}`);
      if (err.suggestion) {
        console.error(`    💡 ${err.suggestion}`);
      }
    });
    throw new Error("Invalid configuration");
  }

  if (validation.warnings.length > 0) {
    console.warn("⚠️  Warnings:");
    validation.warnings.forEach((warn) => {
      console.warn(`  - ${warn}`);
    });
  }

  console.log("✓ Configuration is valid");

  // --- Load TS source ---
  const project = new Project();
  const srcPath = path.resolve(config.srcFile);
  const sourceFile = project.addSourceFileAtPath(srcPath);

  const interfaceDecl = sourceFile
    .getInterfaces()
    .find((i) => i.getExtends().some((e) => e.getText() === "TigerModule"));

  if (!interfaceDecl) throw new Error("No interface extending TigerModule");

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

  // Note: global.d.ts generation moved to build.ts for better workflow

  // --- Generate Kotlin or Java ---
  const androidPackage = config.androidPackageName;
  const className = config.className;
  const androidLanguage = config.androidLanguage;
  const fileExtension = androidLanguage === "java" ? "java" : "kt";
  const androidSourceDir = androidLanguage === "java" ? "java" : "kotlin";

  const androidFile = path.join(
    `./android/src/main/${androidSourceDir}`,
    ...androidPackage.split("."),
    `${className}.${fileExtension}`,
  );
  fs.mkdirSync(path.dirname(androidFile), { recursive: true });

  if (androidLanguage === "kotlin") {
    const ktMethods = methods
      .map((m) => {
        const params = m.params
          .map((p) => {
            const isCallback =
              /=>|\(.*\)\s*=>/.test(p.typeText) ||
              /callback/i.test(p.typeText) ||
              p.paramName === "callback";
            const kotlinType = isCallback
              ? "Callback"
              : convertType(p.typeText, "kotlin");
            // ensure nullability marker is on the type
            const finalType = kotlinType.endsWith("?")
              ? kotlinType
              : kotlinType + (p.isOptional ? "?" : "");
            return `${p.paramName}: ${finalType}`;
          })
          .join(", ");

        const returnType = convertType(m.returnType, "kotlin");
        return `  @LynxMethod\n  fun ${m.name}(${params})${
          returnType !== "Unit" ? `: ${returnType}` : ""
        } {\n    TODO()\n  }`;
      })
      .join("\n\n");

    const ktContent = `\npackage ${androidPackage}\n\nimport android.content.Context\nimport com.lynx.jsbridge.LynxMethod\nimport com.lynx.jsbridge.LynxModule\nimport com.lynx.tasm.behavior.LynxContext\nimport com.lynx.react.bridge.Callback\nimport com.lynx.react.bridge.ReadableArray\nimport com.lynx.react.bridge.ReadableMap\n\nclass ${className}(context: Context) : LynxModule(context) {\n  private fun getContext(): Context {\n    val lynxContext = mContext as LynxContext\n    return lynxContext.getContext()\n  }\n\n${ktMethods}\n}\n`;
    fs.writeFileSync(androidFile, ktContent.trim());
  } else {
    // Generate Java code
    const javaMethods = methods
      .map((m) => {
        const params = m.params
          .map((p) => {
            const isCallback =
              /=>|\(.*\)\s*=>/.test(p.typeText) ||
              /callback/i.test(p.typeText) ||
              p.paramName === "callback";
            const javaType = isCallback
              ? "Callback"
              : convertType(p.typeText, "java");
            return `${javaType} ${p.paramName}`;
          })
          .join(", ");

        const returnType = convertType(m.returnType, "java");
        return `  @LynxMethod\n  public ${returnType} ${m.name}(${params}) {\n    throw new UnsupportedOperationException("Not implemented");\n  }`;
      })
      .join("\n\n");

    const javaContent = `\npackage ${androidPackage};\n\nimport android.content.Context;\nimport com.lynx.jsbridge.LynxMethod;\nimport com.lynx.jsbridge.LynxModule;\nimport com.lynx.tasm.behavior.LynxContext;\nimport com.lynx.react.bridge.Callback;\nimport com.lynx.react.bridge.ReadableArray;\nimport com.lynx.react.bridge.ReadableMap;\n\npublic class ${className} extends LynxModule {\n  public ${className}(Context context) {\n    super(context);\n  }\n\n  private Context getContext() {\n    LynxContext lynxContext = (LynxContext) mContext;\n    return lynxContext.getContext();\n  }\n\n${javaMethods}\n}\n`;
    fs.writeFileSync(androidFile, javaContent.trim());
  }

  // --- Generate Swift ---
  const swiftDir = path.join("./ios/modules");
  fs.mkdirSync(swiftDir, { recursive: true });
  const swiftFile = path.join(swiftDir, `${className}.swift`);

  const methodLookupEntries = methods
    .map((m: any) => {
      const paramNames =
        m.params && m.params.length > 0
          ? m.params.map((p: any) => p.paramName).join(":")
          : "";
      const selectorParams = paramNames ? paramNames + ":" : paramNames;
      return `        "${m.name}": NSStringFromSelector(#selector(${m.name}(${selectorParams})))`;
    })
    .join(",\n");

  const swiftContent = `import Foundation\n\n@objcMembers\npublic final class ${className}: NSObject, LynxModule {\n\n    public static var name: String {\n        return "${className}"\n    }\n\n    public static var methodLookup: [String : String] {\n        return [\n${methodLookupEntries}\n        ]\n    }\n\n${methods
    .map((m: any) => {
      const swiftParams = m.params
        .map((p: any) => {
          const swiftType = convertType(p.typeText, "swift");
          const finalType = swiftType.endsWith("?")
            ? swiftType
            : swiftType + (p.isOptional ? "?" : "");
          return `${p.paramName}: ${finalType}`;
        })
        .join(", ");

      const returnType = convertType(m.returnType, "swift");
      return `    func ${m.name}(${swiftParams})${
        returnType !== "Void" ? ` -> ${returnType}` : ""
      } {\n        fatalError("Not implemented")\n    }`;
    })
    .join("\n\n")}\n}\n`;

  fs.writeFileSync(swiftFile, swiftContent.trim());

  const langLabel = androidLanguage === "java" ? "Java" : "Kotlin";
  console.log(`✅ Codegen completed: d.ts, ${langLabel}, Swift generated!`);
}

// If run directly from node
if (process.argv[1] && process.argv[1].endsWith("codegen.ts")) {
  runCodegen().catch((err: unknown) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
  });
}

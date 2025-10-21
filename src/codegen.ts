#!/usr/bin/env node

import { Project } from "ts-morph";
import fs from "node:fs";
import path from "node:path";
import { convertType } from "./util";

// Try to load module.config from cwd supporting .ts and .js
function loadConfig(): {
  moduleName: string;
  androidPackageName: string;
  srcFile: string;
} {
  const cwd = process.cwd();
  const tsPath = path.join(cwd, "module.config.ts");
  const jsPath = path.join(cwd, "module.config.js");

  if (fs.existsSync(tsPath)) {
    // load .ts via ts-node style dynamic import is complicated; instead transpile by reading file and eval minimal export
    // We'll require the user to have built or use ts-node; try dynamic import via node's loader for ES modules
    // Use import() which will work if the file is JS; for TS, attempt to compile in-memory is complex — fallback to reading values with regex
    const content = fs.readFileSync(tsPath, "utf8");
    const match = content.match(/moduleName:\s*"([^"]+)"/);
    const pkg = {
      moduleName: match ? match[1] : undefined,
      androidPackageName: (content.match(/androidPackageName:\s*"([^"]+)"/) ||
        [])[1],
      srcFile:
        (content.match(/srcFile:\s*"([^"]+)"/) || [])[1] || "./src/module.ts",
    } as any;
    if (!pkg.moduleName)
      throw new Error(
        "Could not parse module.config.ts; please ensure it exports config with moduleName"
      );
    return pkg;
  }

  if (fs.existsSync(jsPath)) {
    // dynamic import
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    // @ts-ignore
    const cfg = require(jsPath);
    return cfg.config || cfg.default || cfg;
  }

  throw new Error(
    "module.config.ts or module.config.js not found in current working directory"
  );
}

export async function runCodegen(): Promise<void> {
  const config = loadConfig();

  // --- Load TS source ---
  const project = new Project();
  const srcPath = path.resolve(config.srcFile);
  const sourceFile = project.addSourceFileAtPath(srcPath);

  const interfaceDecl = sourceFile
    .getInterfaces()
    .find((i) =>
      i.getExtends().some((e) => e.getText() === "TigerModule")
    );

  if (!interfaceDecl)
    throw new Error("No interface extending TigerModule");

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

  // --- Generate Kotlin ---
  const androidPackage = config.androidPackageName;
  const moduleName = config.moduleName;
  const ktFile = path.join(
    "./android/src/main/java",
    ...androidPackage.split("."),
    `${moduleName}Module.kt`
  );
  fs.mkdirSync(path.dirname(ktFile), { recursive: true });

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
      return `  @LynxMethod\n  fun ${m.name}(${params})${returnType !== "Unit" ? `: ${returnType}` : ""
        } {\n    TODO()\n  }`;
    })
    .join("\n\n");

  const ktContent = `\npackage ${androidPackage}\n\nimport android.content.Context\nimport com.lynx.jsbridge.LynxMethod\nimport com.lynx.jsbridge.LynxModule\nimport com.lynx.tasm.behavior.LynxContext\nimport com.lynx.react.bridge.Callback\nimport com.lynx.react.bridge.ReadableArray\nimport com.lynx.react.bridge.ReadableMap\n\nclass ${moduleName}Module(context: Context) : LynxModule(context) {\n  private fun getContext(): Context {\n    val lynxContext = mContext as LynxContext\n    return lynxContext.getContext()\n  }\n\n${ktMethods}\n}\n`;
  fs.writeFileSync(ktFile, ktContent.trim());

  // --- Generate Swift ---
  const swiftDir = path.join("./ios/modules");
  fs.mkdirSync(swiftDir, { recursive: true });
  const swiftFile = path.join(swiftDir, `${moduleName}Module.swift`);

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

  const swiftContent = `import Foundation\n\n@objcMembers\npublic final class ${moduleName}Module: NSObject, LynxModule {\n\n    public static var name: String {\n        return "${moduleName}Module"\n    }\n\n    public static var methodLookup: [String : String] {\n        return [\n${methodLookupEntries}\n        ]\n    }\n\n${methods
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
      return `    func ${m.name}(${swiftParams})${returnType !== "Void" ? ` -> ${returnType}` : ""
        } {\n        fatalError("Not implemented")\n    }`;
    })
    .join("\n\n")}\n}\n`;

  fs.writeFileSync(swiftFile, swiftContent.trim());

  console.log("✅ Codegen completed: d.ts, Kotlin, Swift generated!");
}

// If run directly from node
if (process.argv[1] && process.argv[1].endsWith("codegen.ts")) {
  runCodegen().catch((err: unknown) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
  });
}

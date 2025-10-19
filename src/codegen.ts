import { Project } from "ts-morph";
import fs from "fs";
import path from "path";
import { config } from "./module.config";
import { convertType } from "./util";

// --- Load TS source ---
const project = new Project();
const srcPath = path.resolve(config.srcFile);
const sourceFile = project.addSourceFileAtPath(srcPath);

const interfaceDecl = sourceFile
  .getInterfaces()
  .find((i) => i.getExtends().some((e) => e.getText() === "MyModuleGenerator"));

if (!interfaceDecl) throw new Error("No interface extending MyModuleGenerator");

const methods = interfaceDecl.getMethods().map((m) => {
  const name = m.getName();
  const params = m
    .getParameters()
    .map((p) => p.getText())
    .join(", ");
  const returnType = m.getReturnType().getText() || "void";
  return { name, params, returnType };
});

// --- Generate d.ts ---
const dtsContent = `
/// <reference types="@lynx-js/types" />
declare global {
  interface NativeModules {
    ${interfaceDecl.getName()}: {
${methods
  .map((m) => `      ${m.name}(${m.params}): ${m.returnType};`)
  .join("\n")}
    };
  }
}
export {};
`;
fs.writeFileSync(
  path.join("./", `${interfaceDecl.getName()}.d.ts`),
  dtsContent
);

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
      ? m.params
          .split(",")
          .map((p) => {
            const [name, type] = p.split(":").map((x) => x.trim());
            return `${name}: ${convertType(type, "kotlin")}`;
          })
          .join(", ")
      : "";

    const returnType = convertType(m.returnType, "kotlin");
    return `  @LynxMethod
  fun ${m.name}(${params})${returnType !== "Unit" ? `: ${returnType}` : ""} {
    TODO()
  }`;
  })
  .join("\n\n");

const ktContent = `
package ${androidPackage}

import android.content.Context
import com.lynx.jsbridge.LynxMethod
import com.lynx.jsbridge.LynxModule
import com.lynx.tasm.behavior.LynxContext
import com.lynx.react.bridge.Callback

class ${moduleName}Module(context: Context) : LynxModule(context) {
  private fun getContext(): Context {
    val lynxContext = mContext as LynxContext
    return lynxContext.getContext()
  }

${ktMethods}
}
`;
fs.writeFileSync(ktFile, ktContent.trim());

// --- Generate Swift ---
const swiftDir = path.join("./ios/modules");
fs.mkdirSync(swiftDir, { recursive: true });
const swiftFile = path.join(swiftDir, `${moduleName}Module.swift`);

// Generate methodLookup dictionary
const methodLookupEntries = methods
  .map((m) => {
    const paramNames = m.params
      ? m.params
          .split(",")
          .map((p) => p.trim().split(":")[0])
          .join(":")
      : "";
    const selectorParams =
      m.params && m.params.includes(",") ? paramNames + ":" : paramNames;
    return `        "${m.name}": NSStringFromSelector(#selector(${m.name}(${selectorParams})))`;
  })
  .join(",\n");

const swiftContent = `import Foundation

@objcMembers
public final class ${moduleName}Module: NSObject, LynxModule {

    public static var name: String {
        return "${moduleName}Module"
    }

    public static var methodLookup: [String : String] {
        return [
${methodLookupEntries}
        ]
    }

${methods
  .map((m) => {
    const tsParams = m.params ? m.params.split(",").map((p) => p.trim()) : [];
    const swiftParams = tsParams
      .map((p, i) => {
        const [name, type] = p.split(":").map((x) => x.trim());
        const safeType = type ?? "Any";
        const swiftType = convertType(safeType, "swift");
        return `${name}${i === 0 ? "" : "_"}: ${swiftType}`;
      })
      .join(", ");

    const returnType = convertType(m.returnType, "swift");
    return `    func ${m.name}(${swiftParams})${
      returnType !== "Void" ? ` -> ${returnType}` : ""
    } {
        fatalError("Not implemented")
    }`;
  })
  .join("\n\n")}
}
`;

fs.writeFileSync(swiftFile, swiftContent.trim());

console.log("✅ Codegen completed: d.ts, Kotlin, Swift generated!");

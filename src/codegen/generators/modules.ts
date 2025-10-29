/**
 * Native Module code generation
 * Handles generation of LynxModule-based native modules
 */

import fs from "fs";
import path from "path";
import { convertType } from "../../utils/type-converter.js";
import type { MethodInfo, CodegenContext } from "../types.js";
import type { NativeModuleConfig } from "../../autolink/config.js";

export function generateNativeModule(
  moduleConfig: NativeModuleConfig,
  methods: MethodInfo[],
  context: CodegenContext
): void {
  const { className } = moduleConfig;
  const { androidPackageName, androidLanguage, fileExtension, androidSourceDir } = context;

  console.log(`🔨 Generating Native Module: ${className}...`);

  // --- Generate Android Library Configuration (RFC requirement) ---
  generateAndroidLibraryConfig(androidPackageName);

  // --- Generate Android Base Class (RFC compliant) ---
  const specClassName = `${className}Spec`;
  const androidSpecFile = path.join(
    `./android/src/main/${androidSourceDir}`,
    ...androidPackageName.split("."),
    "generated",
    `${specClassName}.${fileExtension}`
  );
  fs.mkdirSync(path.dirname(androidSpecFile), { recursive: true });

  if (androidLanguage === "kotlin") {
    generateKotlinModule(androidSpecFile, specClassName, className, androidPackageName, methods);
  } else {
    generateJavaModule(androidSpecFile, specClassName, className, androidPackageName, methods);
  }

  // --- Generate Web Base Class (RFC compliant) ---
  generateWebModule(className, methods);

  // Generate root TypeScript bindings (RFC requirement)
  generateRootTypeScriptBindings(className, methods);

  console.log(`  ✅ Generated Native Module base class: ${specClassName}.${fileExtension}`);
}

function generateKotlinModule(
  specFile: string,
  specClassName: string,
  className: string,
  packageName: string,
  methods: MethodInfo[]
): void {
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
          const finalType = kotlinType.endsWith("?")
            ? kotlinType
            : kotlinType + (p.isOptional ? "?" : "");
          return `${p.paramName}: ${finalType}`;
        })
        .join(", ");

      const returnType = convertType(m.returnType, "kotlin");
      return `  @LynxMethod\n  abstract fun ${m.name}(${params})${
        returnType !== "Unit" ? `: ${returnType}` : ""
      }`;
    })
    .join("\n\n");

  const ktSpecContent = `package ${packageName}.generated

import android.content.Context
import com.lynx.jsbridge.LynxModule
import com.lynx.jsbridge.LynxMethod
import com.lynx.tasm.behavior.LynxContext
import com.lynx.react.bridge.Callback
import com.lynx.react.bridge.ReadableArray
import com.lynx.react.bridge.ReadableMap

/**
 * Generated base class for ${className}
 * DO NOT EDIT - This file is auto-generated
 * Extend this class in your implementation
 */
abstract class ${specClassName}(context: Context) : LynxModule(context) {
  protected fun getContext(): Context {
    val lynxContext = mContext as LynxContext
    return lynxContext.getContext()
  }

${ktMethods}
}`;

  fs.writeFileSync(specFile, ktSpecContent);

  // Generate implementation template (only if it doesn't exist)
  const implFile = specFile.replace("/generated/", "/").replace("Spec.kt", ".kt");
  
  if (!fs.existsSync(implFile)) {
    // Collect all bridge types used in methods
    const usedBridgeTypes = new Set<string>();
    methods.forEach(method => {
      method.params.forEach(param => {
        const kotlinType = convertType(param.typeText, "kotlin");
        if (kotlinType === "ReadableArray" || kotlinType.startsWith("ReadableArray")) {
          usedBridgeTypes.add("ReadableArray");
        }
        if (kotlinType === "ReadableMap" || kotlinType.startsWith("ReadableMap")) {
          usedBridgeTypes.add("ReadableMap");
        }
        if (kotlinType === "Callback" || kotlinType.startsWith("Callback")) {
          usedBridgeTypes.add("Callback");
        }
      });
    });

    // Generate bridge type imports
    const bridgeImports = Array.from(usedBridgeTypes)
      .map(type => `import com.lynx.react.bridge.${type}`)
      .join("\n");

    const ktImplContent = `package ${packageName}

import android.content.Context
import ${packageName}.generated.${specClassName}
${bridgeImports}
import com.tigermodule.processor.LynxNativeModule

/**
 * Implementation of ${className}
 * Extend the generated base class and implement your logic
 */
@LynxNativeModule(name = "${className}")
class ${className}(context: Context) : ${specClassName}(context) {

${methods
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
        const finalType = kotlinType.endsWith("?")
          ? kotlinType
          : kotlinType + (p.isOptional ? "?" : "");
        return `${p.paramName}: ${finalType}`;
      })
      .join(", ");

    const returnType = convertType(m.returnType, "kotlin");
    return `  override fun ${m.name}(${params})${
      returnType !== "Unit" ? `: ${returnType}` : ""
    } {
    // TODO: Implement your logic here
    ${returnType !== "Unit" ? 'TODO("Implement return value")' : 'TODO("Implement method")'}
  }`;
  })
  .join("\n\n")}
}`;
    fs.writeFileSync(implFile, ktImplContent);
    console.log(`  ✅ Generated implementation template: ${className}.kt`);
  }
}

function generateJavaModule(
  specFile: string,
  specClassName: string,
  className: string,
  packageName: string,
  methods: MethodInfo[]
): void {
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
      return `  @LynxMethod\n  public abstract ${returnType} ${m.name}(${params});`;
    })
    .join("\n\n");

  const javaSpecContent = `package ${packageName}.generated;

import android.content.Context;
import com.lynx.jsbridge.LynxModule;
import com.lynx.jsbridge.LynxMethod;
import com.lynx.tasm.behavior.LynxContext;
import com.lynx.react.bridge.Callback;
import com.lynx.react.bridge.ReadableArray;
import com.lynx.react.bridge.ReadableMap;

/**
 * Generated base class for ${className}
 * DO NOT EDIT - This file is auto-generated
 * Extend this class in your implementation
 */
public abstract class ${specClassName} extends LynxModule {
  public ${specClassName}(Context context) {
    super(context);
  }

  protected Context getContext() {
    LynxContext lynxContext = (LynxContext) mContext;
    return lynxContext.getContext();
  }

${javaMethods}
}`;

  fs.writeFileSync(specFile, javaSpecContent);

  // Generate implementation template (only if it doesn't exist)
  const implFile = specFile.replace("/generated/", "/").replace("Spec.java", ".java");
  
  if (!fs.existsSync(implFile)) {
    // Collect all bridge types used in methods for Java
    const usedBridgeTypes = new Set<string>();
    methods.forEach(method => {
      method.params.forEach(param => {
        const javaType = convertType(param.typeText, "java");
        if (javaType === "ReadableArray" || javaType.startsWith("ReadableArray")) {
          usedBridgeTypes.add("ReadableArray");
        }
        if (javaType === "ReadableMap" || javaType.startsWith("ReadableMap")) {
          usedBridgeTypes.add("ReadableMap");
        }
        if (javaType === "Callback" || javaType.startsWith("Callback")) {
          usedBridgeTypes.add("Callback");
        }
      });
    });

    // Generate bridge type imports for Java
    const bridgeImports = Array.from(usedBridgeTypes)
      .map(type => `import com.lynx.react.bridge.${type};`)
      .join("\n");

    const javaImplMethods = methods
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
        return `  @Override\n  public ${returnType} ${m.name}(${params}) {\n    // TODO: Implement your logic here\n    ${
          returnType !== "void"
            ? 'throw new UnsupportedOperationException("Not implemented");'
            : ""
        }\n  }`;
      })
      .join("\n\n");

    const javaImplContent = `package ${packageName};

import android.content.Context;
import ${packageName}.generated.${specClassName};
${bridgeImports}
import com.tigermodule.processor.LynxNativeModule;

/**
 * Implementation of ${className}
 * Extend the generated base class and implement your logic
 */
@LynxNativeModule(name = "${className}")
public class ${className} extends ${specClassName} {
  public ${className}(Context context) {
    super(context);
  }

${javaImplMethods}
}`;
    fs.writeFileSync(implFile, javaImplContent);
    console.log(`  ✅ Generated implementation template: ${className}.java`);
  }
}

function generateWebModule(className: string, methods: MethodInfo[]): void {
  const specClassName = `${className}Spec`;
  
  // Generate web spec file (RFC requirement)
  const webSpecDir = path.join("./web/src/generated");
  fs.mkdirSync(webSpecDir, { recursive: true });
  
  const webSpecFile = path.join(webSpecDir, `${specClassName}.ts`);
  
  const webSpecContent = `/**
 * Generated base class for ${className}
 * DO NOT EDIT - This file is auto-generated
 * Extend this class in your implementation
 */
export abstract class ${specClassName} {
${methods
  .map((m) => {
    const params = m.params
      .map((p) => {
        return `${p.paramName}${p.isOptional ? "?" : ""}: ${p.typeText}`;
      })
      .join(", ");

    return `  abstract ${m.name}(${params}): ${m.returnType};`;
  })
  .join("\n\n")}
}`;

  fs.writeFileSync(webSpecFile, webSpecContent);
  console.log(`  ✅ Generated Web Module base class: ${specClassName}.ts`);

  // Generate implementation template (only if it doesn't exist)
  const webImplFile = path.join("./web/src", `${className}.ts`);
  
  if (!fs.existsSync(webImplFile)) {
    const webImplContent = `import { ${specClassName} } from "./generated/${specClassName}.js";

/** @lynxnativemodule name:${className} */
export class ${className} extends ${specClassName} {
${methods
  .map((m) => {
    const params = m.params
      .map((p) => {
        return `${p.paramName}${p.isOptional ? "?" : ""}: ${p.typeText}`;
      })
      .join(", ");

    return `  ${m.name}(${params}): ${m.returnType} {
    // TODO: Implement your web logic here
    ${m.returnType !== "void" ? 'throw new Error("Not implemented");' : ""}
  }`;
  })
  .join("\n\n")}
}`;

    fs.writeFileSync(webImplFile, webImplContent);
    console.log(`  ✅ Generated Web Module implementation template: ${className}.ts`);
  }
}

function generateAndroidLibraryConfig(androidPackageName: string): void {
  // Generate build.gradle.kts for Android library (in android folder)
  // Each module uses KAPT to generate its own ExtensionProvider
  const buildGradleContent = `plugins {
    id("com.android.library")
    id("org.jetbrains.kotlin.android")
    kotlin("kapt")
}

android {
    namespace = "${androidPackageName}"
    compileSdk = 34

    defaultConfig {
        minSdk = 24
        targetSdk = 34

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        consumerProguardFiles("consumer-rules.pro")
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }
    
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_1_8
        targetCompatibility = JavaVersion.VERSION_1_8
    }
    
    kotlinOptions {
        jvmTarget = "1.8"
    }

    sourceSets {
        getByName("main") {
            java.srcDirs("src/main/kotlin")
        }
    }
}

dependencies {
    // Lynx framework dependencies (these should be provided by the host app)
    compileOnly("com.lynx:core:+")
    compileOnly("com.lynx:tasm:+")
    compileOnly("com.lynx:react-bridge:+")
    
    // Android dependencies
    implementation("androidx.core:core-ktx:1.12.0")
    implementation("androidx.appcompat:appcompat:1.6.1")
    
    // Tiger annotations (for @LynxNativeModule, @LynxElement, @LynxService)
    // The app will use KAPT to process these annotations
    implementation("io.github.himanshukumardutt094:tiger-annotation-processor:1.0.0")
}`;

  fs.writeFileSync("./android/build.gradle.kts", buildGradleContent);
  console.log(`  ✅ Generated Android library build.gradle.kts with KAPT`);
  console.log(`  ℹ️  KAPT will generate ExtensionProvider from @LynxNativeModule annotations`);

  // Generate AndroidManifest.xml
  const androidManifestDir = "./android/src/main";
  fs.mkdirSync(androidManifestDir, { recursive: true });
  
  const androidManifestContent = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="${androidPackageName}">

    <!-- This is a library module, no activities or permissions needed -->
    
</manifest>`;

  fs.writeFileSync(path.join(androidManifestDir, "AndroidManifest.xml"), androidManifestContent);
  console.log(`  ✅ Generated AndroidManifest.xml`);

  // Generate consumer-rules.pro (empty but required) in android folder
  fs.writeFileSync("./android/consumer-rules.pro", "# Add project specific ProGuard rules here.\n");
  
  // Generate proguard-rules.pro (empty but required) in android folder
  fs.writeFileSync("./android/proguard-rules.pro", "# Add project specific ProGuard rules here.\n");
  
  console.log(`  ✅ Generated ProGuard configuration files`);
}

function generateRootTypeScriptBindings(className: string, methods: MethodInfo[]): void {
  // Generate root generated files (RFC requirement)
  const rootGeneratedDir = path.join("./generated");
  fs.mkdirSync(rootGeneratedDir, { recursive: true });

  const rootGeneratedFile = path.join(rootGeneratedDir, `${className}.ts`);
  const rootGeneratedContent = `/**
 * Generated TypeScript bindings for ${className}
 * DO NOT EDIT - This file is auto-generated
 */

export interface ${className}Interface {
${methods
  .map((m) => {
    const params = m.params
      .map((p) => {
        return `${p.paramName}${p.isOptional ? "?" : ""}: ${p.typeText}`;
      })
      .join(", ");

    return `  ${m.name}(${params}): ${m.returnType};`;
  })
  .join("\n")}
}

// Export for use in Lynx applications
export { ${className}Interface as ${className} };`;

  fs.writeFileSync(rootGeneratedFile, rootGeneratedContent);
  console.log(`  ✅ Generated root bindings: generated/${className}.ts`);
}
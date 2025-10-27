#!/usr/bin/env node
import { intro, multiselect, note, outro, select, text } from "@clack/prompts";
import chalk from "chalk";
import path from "path";
import { ActionRunner } from "../core/actions/action-runner.js";
import { ProjectBuilder } from "../core/project-builder/project-builder.js";
import {
  checkCancel,
  formatProjectName,
  templatePath,
} from "../core/project-builder/template.js";
import { defaultLogger } from "../core/logger.js";

const pascalCheck = (input: string) => /^[A-Z][A-Za-z]*$/.test(input);
const packageNameCheck = (input: string) => /^[a-z0-9-]+$/.test(input);

export async function initModule(
  providedProjectName?: string,
  language?: string
) {
  intro("✨ Create Lynx Autolink Extension");

  let projectName = providedProjectName;

  // Get project name first
  if (!projectName) {
    projectName = checkCancel<string>(
      await text({
        message: "Project name (e.g. lynxjs-linking-module):",
        validate(value) {
          if (!value) return "Project name required";
          if (!packageNameCheck(value))
            return "Must be lowercase with hyphens only (e.g. my-module)";
        },
      })
    );
  } else {
    // validate provided project name
    if (!packageNameCheck(projectName)) {
      console.error(
        "Project name must be lowercase with hyphens only (e.g. lynxjs-linking-module)"
      );
      process.exit(1);
    }
  }

  // Multi-select extension types (RFC requirement)
  const selectedTypes = checkCancel<string[]>(
    await multiselect({
      message: "Please select the extension types included in this package:",
      options: [
        { value: "nativeModule", label: "Native Module" },
        { value: "element", label: "Element" },
        { value: "service", label: "Service" },
      ],
      required: true,
    })
  );

  console.log(
    chalk.green(
      `Selected: ${selectedTypes
        .map((t) =>
          t.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())
        )
        .join(", ")}`
    )
  );

  const androidPackageName = checkCancel<string>(
    await text({
      message: "Android package name:",
      initialValue: "com.myapp.modules",
    })
  );

  const description = checkCancel<string>(
    await text({
      message: "Module description:",
      initialValue: "My Lynx native module",
    })
  );

  // Get language preference
  let selectedLanguage = language || "kotlin";
  if (!language) {
    selectedLanguage = checkCancel<string>(
      await select({
        message: "Select Android language:",
        options: [
          { value: "kotlin", label: "Kotlin (recommended)" },
          { value: "java", label: "Java" },
        ],
        initialValue: "kotlin",
      })
    );
  }

  if (!projectName) throw new Error("projectName missing");

  const formatted = formatProjectName(projectName);
  const { packageName, targetDir } = formatted;
  const cwd = process.cwd();
  const distFolder = path.isAbsolute(targetDir)
    ? targetDir
    : path.join(cwd, targetDir);

  // Collect extension details
  let nativeModules: Array<{ name: string; className: string }> = [];
  let elements: string[] = [];
  let services: string[] = [];
  let templateVariables: Record<string, string> = {
    packageName,
    description: String(description),
    androidPackageName: String(androidPackageName),
    selectedLanguage,
  };

  if (selectedTypes.includes("nativeModule")) {
    const moduleName = checkCancel<string>(
      await text({
        message: "Native Module name (e.g. LocalStorage):",
        validate(value) {
          if (!value) return "Module name required";
          if (!pascalCheck(value)) return "Must be PascalCase";
        },
      })
    );

    nativeModules.push({
      name: moduleName,
      className: `${moduleName}Module`,
    });
    templateVariables.moduleName = moduleName;
  }

  if (selectedTypes.includes("element")) {
    const elementName = checkCancel<string>(
      await text({
        message: "Element name (e.g. Button):",
        validate(value) {
          if (!value) return "Element name required";
          if (!pascalCheck(value)) return "Must be PascalCase";
        },
      })
    );

    elements.push(elementName);
    templateVariables.elementName = elementName;
  }

  if (selectedTypes.includes("service")) {
    const serviceName = checkCancel<string>(
      await text({
        message: "Service name (e.g. LogService):",
        validate(value) {
          if (!value) return "Service name required";
          if (!pascalCheck(value)) return "Must be PascalCase";
        },
      })
    );

    services.push(serviceName);
    templateVariables.serviceName = serviceName;
  }

  // Create ProjectBuilder instance
  const builder = ProjectBuilder.create({
    checkEmpty: true,
    packageName,
    targetDir: distFolder,
  });

  defaultLogger.info(`Creating files from common template`);
  await builder.loadTemplate(templatePath("extension-common-ts"), {
    variables: templateVariables,
  });

  // Load specific templates for each selected type
  for (const type of selectedTypes) {
    defaultLogger.info(`Creating files from ${type} template`);
    await builder.loadTemplate(templatePath(`extension-${type}-ts`), {
      variables: templateVariables,
    });
  }

  // Add post-hook step for Android Gradle files and tiger.config.ts creation
  builder.addStep({
    async postHook(config) {
      const fs = await import("fs/promises");
      const androidDir = path.join(config.targetDir, "android");
      const androidSrcMainDir = path.join(androidDir, "src", "main");

      // Create android directory structure
      await fs.mkdir(androidSrcMainDir, { recursive: true });

      // Generate build.gradle.kts
      const buildGradleContent = `plugins {
    id("com.android.library")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "${androidPackageName}"
    compileSdk = 34

    defaultConfig {
        minSdk = 24
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
        sourceCompatibility = JavaVersion.VERSION_11
        targetCompatibility = JavaVersion.VERSION_11
    }
    
    kotlinOptions {
        jvmTarget = "11"
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.appcompat:appcompat:1.6.1")
    implementation("com.google.android.material:material:1.10.0")
    
    // Lynx SDK dependencies
    implementation("org.lynxsdk.lynx:lynx:3.2.0")
    
    testImplementation("junit:junit:4.13.2")
    androidTestImplementation("androidx.test.ext:junit:1.2.1")
    androidTestImplementation("androidx.test.espresso:espresso-core:3.6.1")
}
`;
      await fs.writeFile(
        path.join(androidDir, "build.gradle.kts"),
        buildGradleContent
      );

      // Generate AndroidManifest.xml
      const manifestContent = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="${androidPackageName}">
</manifest>
`;
      await fs.writeFile(
        path.join(androidSrcMainDir, "AndroidManifest.xml"),
        manifestContent
      );

      // Generate consumer-rules.pro (empty file)
      await fs.writeFile(path.join(androidDir, "consumer-rules.pro"), "");

      // Generate proguard-rules.pro
      const proguardContent = `# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# If your project uses WebView with JS, uncomment the following
# and specify the fully qualified class name to the JavaScript interface
# class:
#-keepclassmembers class fqcn.of.javascript.interface.for.webview {
#   public *;
#}

# Uncomment this to preserve the line number information for
# debugging stack traces.
#-keepattributes SourceFile,LineNumberTable

# If you keep the line number information, uncomment this to
# hide the original source file name.
#-renamesourcefileattribute SourceFile
`;
      await fs.writeFile(
        path.join(androidDir, "proguard-rules.pro"),
        proguardContent
      );

      // Generate tiger.config.ts
      const configContent = `import { defineConfig } from 'tiger-module/config';

export default defineConfig({
  name: '${packageName}',
  version: '0.1.0',
  lynxVersion: '>=0.70.0',
  platforms: {
    android: {
      packageName: '${androidPackageName}',
      sourceDir: 'android/src/main',
      buildTypes: ['debug', 'release'],
      language: '${selectedLanguage}'
    },
    ios: {
      sourceDir: 'ios/src',
      frameworks: ['Foundation']
    },
    web: {
      entry: 'web/src/index.ts'
    }
  },
  dependencies: [],
  nativeModules: ${JSON.stringify(nativeModules, null, 4)},
  elements: ${JSON.stringify(elements, null, 4)},
  services: ${JSON.stringify(services, null, 4)}
});
`;

      await fs.writeFile(
        path.join(config.targetDir, "tiger.config.ts"),
        configContent
      );

      defaultLogger.info(
        "✅ Generated Android Gradle files (build.gradle.kts, AndroidManifest.xml, proguard files)"
      );
    },
  });

  // Generate a single action from ProjectBuilder and execute with ActionRunner
  const actionContext = {
    devMode: false,
    environment: "development" as const,
    logger: defaultLogger,
    projectRoot: process.cwd(),
  };

  const runner = new ActionRunner(actionContext);
  const projectAction = builder.toSingleAction(
    "create-extension-project",
    `Create extension project '${packageName}' with ${selectedTypes.join(", ")}`
  );

  runner.addAction(projectAction);
  await runner.run();

  const nextSteps = [
    `1. ${chalk.cyan(`cd ${targetDir}`)}`,
    `2. ${chalk.cyan("Update src/module.ts with your interfaces")}`,
    `3. ${chalk.cyan("tiger-module codegen")} - generates base classes`,
    `4. ${chalk.cyan(
      "Implement native code that extends the generated base classes"
    )}`,
    `5. ${chalk.cyan("tiger-module build")}`,
    `6. ${chalk.cyan(
      "Publish to npm - extensions will auto-integrate via Autolink!"
    )}`,
  ];

  note(nextSteps.map((step) => chalk.reset(step)).join("\n"), "Next steps");

  outro("✅ Autolink extension scaffold created!");
}

// Allow running directly for development
if (process.argv[1] && process.argv[1].endsWith("init.ts")) {
  // invoked directly
  initModule().catch(console.error);
}

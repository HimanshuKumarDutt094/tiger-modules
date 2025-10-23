/**
 * Tests for RegistryGenerator
 * Verifies that the registry generator correctly aggregates modules from multiple packages
 */

import { describe, it, expect, beforeEach } from "vitest";
import { RegistryGenerator } from "../registry-generator.js";
import type { ExtensionInfo } from "../discovery.js";

describe("RegistryGenerator", () => {
  let generator: RegistryGenerator;

  beforeEach(() => {
    generator = new RegistryGenerator();
  });

  describe("Android Registry Generation", () => {
    it("should generate registry with single extension", () => {
      const extensions: ExtensionInfo[] = [
        {
          name: "@lynxjs/storage",
          version: "1.0.0",
          path: "/test/node_modules/@lynxjs/storage",
          config: {
            name: "@lynxjs/storage",
            version: "1.0.0",
            platforms: {
              android: {
                packageName: "com.lynxjs.storage",
              },
            },
            nativeModules: [
              {
                name: "Storage",
                className: "StorageModule",
                language: "kotlin",
              },
            ],
            elements: [],
            services: [],
          },
          platforms: ["android"],
          dependencies: [],
          nativeModules: [
            {
              name: "Storage",
              className: "StorageModule",
              platform: "android",
              sourceFile: "android/src/main",
            },
          ],
          elements: [],
          services: [],
        },
      ];

      const result = generator.generateAndroidRegistry(extensions);

      expect(result.code).toContain("package com.lynxjs.generated.extensions");
      expect(result.code).toContain("import com.lynxjs.storage.StorageModule");
      expect(result.code).toContain(
        'LynxEnv.inst().registerModule("Storage", StorageModule::class.java)',
      );
      expect(result.code).toContain("object ExtensionRegistry");
      expect(result.code).toContain("fun setupGlobal(context: Context)");
    });

    it("should aggregate modules from 10 different packages into single registry", () => {
      const extensions: ExtensionInfo[] = [];

      // Create 10 different extension packages
      for (let i = 1; i <= 10; i++) {
        extensions.push({
          name: `@author${i}/extension-${i}`,
          version: `${i}.0.0`,
          path: `/test/node_modules/@author${i}/extension-${i}`,
          config: {
            name: `@author${i}/extension-${i}`,
            version: `${i}.0.0`,
            platforms: {
              android: {
                packageName: `com.author${i}.extension${i}`,
              },
            },
            nativeModules: [
              {
                name: `Module${i}`,
                className: `Module${i}Impl`,
                language: "kotlin",
              },
            ],
            elements: [],
            services: [],
          },
          platforms: ["android"],
          dependencies: [],
          nativeModules: [
            {
              name: `Module${i}`,
              className: `Module${i}Impl`,
              platform: "android",
              sourceFile: "android/src/main",
            },
          ],
          elements: [],
          services: [],
        });
      }

      const result = generator.generateAndroidRegistry(extensions);

      // Verify single registry file is generated
      expect(result.outputPath).toBe(
        "com/lynxjs/generated/extensions/ExtensionRegistry.kt",
      );

      // Verify all 10 modules are imported
      for (let i = 1; i <= 10; i++) {
        expect(result.code).toContain(
          `import com.author${i}.extension${i}.Module${i}Impl`,
        );
      }

      // Verify all 10 modules are registered in setupGlobal
      for (let i = 1; i <= 10; i++) {
        expect(result.code).toContain(
          `LynxEnv.inst().registerModule("Module${i}", Module${i}Impl::class.java)`,
        );
      }

      // Verify single setupGlobal method
      const setupGlobalMatches = result.code.match(
        /fun setupGlobal\(context: Context\)/g,
      );
      expect(setupGlobalMatches).toHaveLength(1);

      // Verify single ExtensionRegistry object
      const registryMatches = result.code.match(/object ExtensionRegistry/g);
      expect(registryMatches).toHaveLength(1);
    });

    it("should handle multiple modules from same package", () => {
      const extensions: ExtensionInfo[] = [
        {
          name: "@lynxjs/multi-module",
          version: "1.0.0",
          path: "/test/node_modules/@lynxjs/multi-module",
          config: {
            name: "@lynxjs/multi-module",
            version: "1.0.0",
            platforms: {
              android: {
                packageName: "com.lynxjs.multimodule",
              },
            },
            nativeModules: [
              {
                name: "Storage",
                className: "StorageModule",
                language: "kotlin",
              },
              {
                name: "Cache",
                className: "CacheModule",
                language: "kotlin",
              },
              {
                name: "Database",
                className: "DatabaseModule",
                language: "kotlin",
              },
            ],
            elements: [],
            services: [],
          },
          platforms: ["android"],
          dependencies: [],
          nativeModules: [
            {
              name: "Storage",
              className: "StorageModule",
              platform: "android",
              sourceFile: "android/src/main",
            },
            {
              name: "Cache",
              className: "CacheModule",
              platform: "android",
              sourceFile: "android/src/main",
            },
            {
              name: "Database",
              className: "DatabaseModule",
              platform: "android",
              sourceFile: "android/src/main",
            },
          ],
          elements: [],
          services: [],
        },
      ];

      const result = generator.generateAndroidRegistry(extensions);

      // Verify all modules from same package are imported
      expect(result.code).toContain(
        "import com.lynxjs.multimodule.StorageModule",
      );
      expect(result.code).toContain(
        "import com.lynxjs.multimodule.CacheModule",
      );
      expect(result.code).toContain(
        "import com.lynxjs.multimodule.DatabaseModule",
      );

      // Verify all modules are registered
      expect(result.code).toContain(
        'LynxEnv.inst().registerModule("Storage", StorageModule::class.java)',
      );
      expect(result.code).toContain(
        'LynxEnv.inst().registerModule("Cache", CacheModule::class.java)',
      );
      expect(result.code).toContain(
        'LynxEnv.inst().registerModule("Database", DatabaseModule::class.java)',
      );
    });

    it("should generate single setupGlobal method for all packages", () => {
      const extensions: ExtensionInfo[] = [
        {
          name: "@lynxjs/storage",
          version: "1.0.0",
          path: "/test/node_modules/@lynxjs/storage",
          config: {
            name: "@lynxjs/storage",
            version: "1.0.0",
            platforms: {
              android: {
                packageName: "com.lynxjs.storage",
              },
            },
            nativeModules: [
              {
                name: "Storage",
                className: "StorageModule",
                language: "kotlin",
              },
            ],
            elements: [],
            services: [],
          },
          platforms: ["android"],
          dependencies: [],
          nativeModules: [
            {
              name: "Storage",
              className: "StorageModule",
              platform: "android",
              sourceFile: "android/src/main",
            },
          ],
          elements: [],
          services: [],
        },
        {
          name: "@lynxjs/camera",
          version: "1.0.0",
          path: "/test/node_modules/@lynxjs/camera",
          config: {
            name: "@lynxjs/camera",
            version: "1.0.0",
            platforms: {
              android: {
                packageName: "com.lynxjs.camera",
              },
            },
            nativeModules: [
              {
                name: "Camera",
                className: "CameraModule",
                language: "kotlin",
              },
            ],
            elements: [],
            services: [],
          },
          platforms: ["android"],
          dependencies: [],
          nativeModules: [
            {
              name: "Camera",
              className: "CameraModule",
              platform: "android",
              sourceFile: "android/src/main",
            },
          ],
          elements: [],
          services: [],
        },
        {
          name: "@lynxjs/geolocation",
          version: "1.0.0",
          path: "/test/node_modules/@lynxjs/geolocation",
          config: {
            name: "@lynxjs/geolocation",
            version: "1.0.0",
            platforms: {
              android: {
                packageName: "com.lynxjs.geolocation",
              },
            },
            nativeModules: [
              {
                name: "Geolocation",
                className: "GeolocationModule",
                language: "kotlin",
              },
            ],
            elements: [],
            services: [],
          },
          platforms: ["android"],
          dependencies: [],
          nativeModules: [
            {
              name: "Geolocation",
              className: "GeolocationModule",
              platform: "android",
              sourceFile: "android/src/main",
            },
          ],
          elements: [],
          services: [],
        },
      ];

      const result = generator.generateAndroidRegistry(extensions);

      // Count setupGlobal methods - should be exactly 1
      const setupGlobalMatches = result.code.match(
        /fun setupGlobal\(context: Context\)/g,
      );
      expect(setupGlobalMatches).toHaveLength(1);

      // Verify all modules are in the single setupGlobal method
      expect(result.code).toContain('registerModule("Storage"');
      expect(result.code).toContain('registerModule("Camera"');
      expect(result.code).toContain('registerModule("Geolocation"');
    });

    it("should handle mixed Kotlin and Java modules", () => {
      const extensions: ExtensionInfo[] = [
        {
          name: "@lynxjs/kotlin-module",
          version: "1.0.0",
          path: "/test/node_modules/@lynxjs/kotlin-module",
          config: {
            name: "@lynxjs/kotlin-module",
            version: "1.0.0",
            platforms: {
              android: {
                packageName: "com.lynxjs.kotlinmodule",
                language: "kotlin",
              },
            },
            nativeModules: [
              {
                name: "KotlinModule",
                className: "KotlinModuleImpl",
                language: "kotlin",
              },
            ],
            elements: [],
            services: [],
          },
          platforms: ["android"],
          dependencies: [],
          nativeModules: [
            {
              name: "KotlinModule",
              className: "KotlinModuleImpl",
              platform: "android",
              sourceFile: "android/src/main",
            },
          ],
          elements: [],
          services: [],
        },
        {
          name: "@lynxjs/java-module",
          version: "1.0.0",
          path: "/test/node_modules/@lynxjs/java-module",
          config: {
            name: "@lynxjs/java-module",
            version: "1.0.0",
            platforms: {
              android: {
                packageName: "com.lynxjs.javamodule",
                language: "java",
              },
            },
            nativeModules: [
              {
                name: "JavaModule",
                className: "JavaModuleImpl",
                language: "java",
              },
            ],
            elements: [],
            services: [],
          },
          platforms: ["android"],
          dependencies: [],
          nativeModules: [
            {
              name: "JavaModule",
              className: "JavaModuleImpl",
              platform: "android",
              sourceFile: "android/src/main",
            },
          ],
          elements: [],
          services: [],
        },
      ];

      const result = generator.generateAndroidRegistry(extensions);

      // Verify both Kotlin and Java modules are imported
      expect(result.code).toContain(
        "import com.lynxjs.kotlinmodule.KotlinModuleImpl",
      );
      expect(result.code).toContain(
        "import com.lynxjs.javamodule.JavaModuleImpl",
      );

      // Verify both use ::class.java syntax (works for both Kotlin and Java)
      expect(result.code).toContain(
        'LynxEnv.inst().registerModule("KotlinModule", KotlinModuleImpl::class.java)',
      );
      expect(result.code).toContain(
        'LynxEnv.inst().registerModule("JavaModule", JavaModuleImpl::class.java)',
      );
    });

    it("should include error handling for each module registration", () => {
      const extensions: ExtensionInfo[] = [
        {
          name: "@lynxjs/storage",
          version: "1.0.0",
          path: "/test/node_modules/@lynxjs/storage",
          config: {
            name: "@lynxjs/storage",
            version: "1.0.0",
            platforms: {
              android: {
                packageName: "com.lynxjs.storage",
              },
            },
            nativeModules: [
              {
                name: "Storage",
                className: "StorageModule",
                language: "kotlin",
              },
            ],
            elements: [],
            services: [],
          },
          platforms: ["android"],
          dependencies: [],
          nativeModules: [
            {
              name: "Storage",
              className: "StorageModule",
              platform: "android",
              sourceFile: "android/src/main",
            },
          ],
          elements: [],
          services: [],
        },
      ];

      const result = generator.generateAndroidRegistry(extensions);

      // Verify try-catch blocks are present
      expect(result.code).toContain("try {");
      expect(result.code).toContain("} catch (e: Exception) {");
      expect(result.code).toContain(
        'android.util.Log.e("ExtensionRegistry", "Failed to register module Storage:',
      );
    });

    it("should add comments indicating source package for each module", () => {
      const extensions: ExtensionInfo[] = [
        {
          name: "@lynxjs/storage",
          version: "1.0.0",
          path: "/test/node_modules/@lynxjs/storage",
          config: {
            name: "@lynxjs/storage",
            version: "1.0.0",
            platforms: {
              android: {
                packageName: "com.lynxjs.storage",
              },
            },
            nativeModules: [
              {
                name: "Storage",
                className: "StorageModule",
                language: "kotlin",
              },
            ],
            elements: [],
            services: [],
          },
          platforms: ["android"],
          dependencies: [],
          nativeModules: [
            {
              name: "Storage",
              className: "StorageModule",
              platform: "android",
              sourceFile: "android/src/main",
            },
          ],
          elements: [],
          services: [],
        },
      ];

      const result = generator.generateAndroidRegistry(extensions);

      // Verify comments indicating source
      expect(result.code).toContain(
        "// Register native module: Storage from @lynxjs/storage",
      );
      expect(result.code).toContain(
        "// Source: com.lynxjs.storage.StorageModule",
      );
    });

    it("should handle elements in addition to modules", () => {
      const extensions: ExtensionInfo[] = [
        {
          name: "@lynxjs/ui-components",
          version: "1.0.0",
          path: "/test/node_modules/@lynxjs/ui-components",
          config: {
            name: "@lynxjs/ui-components",
            version: "1.0.0",
            platforms: {
              android: {
                packageName: "com.lynxjs.uicomponents",
              },
            },
            nativeModules: [],
            elements: ["CustomButton", "CustomInput"],
            services: [],
          },
          platforms: ["android"],
          dependencies: [],
          nativeModules: [],
          elements: [
            {
              name: "CustomButton",
              className: "CustomButton",
              platform: "android",
              sourceFile: "android/src/main",
            },
            {
              name: "CustomInput",
              className: "CustomInput",
              platform: "android",
              sourceFile: "android/src/main",
            },
          ],
          services: [],
        },
      ];

      const result = generator.generateAndroidRegistry(extensions);

      // Verify elements are imported
      expect(result.code).toContain(
        "import com.lynxjs.uicomponents.CustomButton",
      );
      expect(result.code).toContain(
        "import com.lynxjs.uicomponents.CustomInput",
      );

      // Verify elements are registered with addBehavior
      expect(result.code).toContain(
        'LynxEnv.inst().addBehavior(object : Behavior("CustomButton")',
      );
      expect(result.code).toContain(
        'LynxEnv.inst().addBehavior(object : Behavior("CustomInput")',
      );
    });

    it("should skip extensions without Android support", () => {
      const extensions: ExtensionInfo[] = [
        {
          name: "@lynxjs/ios-only",
          version: "1.0.0",
          path: "/test/node_modules/@lynxjs/ios-only",
          config: {
            name: "@lynxjs/ios-only",
            version: "1.0.0",
            platforms: {
              ios: {
                sourceDir: "ios/src",
              },
            },
            nativeModules: [
              {
                name: "IOSModule",
                className: "IOSModuleImpl",
                language: "swift",
              },
            ],
            elements: [],
            services: [],
          },
          platforms: ["ios"],
          dependencies: [],
          nativeModules: [
            {
              name: "IOSModule",
              className: "IOSModuleImpl",
              platform: "ios",
              sourceFile: "ios/src",
            },
          ],
          elements: [],
          services: [],
        },
      ];

      const result = generator.generateAndroidRegistry(extensions);

      // Should not contain iOS module
      expect(result.code).not.toContain("IOSModule");
      expect(result.warnings).toContain(
        "Skipping @lynxjs/ios-only: no Android support",
      );
    });
  });

  describe("iOS Registry Generation", () => {
    it("should generate header and implementation files", () => {
      const extensions: ExtensionInfo[] = [
        {
          name: "@lynxjs/storage",
          version: "1.0.0",
          path: "/test/node_modules/@lynxjs/storage",
          config: {
            name: "@lynxjs/storage",
            version: "1.0.0",
            platforms: {
              ios: {
                sourceDir: "ios/src",
              },
            },
            nativeModules: [
              {
                name: "Storage",
                className: "StorageModule",
                language: "swift",
              },
            ],
            elements: [],
            services: [],
          },
          platforms: ["ios"],
          dependencies: [],
          nativeModules: [
            {
              name: "Storage",
              className: "StorageModule",
              platform: "ios",
              sourceFile: "ios/src",
            },
          ],
          elements: [],
          services: [],
        },
      ];

      const result = generator.generateIOSRegistry(extensions);

      // Verify header file
      expect(result.header.code).toContain("@interface ExtensionRegistry");
      expect(result.header.code).toContain(
        "- (void)setupWithConfig:(LynxConfig *)config;",
      );
      expect(result.header.outputPath).toBe("ExtensionRegistry.h");

      // Verify implementation file
      expect(result.implementation.code).toContain(
        "@implementation ExtensionRegistry",
      );
      expect(result.implementation.code).toContain('#import "StorageModule.h"');
      expect(result.implementation.code).toContain(
        '[config registerNativeModule:[StorageModule class] withName:@"Storage"]',
      );
      expect(result.implementation.outputPath).toBe("ExtensionRegistry.m");
    });
  });

  describe("Web Registry Generation", () => {
    it("should generate TypeScript registry with dynamic imports", () => {
      const extensions: ExtensionInfo[] = [
        {
          name: "@lynxjs/storage",
          version: "1.0.0",
          path: "/test/node_modules/@lynxjs/storage",
          config: {
            name: "@lynxjs/storage",
            version: "1.0.0",
            platforms: {
              web: {
                entry: "web/src/index.ts",
              },
            },
            nativeModules: [
              {
                name: "Storage",
                className: "StorageModule",
                language: "typescript",
              },
            ],
            elements: [],
            services: [],
          },
          platforms: ["web"],
          dependencies: [],
          nativeModules: [
            {
              name: "Storage",
              className: "StorageModule",
              platform: "web",
              sourceFile: "web/src/index.ts",
            },
          ],
          elements: [],
          services: [],
        },
      ];

      const result = generator.generateWebRegistry(extensions);

      expect(result.code).toContain("export async function setupExtensions()");
      expect(result.code).toContain("await import('@lynxjs/storage')");
      expect(result.code).toContain("NativeModuleRegistry.register('Storage'");
      expect(result.outputPath).toBe("extension-registry.ts");
    });
  });
});

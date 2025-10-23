/**
 * Tests for ExtensionDiscovery
 * Verifies that the discovery engine correctly finds and processes extension packages
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { ExtensionDiscovery } from "../discovery.js";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

describe("ExtensionDiscovery", () => {
  let testRoot: string;
  let discovery: ExtensionDiscovery;

  beforeEach(() => {
    // Create a temporary test directory
    testRoot = join(tmpdir(), `lynx-test-${Date.now()}`);
    mkdirSync(testRoot, { recursive: true });
    discovery = new ExtensionDiscovery();
  });

  afterEach(() => {
    // Clean up test directory
    if (testRoot) {
      rmSync(testRoot, { recursive: true, force: true });
    }
  });

  describe("Basic Discovery", () => {
    it("should return empty array when node_modules does not exist", async () => {
      const result = await discovery.discoverExtensions(testRoot);

      expect(result.extensions).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].reason).toContain("node_modules");
    });

    it("should discover a single extension package", async () => {
      // Create node_modules structure
      const nodeModules = join(testRoot, "node_modules");
      const pkgDir = join(nodeModules, "@lynxjs", "test-module");
      mkdirSync(pkgDir, { recursive: true });

      // Create lynx.ext.json
      writeFileSync(
        join(pkgDir, "lynx.ext.json"),
        JSON.stringify({
          name: "@lynxjs/test-module",
          version: "1.0.0",
          platforms: {
            android: {
              packageName: "com.lynxjs.testmodule",
            },
          },
          nativeModules: [
            {
              name: "TestModule",
              className: "TestModuleImpl",
              language: "kotlin",
            },
          ],
        }),
      );

      // Create package.json
      writeFileSync(
        join(pkgDir, "package.json"),
        JSON.stringify({
          name: "@lynxjs/test-module",
          version: "1.0.0",
        }),
      );

      const result = await discovery.discoverExtensions(testRoot);

      expect(result.extensions).toHaveLength(1);
      expect(result.extensions[0].name).toBe("@lynxjs/test-module");
      expect(result.extensions[0].version).toBe("1.0.0");
      expect(result.extensions[0].nativeModules).toHaveLength(1);
      expect(result.extensions[0].nativeModules[0].name).toBe("TestModule");
      expect(result.extensions[0].nativeModules[0].className).toBe(
        "TestModuleImpl",
      );
    });
  });

  describe("Multiple Package Discovery", () => {
    it("should discover 10 different extension packages", async () => {
      const nodeModules = join(testRoot, "node_modules");

      // Create 10 different extension packages
      for (let i = 1; i <= 10; i++) {
        const pkgDir = join(nodeModules, `@author${i}`, `extension-${i}`);
        mkdirSync(pkgDir, { recursive: true });

        writeFileSync(
          join(pkgDir, "lynx.ext.json"),
          JSON.stringify({
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
          }),
        );

        writeFileSync(
          join(pkgDir, "package.json"),
          JSON.stringify({
            name: `@author${i}/extension-${i}`,
            version: `${i}.0.0`,
          }),
        );
      }

      const result = await discovery.discoverExtensions(testRoot);

      expect(result.extensions).toHaveLength(10);
      expect(result.errors).toHaveLength(0);

      // Verify all packages are discovered
      const names = result.extensions.map((ext) => ext.name).sort();
      for (let i = 1; i <= 10; i++) {
        expect(names).toContain(`@author${i}/extension-${i}`);
      }

      // Verify all modules are present
      const moduleNames = result.extensions.flatMap((ext) =>
        ext.nativeModules.map((mod) => mod.name),
      );
      for (let i = 1; i <= 10; i++) {
        expect(moduleNames).toContain(`Module${i}`);
      }
    });

    it("should collect all packages into a single list", async () => {
      const nodeModules = join(testRoot, "node_modules");

      // Create packages in different scopes
      const packages = [
        { scope: "@lynxjs", name: "storage", module: "Storage" },
        { scope: "@lynxjs", name: "camera", module: "Camera" },
        { scope: "@company", name: "analytics", module: "Analytics" },
        { scope: null, name: "geolocation", module: "Geolocation" },
        { scope: "@team", name: "auth", module: "Auth" },
      ];

      for (const pkg of packages) {
        const pkgDir = pkg.scope
          ? join(nodeModules, pkg.scope, pkg.name)
          : join(nodeModules, pkg.name);
        mkdirSync(pkgDir, { recursive: true });

        const fullName = pkg.scope ? `${pkg.scope}/${pkg.name}` : pkg.name;

        writeFileSync(
          join(pkgDir, "lynx.ext.json"),
          JSON.stringify({
            name: fullName,
            version: "1.0.0",
            platforms: {
              android: {
                packageName: `com.test.${pkg.name}`,
              },
            },
            nativeModules: [
              {
                name: pkg.module,
                className: `${pkg.module}Module`,
                language: "kotlin",
              },
            ],
          }),
        );

        writeFileSync(
          join(pkgDir, "package.json"),
          JSON.stringify({
            name: fullName,
            version: "1.0.0",
          }),
        );
      }

      const result = await discovery.discoverExtensions(testRoot);

      expect(result.extensions).toHaveLength(5);
      expect(result.errors).toHaveLength(0);

      // Verify all are in a single list
      expect(Array.isArray(result.extensions)).toBe(true);

      // Verify each package is present
      const discoveredNames = result.extensions.map((ext) => ext.name);
      expect(discoveredNames).toContain("@lynxjs/storage");
      expect(discoveredNames).toContain("@lynxjs/camera");
      expect(discoveredNames).toContain("@company/analytics");
      expect(discoveredNames).toContain("geolocation");
      expect(discoveredNames).toContain("@team/auth");
    });
  });

  describe("Recursive Scanning", () => {
    it("should recursively find lynx.ext.json files in nested directories", async () => {
      const nodeModules = join(testRoot, "node_modules");

      // Create nested structure
      const paths = [
        join(nodeModules, "package1"),
        join(nodeModules, "@scope1", "package2"),
        join(nodeModules, "@scope2", "package3"),
      ];

      for (let i = 0; i < paths.length; i++) {
        mkdirSync(paths[i], { recursive: true });

        writeFileSync(
          join(paths[i], "lynx.ext.json"),
          JSON.stringify({
            name: `package${i + 1}`,
            version: "1.0.0",
            platforms: {
              android: {
                packageName: `com.test.package${i + 1}`,
              },
            },
            nativeModules: [
              {
                name: `Module${i + 1}`,
                className: `Module${i + 1}`,
                language: "kotlin",
              },
            ],
          }),
        );

        writeFileSync(
          join(paths[i], "package.json"),
          JSON.stringify({
            name: `package${i + 1}`,
            version: "1.0.0",
          }),
        );
      }

      const result = await discovery.discoverExtensions(testRoot);

      expect(result.extensions).toHaveLength(3);
      expect(result.errors).toHaveLength(0);
    });

    it("should not scan nested node_modules directories", async () => {
      const nodeModules = join(testRoot, "node_modules");
      const pkg1Dir = join(nodeModules, "package1");
      const nestedNodeModules = join(pkg1Dir, "node_modules");
      const pkg2Dir = join(nestedNodeModules, "package2");

      mkdirSync(pkg1Dir, { recursive: true });
      mkdirSync(pkg2Dir, { recursive: true });

      // Create extension in top-level node_modules
      writeFileSync(
        join(pkg1Dir, "lynx.ext.json"),
        JSON.stringify({
          name: "package1",
          version: "1.0.0",
          platforms: {
            android: {
              packageName: "com.test.package1",
            },
          },
          nativeModules: [
            {
              name: "Module1",
              className: "Module1",
              language: "kotlin",
            },
          ],
        }),
      );

      writeFileSync(
        join(pkg1Dir, "package.json"),
        JSON.stringify({
          name: "package1",
          version: "1.0.0",
        }),
      );

      // Create extension in nested node_modules (should be ignored)
      writeFileSync(
        join(pkg2Dir, "lynx.ext.json"),
        JSON.stringify({
          name: "package2",
          version: "1.0.0",
          platforms: {
            android: {
              packageName: "com.test.package2",
            },
          },
          nativeModules: [
            {
              name: "Module2",
              className: "Module2",
              language: "kotlin",
            },
          ],
        }),
      );

      writeFileSync(
        join(pkg2Dir, "package.json"),
        JSON.stringify({
          name: "package2",
          version: "1.0.0",
        }),
      );

      const result = await discovery.discoverExtensions(testRoot);

      // Should only find package1, not package2 in nested node_modules
      expect(result.extensions).toHaveLength(1);
      expect(result.extensions[0].name).toBe("package1");
    });
  });

  describe("Configuration Format Support", () => {
    it("should handle old string array format for nativeModules", async () => {
      const nodeModules = join(testRoot, "node_modules");
      const pkgDir = join(nodeModules, "old-format");
      mkdirSync(pkgDir, { recursive: true });

      writeFileSync(
        join(pkgDir, "lynx.ext.json"),
        JSON.stringify({
          name: "old-format",
          version: "1.0.0",
          platforms: {
            android: {
              packageName: "com.test.oldformat",
            },
          },
          nativeModules: ["OldModule1", "OldModule2"],
        }),
      );

      writeFileSync(
        join(pkgDir, "package.json"),
        JSON.stringify({
          name: "old-format",
          version: "1.0.0",
        }),
      );

      const result = await discovery.discoverExtensions(testRoot);

      expect(result.extensions).toHaveLength(1);
      expect(result.extensions[0].nativeModules).toHaveLength(2);
      expect(result.extensions[0].nativeModules[0].name).toBe("OldModule1");
      expect(result.extensions[0].nativeModules[0].className).toBe(
        "OldModule1",
      );
      expect(result.extensions[0].nativeModules[1].name).toBe("OldModule2");
    });

    it("should handle new object array format for nativeModules", async () => {
      const nodeModules = join(testRoot, "node_modules");
      const pkgDir = join(nodeModules, "new-format");
      mkdirSync(pkgDir, { recursive: true });

      writeFileSync(
        join(pkgDir, "lynx.ext.json"),
        JSON.stringify({
          name: "new-format",
          version: "1.0.0",
          platforms: {
            android: {
              packageName: "com.test.newformat",
            },
          },
          nativeModules: [
            {
              name: "NewModule",
              className: "NewModuleImpl",
              language: "kotlin",
            },
          ],
        }),
      );

      writeFileSync(
        join(pkgDir, "package.json"),
        JSON.stringify({
          name: "new-format",
          version: "1.0.0",
        }),
      );

      const result = await discovery.discoverExtensions(testRoot);

      expect(result.extensions).toHaveLength(1);
      expect(result.extensions[0].nativeModules[0].name).toBe("NewModule");
      expect(result.extensions[0].nativeModules[0].className).toBe(
        "NewModuleImpl",
      );
    });

    it("should handle Java modules", async () => {
      const nodeModules = join(testRoot, "node_modules");
      const pkgDir = join(nodeModules, "java-module");
      mkdirSync(pkgDir, { recursive: true });

      writeFileSync(
        join(pkgDir, "lynx.ext.json"),
        JSON.stringify({
          name: "java-module",
          version: "1.0.0",
          platforms: {
            android: {
              packageName: "com.test.javamodule",
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
        }),
      );

      writeFileSync(
        join(pkgDir, "package.json"),
        JSON.stringify({
          name: "java-module",
          version: "1.0.0",
        }),
      );

      const result = await discovery.discoverExtensions(testRoot);

      expect(result.extensions).toHaveLength(1);
      expect(result.extensions[0].config.platforms.android?.language).toBe(
        "java",
      );
    });
  });

  describe("Error Handling", () => {
    it("should handle invalid JSON in lynx.ext.json", async () => {
      const nodeModules = join(testRoot, "node_modules");
      const pkgDir = join(nodeModules, "invalid-json");
      mkdirSync(pkgDir, { recursive: true });

      writeFileSync(join(pkgDir, "lynx.ext.json"), "{ invalid json }");
      writeFileSync(
        join(pkgDir, "package.json"),
        JSON.stringify({
          name: "invalid-json",
          version: "1.0.0",
        }),
      );

      const result = await discovery.discoverExtensions(testRoot);

      expect(result.extensions).toHaveLength(0);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("should handle missing package.json", async () => {
      const nodeModules = join(testRoot, "node_modules");
      const pkgDir = join(nodeModules, "no-package-json");
      mkdirSync(pkgDir, { recursive: true });

      writeFileSync(
        join(pkgDir, "lynx.ext.json"),
        JSON.stringify({
          name: "no-package-json",
          version: "1.0.0",
          platforms: {
            android: {
              packageName: "com.test.nopackagejson",
            },
          },
          nativeModules: [],
        }),
      );

      const result = await discovery.discoverExtensions(testRoot);

      expect(result.extensions).toHaveLength(0);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].reason).toContain("package.json");
    });

    it("should continue discovery even when some packages fail", async () => {
      const nodeModules = join(testRoot, "node_modules");

      // Create valid package
      const validPkgDir = join(nodeModules, "valid-package");
      mkdirSync(validPkgDir, { recursive: true });
      writeFileSync(
        join(validPkgDir, "lynx.ext.json"),
        JSON.stringify({
          name: "valid-package",
          version: "1.0.0",
          platforms: {
            android: {
              packageName: "com.test.valid",
            },
          },
          nativeModules: [],
        }),
      );
      writeFileSync(
        join(validPkgDir, "package.json"),
        JSON.stringify({
          name: "valid-package",
          version: "1.0.0",
        }),
      );

      // Create invalid package
      const invalidPkgDir = join(nodeModules, "invalid-package");
      mkdirSync(invalidPkgDir, { recursive: true });
      writeFileSync(join(invalidPkgDir, "lynx.ext.json"), "{ invalid }");

      const result = await discovery.discoverExtensions(testRoot);

      expect(result.extensions).toHaveLength(1);
      expect(result.extensions[0].name).toBe("valid-package");
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe("Platform Support", () => {
    it("should detect multiple platform support", async () => {
      const nodeModules = join(testRoot, "node_modules");
      const pkgDir = join(nodeModules, "multi-platform");
      mkdirSync(pkgDir, { recursive: true });

      writeFileSync(
        join(pkgDir, "lynx.ext.json"),
        JSON.stringify({
          name: "multi-platform",
          version: "1.0.0",
          platforms: {
            android: {
              packageName: "com.test.multiplatform",
            },
            ios: {
              sourceDir: "ios/src",
            },
            web: {
              entry: "web/src/index.ts",
            },
          },
          nativeModules: [
            {
              name: "MultiPlatformModule",
              className: "MultiPlatformModuleImpl",
              language: "kotlin",
            },
          ],
        }),
      );

      writeFileSync(
        join(pkgDir, "package.json"),
        JSON.stringify({
          name: "multi-platform",
          version: "1.0.0",
        }),
      );

      const result = await discovery.discoverExtensions(testRoot);

      expect(result.extensions).toHaveLength(1);
      expect(result.extensions[0].platforms).toContain("android");
      expect(result.extensions[0].platforms).toContain("ios");
      expect(result.extensions[0].platforms).toContain("web");

      // Should create module info for each platform
      expect(result.extensions[0].nativeModules.length).toBeGreaterThanOrEqual(
        3,
      );
    });
  });
});

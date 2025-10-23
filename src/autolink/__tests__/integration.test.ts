/**
 * Integration tests for Extension Discovery and Registry Generation
 * Verifies the complete flow from discovering extensions to generating registry code
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { ExtensionDiscovery } from "../discovery.js";
import { RegistryGenerator } from "../registry-generator.js";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

describe("Extension Discovery and Registry Generation Integration", () => {
  let testRoot: string;
  let discovery: ExtensionDiscovery;
  let generator: RegistryGenerator;

  beforeEach(() => {
    testRoot = join(tmpdir(), `lynx-integration-test-${Date.now()}`);
    mkdirSync(testRoot, { recursive: true });
    discovery = new ExtensionDiscovery();
    generator = new RegistryGenerator();
  });

  afterEach(() => {
    if (testRoot) {
      rmSync(testRoot, { recursive: true, force: true });
    }
  });

  describe("Complete Flow with Multiple Packages", () => {
    it("should discover 10 packages and generate single unified registry", async () => {
      const nodeModules = join(testRoot, "node_modules");

      // Create 10 different extension packages with various configurations
      const packages = [
        {
          scope: "@lynxjs",
          name: "storage",
          module: "Storage",
          className: "StorageModule",
          hasElement: false,
        },
        {
          scope: "@lynxjs",
          name: "camera",
          module: "Camera",
          className: "CameraModule",
          hasElement: false,
        },
        {
          scope: "@company",
          name: "analytics",
          module: "Analytics",
          className: "AnalyticsModule",
          hasElement: false,
        },
        {
          scope: null,
          name: "geolocation",
          module: "Geolocation",
          className: "GeolocationModule",
          hasElement: false,
        },
        {
          scope: "@team",
          name: "auth",
          module: "Auth",
          className: "AuthModule",
          hasElement: false,
        },
        {
          scope: "@ui",
          name: "components",
          module: "UIComponents",
          className: "UIComponentsModule",
          hasElement: true,
        },
        {
          scope: "@data",
          name: "sync",
          module: "DataSync",
          className: "DataSyncModule",
          hasElement: false,
        },
        {
          scope: "@network",
          name: "http",
          module: "HTTP",
          className: "HTTPModule",
          hasElement: false,
        },
        {
          scope: "@media",
          name: "player",
          module: "MediaPlayer",
          className: "MediaPlayerModule",
          hasElement: true,
        },
        {
          scope: "@device",
          name: "info",
          module: "DeviceInfo",
          className: "DeviceInfoModule",
          hasElement: false,
        },
      ];

      for (const pkg of packages) {
        const pkgDir = pkg.scope
          ? join(nodeModules, pkg.scope, pkg.name)
          : join(nodeModules, pkg.name);
        mkdirSync(pkgDir, { recursive: true });

        const fullName = pkg.scope ? `${pkg.scope}/${pkg.name}` : pkg.name;
        const packageName = pkg.scope
          ? `com.${pkg.scope.replace("@", "")}.${pkg.name}`
          : `com.test.${pkg.name}`;

        const config: any = {
          name: fullName,
          version: "1.0.0",
          platforms: {
            android: {
              packageName: packageName,
            },
          },
          nativeModules: [
            {
              name: pkg.module,
              className: pkg.className,
              language: "kotlin",
            },
          ],
          elements: [],
          services: [],
        };

        if (pkg.hasElement) {
          config.elements = [`${pkg.module}Element`];
        }

        writeFileSync(join(pkgDir, "tiger.config.json"), JSON.stringify(config));

        writeFileSync(
          join(pkgDir, "package.json"),
          JSON.stringify({
            name: fullName,
            version: "1.0.0",
          }),
        );
      }

      // Step 1: Discover all extensions
      const discoveryResult = await discovery.discoverExtensions(testRoot);

      expect(discoveryResult.extensions).toHaveLength(10);
      expect(discoveryResult.errors).toHaveLength(0);

      // Verify all packages were discovered
      const discoveredNames = discoveryResult.extensions.map((ext) => ext.name);
      expect(discoveredNames).toContain("@lynxjs/storage");
      expect(discoveredNames).toContain("@lynxjs/camera");
      expect(discoveredNames).toContain("@company/analytics");
      expect(discoveredNames).toContain("geolocation");
      expect(discoveredNames).toContain("@team/auth");
      expect(discoveredNames).toContain("@ui/components");
      expect(discoveredNames).toContain("@data/sync");
      expect(discoveredNames).toContain("@network/http");
      expect(discoveredNames).toContain("@media/player");
      expect(discoveredNames).toContain("@device/info");

      // Step 2: Generate unified Android registry
      const registryResult = generator.generateAndroidRegistry(
        discoveryResult.extensions,
      );

      // Verify single registry file
      expect(registryResult.outputPath).toBe(
        "com/lynxjs/generated/extensions/ExtensionRegistry.kt",
      );

      // Verify all 10 modules are imported
      expect(registryResult.code).toContain(
        "import com.lynxjs.storage.StorageModule",
      );
      expect(registryResult.code).toContain(
        "import com.lynxjs.camera.CameraModule",
      );
      expect(registryResult.code).toContain(
        "import com.company.analytics.AnalyticsModule",
      );
      expect(registryResult.code).toContain(
        "import com.test.geolocation.GeolocationModule",
      );
      expect(registryResult.code).toContain("import com.team.auth.AuthModule");
      expect(registryResult.code).toContain(
        "import com.ui.components.UIComponentsModule",
      );
      expect(registryResult.code).toContain(
        "import com.data.sync.DataSyncModule",
      );
      expect(registryResult.code).toContain(
        "import com.network.http.HTTPModule",
      );
      expect(registryResult.code).toContain(
        "import com.media.player.MediaPlayerModule",
      );
      expect(registryResult.code).toContain(
        "import com.device.info.DeviceInfoModule",
      );

      // Verify all 10 modules are registered in single setupGlobal method
      expect(registryResult.code).toContain(
        'registerModule("Storage", StorageModule::class.java)',
      );
      expect(registryResult.code).toContain(
        'registerModule("Camera", CameraModule::class.java)',
      );
      expect(registryResult.code).toContain(
        'registerModule("Analytics", AnalyticsModule::class.java)',
      );
      expect(registryResult.code).toContain(
        'registerModule("Geolocation", GeolocationModule::class.java)',
      );
      expect(registryResult.code).toContain(
        'registerModule("Auth", AuthModule::class.java)',
      );
      expect(registryResult.code).toContain(
        'registerModule("UIComponents", UIComponentsModule::class.java)',
      );
      expect(registryResult.code).toContain(
        'registerModule("DataSync", DataSyncModule::class.java)',
      );
      expect(registryResult.code).toContain(
        'registerModule("HTTP", HTTPModule::class.java)',
      );
      expect(registryResult.code).toContain(
        'registerModule("MediaPlayer", MediaPlayerModule::class.java)',
      );
      expect(registryResult.code).toContain(
        'registerModule("DeviceInfo", DeviceInfoModule::class.java)',
      );

      // Verify elements are also registered
      expect(registryResult.code).toContain(
        "import com.ui.components.UIComponentsElement",
      );
      expect(registryResult.code).toContain(
        "import com.media.player.MediaPlayerElement",
      );
      expect(registryResult.code).toContain(
        'addBehavior(object : Behavior("UIComponentsElement")',
      );
      expect(registryResult.code).toContain(
        'addBehavior(object : Behavior("MediaPlayerElement")',
      );

      // Verify single setupGlobal method
      const setupGlobalMatches = registryResult.code.match(
        /fun setupGlobal\(context: Context\)/g,
      );
      expect(setupGlobalMatches).toHaveLength(1);

      // Verify single ExtensionRegistry object
      const registryMatches = registryResult.code.match(
        /object ExtensionRegistry/g,
      );
      expect(registryMatches).toHaveLength(1);

      // Verify error handling is present for all registrations
      const tryBlocks = registryResult.code.match(/try \{/g);
      expect(tryBlocks!.length).toBeGreaterThanOrEqual(10); // At least one per module

      const catchBlocks = registryResult.code.match(
        /\} catch \(e: Exception\) \{/g,
      );
      expect(catchBlocks!.length).toBeGreaterThanOrEqual(10);
    });

    it("should handle mixed package with multiple modules and elements", async () => {
      const nodeModules = join(testRoot, "node_modules");
      const pkgDir = join(nodeModules, "@lynxjs", "complete-package");
      mkdirSync(pkgDir, { recursive: true });

      // Create a package with multiple modules, elements, and services
      writeFileSync(
        join(pkgDir, "tiger.config.json"),
        JSON.stringify({
          name: "@lynxjs/complete-package",
          version: "2.0.0",
          platforms: {
            android: {
              packageName: "com.lynxjs.complete",
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
              language: "java",
            },
          ],
          elements: ["CustomButton", "CustomInput", "CustomCard"],
          services: ["LogService"],
        }),
      );

      writeFileSync(
        join(pkgDir, "package.json"),
        JSON.stringify({
          name: "@lynxjs/complete-package",
          version: "2.0.0",
        }),
      );

      // Discover and generate
      const discoveryResult = await discovery.discoverExtensions(testRoot);
      expect(discoveryResult.extensions).toHaveLength(1);

      const registryResult = generator.generateAndroidRegistry(
        discoveryResult.extensions,
      );

      // Verify all modules are imported and registered
      expect(registryResult.code).toContain(
        "import com.lynxjs.complete.StorageModule",
      );
      expect(registryResult.code).toContain(
        "import com.lynxjs.complete.CacheModule",
      );
      expect(registryResult.code).toContain(
        "import com.lynxjs.complete.DatabaseModule",
      );

      expect(registryResult.code).toContain(
        'registerModule("Storage", StorageModule::class.java)',
      );
      expect(registryResult.code).toContain(
        'registerModule("Cache", CacheModule::class.java)',
      );
      expect(registryResult.code).toContain(
        'registerModule("Database", DatabaseModule::class.java)',
      );

      // Verify all elements are imported and registered
      expect(registryResult.code).toContain(
        "import com.lynxjs.complete.CustomButton",
      );
      expect(registryResult.code).toContain(
        "import com.lynxjs.complete.CustomInput",
      );
      expect(registryResult.code).toContain(
        "import com.lynxjs.complete.CustomCard",
      );

      expect(registryResult.code).toContain(
        'addBehavior(object : Behavior("CustomButton")',
      );
      expect(registryResult.code).toContain(
        'addBehavior(object : Behavior("CustomInput")',
      );
      expect(registryResult.code).toContain(
        'addBehavior(object : Behavior("CustomCard")',
      );

      // Verify service is mentioned (even if not fully implemented)
      expect(registryResult.code).toContain("LogService");
    });

    it("should aggregate extensions from different scopes correctly", async () => {
      const nodeModules = join(testRoot, "node_modules");

      // Create packages in different organizational scopes
      const scopes = [
        { scope: "@lynxjs", name: "core", module: "Core" },
        { scope: "@company", name: "internal", module: "Internal" },
        { scope: "@opensource", name: "community", module: "Community" },
        { scope: null, name: "standalone", module: "Standalone" },
      ];

      for (const pkg of scopes) {
        const pkgDir = pkg.scope
          ? join(nodeModules, pkg.scope, pkg.name)
          : join(nodeModules, pkg.name);
        mkdirSync(pkgDir, { recursive: true });

        const fullName = pkg.scope ? `${pkg.scope}/${pkg.name}` : pkg.name;
        const packageName = pkg.scope
          ? `com.${pkg.scope.replace("@", "")}.${pkg.name}`
          : `com.test.${pkg.name}`;

        writeFileSync(
          join(pkgDir, "tiger.config.json"),
          JSON.stringify({
            name: fullName,
            version: "1.0.0",
            platforms: {
              android: {
                packageName: packageName,
              },
            },
            nativeModules: [
              {
                name: pkg.module,
                className: `${pkg.module}Module`,
                language: "kotlin",
              },
            ],
            elements: [],
            services: [],
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

      // Discover and generate
      const discoveryResult = await discovery.discoverExtensions(testRoot);
      expect(discoveryResult.extensions).toHaveLength(4);

      const registryResult = generator.generateAndroidRegistry(
        discoveryResult.extensions,
      );

      // Verify all are in single registry
      expect(registryResult.code).toContain(
        "import com.lynxjs.core.CoreModule",
      );
      expect(registryResult.code).toContain(
        "import com.company.internal.InternalModule",
      );
      expect(registryResult.code).toContain(
        "import com.opensource.community.CommunityModule",
      );
      expect(registryResult.code).toContain(
        "import com.test.standalone.StandaloneModule",
      );

      // Verify single setupGlobal aggregates all
      const setupGlobalMatches = registryResult.code.match(
        /fun setupGlobal\(context: Context\)/g,
      );
      expect(setupGlobalMatches).toHaveLength(1);

      expect(registryResult.code).toContain('registerModule("Core"');
      expect(registryResult.code).toContain('registerModule("Internal"');
      expect(registryResult.code).toContain('registerModule("Community"');
      expect(registryResult.code).toContain('registerModule("Standalone"');
    });

    it("should handle discovery errors gracefully and still generate registry for valid packages", async () => {
      const nodeModules = join(testRoot, "node_modules");

      // Create valid package
      const validPkgDir = join(nodeModules, "valid-package");
      mkdirSync(validPkgDir, { recursive: true });
      writeFileSync(
        join(validPkgDir, "tiger.config.json"),
        JSON.stringify({
          name: "valid-package",
          version: "1.0.0",
          platforms: {
            android: {
              packageName: "com.test.valid",
            },
          },
          nativeModules: [
            {
              name: "ValidModule",
              className: "ValidModule",
              language: "kotlin",
            },
          ],
          elements: [],
          services: [],
        }),
      );
      writeFileSync(
        join(validPkgDir, "package.json"),
        JSON.stringify({
          name: "valid-package",
          version: "1.0.0",
        }),
      );

      // Create invalid package (bad JSON)
      const invalidPkgDir = join(nodeModules, "invalid-package");
      mkdirSync(invalidPkgDir, { recursive: true });
      writeFileSync(join(invalidPkgDir, "tiger.config.json"), "{ invalid json }");

      // Create another valid package
      const anotherValidPkgDir = join(nodeModules, "another-valid");
      mkdirSync(anotherValidPkgDir, { recursive: true });
      writeFileSync(
        join(anotherValidPkgDir, "tiger.config.json"),
        JSON.stringify({
          name: "another-valid",
          version: "1.0.0",
          platforms: {
            android: {
              packageName: "com.test.anothervalid",
            },
          },
          nativeModules: [
            {
              name: "AnotherModule",
              className: "AnotherModule",
              language: "kotlin",
            },
          ],
          elements: [],
          services: [],
        }),
      );
      writeFileSync(
        join(anotherValidPkgDir, "package.json"),
        JSON.stringify({
          name: "another-valid",
          version: "1.0.0",
        }),
      );

      // Discover
      const discoveryResult = await discovery.discoverExtensions(testRoot);

      // Should have 2 valid extensions and 1 error
      expect(discoveryResult.extensions).toHaveLength(2);
      expect(discoveryResult.errors.length).toBeGreaterThan(0);

      // Generate registry with valid extensions
      const registryResult = generator.generateAndroidRegistry(
        discoveryResult.extensions,
      );

      // Should contain both valid modules
      expect(registryResult.code).toContain(
        "import com.test.valid.ValidModule",
      );
      expect(registryResult.code).toContain(
        "import com.test.anothervalid.AnotherModule",
      );
      expect(registryResult.code).toContain('registerModule("ValidModule"');
      expect(registryResult.code).toContain('registerModule("AnotherModule"');

      // Should not contain invalid package
      expect(registryResult.code).not.toContain("invalid-package");
    });
  });

  describe("Registry Aggregation Verification", () => {
    it("should ensure RegistryGenerator receives all discovered extensions", async () => {
      const nodeModules = join(testRoot, "node_modules");

      // Create 5 packages
      for (let i = 1; i <= 5; i++) {
        const pkgDir = join(nodeModules, `package-${i}`);
        mkdirSync(pkgDir, { recursive: true });

        writeFileSync(
          join(pkgDir, "tiger.config.json"),
          JSON.stringify({
            name: `package-${i}`,
            version: "1.0.0",
            platforms: {
              android: {
                packageName: `com.test.package${i}`,
              },
            },
            nativeModules: [
              {
                name: `Module${i}`,
                className: `Module${i}`,
                language: "kotlin",
              },
            ],
            elements: [],
            services: [],
          }),
        );

        writeFileSync(
          join(pkgDir, "package.json"),
          JSON.stringify({
            name: `package-${i}`,
            version: "1.0.0",
          }),
        );
      }

      // Discover
      const discoveryResult = await discovery.discoverExtensions(testRoot);

      // Verify discovery found all 5
      expect(discoveryResult.extensions).toHaveLength(5);

      // Pass all to generator
      const registryResult = generator.generateAndroidRegistry(
        discoveryResult.extensions,
      );

      // Verify generator received and processed all 5
      for (let i = 1; i <= 5; i++) {
        expect(registryResult.code).toContain(
          `import com.test.package${i}.Module${i}`,
        );
        expect(registryResult.code).toContain(`registerModule("Module${i}"`);
      }
    });

    it("should verify single ExtensionRegistry.kt is generated with all modules", async () => {
      const nodeModules = join(testRoot, "node_modules");

      // Create multiple packages
      const packages = ["alpha", "beta", "gamma", "delta"];

      for (const name of packages) {
        const pkgDir = join(nodeModules, name);
        mkdirSync(pkgDir, { recursive: true });

        writeFileSync(
          join(pkgDir, "tiger.config.json"),
          JSON.stringify({
            name: name,
            version: "1.0.0",
            platforms: {
              android: {
                packageName: `com.test.${name}`,
              },
            },
            nativeModules: [
              {
                name: `${name.charAt(0).toUpperCase()}${name.slice(1)}Module`,
                className: `${name.charAt(0).toUpperCase()}${name.slice(1)}Module`,
                language: "kotlin",
              },
            ],
            elements: [],
            services: [],
          }),
        );

        writeFileSync(
          join(pkgDir, "package.json"),
          JSON.stringify({
            name: name,
            version: "1.0.0",
          }),
        );
      }

      const discoveryResult = await discovery.discoverExtensions(testRoot);
      const registryResult = generator.generateAndroidRegistry(
        discoveryResult.extensions,
      );

      // Verify single file path
      expect(registryResult.outputPath).toBe(
        "com/lynxjs/generated/extensions/ExtensionRegistry.kt",
      );

      // Verify single object declaration
      const objectMatches = registryResult.code.match(
        /object ExtensionRegistry/g,
      );
      expect(objectMatches).toHaveLength(1);

      // Verify all modules in single setupGlobal
      expect(registryResult.code).toContain('registerModule("AlphaModule"');
      expect(registryResult.code).toContain('registerModule("BetaModule"');
      expect(registryResult.code).toContain('registerModule("GammaModule"');
      expect(registryResult.code).toContain('registerModule("DeltaModule"');

      const setupGlobalMatches = registryResult.code.match(/fun setupGlobal/g);
      expect(setupGlobalMatches).toHaveLength(1);
    });

    it("should test that setupGlobal method registers all modules from all packages", async () => {
      const nodeModules = join(testRoot, "node_modules");

      // Create packages with different characteristics
      const configs = [
        {
          name: "pkg-with-one-module",
          modules: ["SingleModule"],
        },
        {
          name: "pkg-with-three-modules",
          modules: ["FirstModule", "SecondModule", "ThirdModule"],
        },
        {
          name: "pkg-with-two-modules",
          modules: ["ModuleA", "ModuleB"],
        },
      ];

      for (const config of configs) {
        const pkgDir = join(nodeModules, config.name);
        mkdirSync(pkgDir, { recursive: true });

        writeFileSync(
          join(pkgDir, "tiger.config.json"),
          JSON.stringify({
            name: config.name,
            version: "1.0.0",
            platforms: {
              android: {
                packageName: `com.test.${config.name.replace(/-/g, "")}`,
              },
            },
            nativeModules: config.modules.map((m) => ({
              name: m,
              className: m,
              language: "kotlin",
            })),
            elements: [],
            services: [],
          }),
        );

        writeFileSync(
          join(pkgDir, "package.json"),
          JSON.stringify({
            name: config.name,
            version: "1.0.0",
          }),
        );
      }

      const discoveryResult = await discovery.discoverExtensions(testRoot);
      const registryResult = generator.generateAndroidRegistry(
        discoveryResult.extensions,
      );

      // Verify all 6 modules (1 + 3 + 2) are registered
      const allModules = [
        "SingleModule",
        "FirstModule",
        "SecondModule",
        "ThirdModule",
        "ModuleA",
        "ModuleB",
      ];

      for (const moduleName of allModules) {
        expect(registryResult.code).toContain(`registerModule("${moduleName}"`);
      }

      // Verify they're all in the same setupGlobal method
      // Find the closing brace of the setupGlobal method (not the first closing brace)
      const setupGlobalStart = registryResult.code.indexOf("fun setupGlobal");
      let braceCount = 0;
      let setupGlobalEnd = setupGlobalStart;
      let foundOpenBrace = false;

      for (let i = setupGlobalStart; i < registryResult.code.length; i++) {
        if (registryResult.code[i] === "{") {
          braceCount++;
          foundOpenBrace = true;
        } else if (registryResult.code[i] === "}") {
          braceCount--;
          if (foundOpenBrace && braceCount === 0) {
            setupGlobalEnd = i;
            break;
          }
        }
      }

      const setupGlobalBody = registryResult.code.substring(
        setupGlobalStart,
        setupGlobalEnd,
      );

      for (const moduleName of allModules) {
        expect(setupGlobalBody).toContain(`registerModule("${moduleName}"`);
      }
    });
  });
});

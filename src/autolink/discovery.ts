/**
 * Extension discovery engine for LynxJS Autolink
 * Scans node_modules for extension packages and builds extension registry
 */

import { pathExistsSync, readJsonSync } from "fs-extra/esm";
import { join } from "path";
import fg from "fast-glob";
import type { AutolinkConfig } from "./config.js";
import { parseAutolinkConfig } from "./parser.js";

/**
 * Supported platforms for extensions
 */
export type Platform = "android" | "ios" | "web";

/**
 * Information about a native module
 */
export interface ModuleInfo {
  name: string;
  className: string;
  platform: Platform;
  sourceFile: string;
}

/**
 * Information about a custom element
 */
export interface ElementInfo {
  name: string;
  className: string;
  platform: Platform;
  sourceFile: string;
}

/**
 * Information about a service
 */
export interface ServiceInfo {
  name: string;
  className: string;
  platform: Platform;
  sourceFile: string;
}

/**
 * Complete information about a discovered extension
 */
export interface ExtensionInfo {
  /** Package name */
  name: string;
  /** Package version */
  version: string;
  /** Absolute path to package directory */
  path: string;
  /** Parsed autolink configuration */
  config: AutolinkConfig;
  /** Supported platforms */
  platforms: Platform[];
  /** Extension dependencies */
  dependencies: string[];
  /** Native modules provided by this extension */
  nativeModules: ModuleInfo[];
  /** Custom elements provided by this extension */
  elements: ElementInfo[];
  /** Services provided by this extension */
  services: ServiceInfo[];
}

/**
 * Package.json metadata
 */
interface PackageJson {
  name: string;
  version: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  [key: string]: unknown;
}

/**
 * Discovery result with extensions and any errors
 */
export interface DiscoveryResult {
  extensions: ExtensionInfo[];
  errors: DiscoveryError[];
}

/**
 * Error during extension discovery
 */
export class DiscoveryError extends Error {
  constructor(
    public packagePath: string,
    public reason: string,
    message?: string,
  ) {
    super(message || `Discovery error in ${packagePath}: ${reason}`);
    this.name = "DiscoveryError";
  }
}

/**
 * Extension discovery engine
 */
export class ExtensionDiscovery {
  private discoveredExtensions = new Map<string, ExtensionInfo>();
  private errors: DiscoveryError[] = [];

  /**
   * Discovers all extensions in a project
   * @param projectRoot - Root directory of the project
   * @returns Discovery result with extensions and errors
   */
  async discoverExtensions(projectRoot: string): Promise<DiscoveryResult> {
    this.discoveredExtensions.clear();
    this.errors = [];

    const nodeModulesPath = join(projectRoot, "node_modules");

    if (!pathExistsSync(nodeModulesPath)) {
      return {
        extensions: [],
        errors: [
          new DiscoveryError(
            projectRoot,
            "node_modules directory not found",
            "Run npm install first",
          ),
        ],
      };
    }

    // Scan node_modules for extensions using fast-glob
    await this.scanNodeModules(projectRoot);

    return {
      extensions: Array.from(this.discoveredExtensions.values()),
      errors: this.errors,
    };
  }

  /**
   * Recursively scans node_modules for extension packages using fast-glob
   * @param projectRoot - Root directory of the project
   */
  private async scanNodeModules(projectRoot: string): Promise<void> {
    try {
      // Use fast-glob to find all tiger.config.json files in node_modules
      const configFiles = await fg("node_modules/**/tiger.config.json", {
        cwd: projectRoot,
        absolute: true,
        ignore: ["**/node_modules/**/node_modules/**"], // Avoid nested node_modules
      });

      // Process each discovered extension package
      for (const configFile of configFiles) {
        const packagePath = join(configFile, "..");
        await this.processPackage(packagePath);
      }
    } catch (error) {
      this.errors.push(
        new DiscoveryError(
          projectRoot,
          "Failed to scan node_modules",
          error instanceof Error ? error.message : String(error),
        ),
      );
    }
  }

  /**
   * Processes a single package to check if it's an extension
   * @param packagePath - Path to package directory
   */
  private async processPackage(packagePath: string): Promise<void> {
    // Check for tiger.config.json
    const configPath = join(packagePath, "tiger.config.json");
    if (!pathExistsSync(configPath)) {
      return; // Not an extension package
    }

    try {
      // Parse autolink configuration
      const parseResult = parseAutolinkConfig(packagePath);

      if (!parseResult.config) {
        this.errors.push(
          new DiscoveryError(
            packagePath,
            "Invalid tiger.config.json configuration",
            parseResult.validation.errors.map((e) => e.message).join("; "),
          ),
        );
        return;
      }

      // Read package.json for metadata
      const packageJson = this.readPackageJson(packagePath);
      if (!packageJson) {
        this.errors.push(
          new DiscoveryError(packagePath, "Missing or invalid package.json"),
        );
        return;
      }

      // Build extension info
      const extensionInfo = this.buildExtensionInfo(
        packagePath,
        parseResult.config,
        packageJson,
      );

      // Store extension
      this.discoveredExtensions.set(extensionInfo.name, extensionInfo);
    } catch (error) {
      this.errors.push(
        new DiscoveryError(
          packagePath,
          "Failed to process extension package",
          error instanceof Error ? error.message : String(error),
        ),
      );
    }
  }

  /**
   * Reads and parses package.json using fs-extra
   * @param packagePath - Path to package directory
   * @returns Parsed package.json or null if invalid
   */
  private readPackageJson(packagePath: string): PackageJson | null {
    const packageJsonPath = join(packagePath, "package.json");

    if (!pathExistsSync(packageJsonPath)) {
      return null;
    }

    try {
      return readJsonSync(packageJsonPath) as PackageJson;
    } catch {
      return null;
    }
  }

  /**
   * Builds complete extension information from config and package.json
   * @param packagePath - Path to package directory
   * @param config - Parsed autolink configuration
   * @param packageJson - Parsed package.json
   * @returns Complete extension information
   */
  private buildExtensionInfo(
    packagePath: string,
    config: AutolinkConfig,
    packageJson: PackageJson,
  ): ExtensionInfo {
    // Determine supported platforms
    const platforms: Platform[] = [];
    if (config.platforms.android) platforms.push("android");
    if (config.platforms.ios) platforms.push("ios");
    if (config.platforms.web) platforms.push("web");

    // Build module info - handle both old string[] and new NativeModuleConfig[] formats
    const nativeModules: ModuleInfo[] = [];
    if (config.nativeModules) {
      for (const moduleConfig of config.nativeModules) {
        // Handle both old format (string) and new format (object)
        const moduleName =
          typeof moduleConfig === "string" ? moduleConfig : moduleConfig.name;
        const className =
          typeof moduleConfig === "string"
            ? moduleConfig
            : moduleConfig.className;

        for (const platform of platforms) {
          nativeModules.push({
            name: moduleName,
            className: className,
            platform,
            sourceFile: this.resolveSourceFile(packagePath, platform, config),
          });
        }
      }
    }

    // Build element info
    const elements: ElementInfo[] = [];
    if (config.elements) {
      for (const elementName of config.elements) {
        for (const platform of platforms) {
          elements.push({
            name: elementName,
            className: elementName,
            platform,
            sourceFile: this.resolveSourceFile(packagePath, platform, config),
          });
        }
      }
    }

    // Build service info
    const services: ServiceInfo[] = [];
    if (config.services) {
      for (const serviceName of config.services) {
        for (const platform of platforms) {
          services.push({
            name: serviceName,
            className: serviceName,
            platform,
            sourceFile: this.resolveSourceFile(packagePath, platform, config),
          });
        }
      }
    }

    return {
      name: config.name,
      version: config.version,
      path: packagePath,
      config,
      platforms,
      dependencies: config.dependencies || [],
      nativeModules,
      elements,
      services,
    };
  }

  /**
   * Resolves source file path for a platform
   * @param packagePath - Path to package directory
   * @param platform - Target platform
   * @param config - Autolink configuration
   * @returns Relative source file path
   */
  private resolveSourceFile(
    packagePath: string,
    platform: Platform,
    config: AutolinkConfig,
  ): string {
    switch (platform) {
      case "android":
        return config.platforms.android?.sourceDir || "android/src/main";
      case "ios":
        return config.platforms.ios?.sourceDir || "ios/src";
      case "web":
        return config.platforms.web?.entry || "web/src/index.ts";
      default:
        return "";
    }
  }
}

/**
 * Rsbuild Plugin for LynxJS Autolink
 *
 * This module provides an Rsbuild plugin that discovers LynxJS extensions
 * and generates registry code for web platform.
 */

import { ExtensionDiscovery, type ExtensionInfo } from "../discovery.js";
import { RegistryGenerator } from "../registry-generator.js";
import * as path from "path";
import * as fs from "fs";

export interface RsbuildPluginOptions {
  projectRoot?: string;
  outputDir?: string;
  autoLink?: boolean;
}

// Rsbuild plugin type
interface RsbuildPlugin {
  name: string;
  setup: (api: any) => void;
}

/**
 * Factory function for Rsbuild plugin
 */
export function pluginWebPlatform(
  options: RsbuildPluginOptions = {},
): RsbuildPlugin {
  const pluginOptions = {
    projectRoot: options.projectRoot || process.cwd(),
    outputDir: options.outputDir || "generated/extensions",
    autoLink: options.autoLink ?? true,
  };

  return {
    name: "lynx-extension-rsbuild-plugin",

    setup(api) {
      if (!pluginOptions.autoLink) {
        return;
      }

      const discovery = new ExtensionDiscovery();
      const registryGenerator = new RegistryGenerator();

      // Generate registry before compilation starts
      api.onBeforeEnvironmentCompile(async () => {
        try {
          // Discover extensions
          const result = await discovery.discoverExtensions(
            pluginOptions.projectRoot,
          );
          const webExtensions = result.extensions.filter(
            (ext: ExtensionInfo) => ext.config.platforms?.web,
          );

          if (webExtensions.length === 0) {
            return;
          }

          // Generate registry code
          const registryResult =
            registryGenerator.generateWebRegistry(webExtensions);
          const declarationCode = generateTypeDeclarations(webExtensions);

          // Write registry files
          const outputDir = path.join(
            pluginOptions.projectRoot,
            pluginOptions.outputDir,
          );
          fs.mkdirSync(outputDir, { recursive: true });

          const registryPath = path.join(outputDir, "ExtensionRegistry.ts");
          const declarationPath = path.join(outputDir, "extensions.d.ts");

          fs.writeFileSync(registryPath, registryResult.code);
          fs.writeFileSync(declarationPath, declarationCode);

          if (api.logger) {
            api.logger.info(
              `Generated registry for ${webExtensions.length} LynxJS extensions`,
            );
          }
        } catch (error) {
          if (api.logger) {
            api.logger.error(
              "Failed to generate LynxJS extension registry:",
              error,
            );
          }
          throw error;
        }
      });

      // Add alias for virtual module
      api.modifyRspackConfig((config: any) => {
        config.resolve = config.resolve || {};
        config.resolve.alias = config.resolve.alias || {};
        config.resolve.alias["@lynxjs/extension-registry"] = path.join(
          pluginOptions.projectRoot,
          pluginOptions.outputDir,
          "ExtensionRegistry.ts",
        );
      });
    },
  };
}

/**
 * Generate TypeScript declarations for extensions
 */
function generateTypeDeclarations(extensions: ExtensionInfo[]): string {
  const declarations = extensions
    .map((ext) => {
      const webConfig = ext.config.platforms?.web;
      if (!webConfig?.entry) return "";

      return `declare module '${ext.name}' {
  export * from '${ext.path}/${webConfig.entry}';
}`;
    })
    .filter(Boolean)
    .join("\n\n");

  return `// Auto-generated type declarations for LynxJS extensions
${declarations}
`;
}

/**
 * Alternative export name for compatibility
 */
export function lynxExtensionPlugin(
  options?: RsbuildPluginOptions,
): RsbuildPlugin {
  return pluginWebPlatform(options);
}

/**
 * Tiger Element Registry Plugin for Rsbuild
 * 
 * Provides autolink functionality for LynxJS extensions
 */

import * as path from "path";
import * as fs from "fs";
import type { TigerElementRegistryOptions } from "./types";
import { scanWebElements } from "./scanner";
import { generateElementRegistry, generateRuntimeRegistry } from "./generator";

// Rsbuild plugin type
interface RsbuildPlugin {
  name: string;
  setup: (api: any) => void;
}

/**
 * Factory function for Tiger Element Registry plugin
 */
export function pluginTigerElementRegistry(
  options: TigerElementRegistryOptions = {},
): RsbuildPlugin {
  const pluginOptions = {
    projectRoot: options.projectRoot || process.cwd(),
    outputDir: options.outputDir || "generated/extensions",
    autoLink: options.autoLink ?? true,
    scanPattern: options.scanPattern || "*",
    excludePackages: options.excludePackages || [],
    verbose: options.verbose ?? false,
  };

  return {
    name: "tiger-element-registry",

    setup(api) {
      if (!pluginOptions.autoLink) {
        if (pluginOptions.verbose) {
          console.log('🔧 Tiger Element Registry: Autolink disabled');
        }
        return;
      }

      const generateRegistry = async () => {
        try {
          if (pluginOptions.verbose) {
            console.log('🔍 Tiger Element Registry: Scanning for LynxJS web elements...');
          }
          
          // Scan for @lynxelement annotations
          const elements = await scanWebElements(pluginOptions.projectRoot, {
            scanPattern: pluginOptions.scanPattern,
            excludePackages: pluginOptions.excludePackages,
            verbose: pluginOptions.verbose,
          });
          
          if (elements.length === 0) {
            if (pluginOptions.verbose) {
              console.log('ℹ️  Tiger Element Registry: No LynxJS web elements found');
            }
          } else {
            console.log(`✅ Tiger Element Registry: Found ${elements.length} LynxJS element(s):`);
            elements.forEach(el => {
              console.log(`   - <${el.tagName}> from ${el.packageName}`);
            });
          }
          
          // Generate registry code
          const registryCode = generateElementRegistry(elements);
          const runtimeRegistryCode = generateRuntimeRegistry();
          
          // Write registry files
          const outputDir = path.join(
            pluginOptions.projectRoot,
            pluginOptions.outputDir,
          );
          fs.mkdirSync(outputDir, { recursive: true });
          
          const registryPath = path.join(outputDir, 'ElementRegistry.ts');
          const runtimeRegistryPath = path.join(outputDir, 'runtime-registry.ts');
          
          fs.writeFileSync(registryPath, registryCode);
          fs.writeFileSync(runtimeRegistryPath, runtimeRegistryCode);
          
          if (pluginOptions.verbose) {
            console.log(`📝 Tiger Element Registry: Generated files:`);
            console.log(`   - ${registryPath}`);
          }
        } catch (error) {
          console.error('❌ Tiger Element Registry: Failed to generate registry:', error);
          throw error;
        }
      };

      // Generate registry before dev server starts
      api.onBeforeStartDevServer?.(generateRegistry);
      
      // Generate registry before build
      api.onBeforeBuild?.(generateRegistry);

      // Add alias for virtual module
      api.modifyRspackConfig?.((config: any) => {
        config.resolve = config.resolve || {};
        config.resolve.alias = config.resolve.alias || {};
        config.resolve.alias["@tiger/element-registry"] = path.join(
          pluginOptions.projectRoot,
          pluginOptions.outputDir,
          "runtime-registry.ts",
        );
      });
    },
  };
}
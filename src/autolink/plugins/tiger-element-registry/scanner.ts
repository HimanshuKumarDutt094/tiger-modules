/**
 * Scanner for discovering LynxJS extensions in node_modules
 */

import * as path from "path";
import * as fs from "fs";
import glob from "fast-glob";
import type { WebElement, WebNativeModule, TigerConfig } from "./types";

/**
 * Check if a package has tiger.config.json and supports web platform
 * Returns the config if found, null otherwise
 */
function getTigerConfig(packagePath: string): TigerConfig | null {
  const configPath = path.join(packagePath, 'tiger.config.json');
  if (!fs.existsSync(configPath)) {
    return null;
  }
  
  try {
    const config: TigerConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    if (config.platforms?.web !== undefined) {
      return config;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Scan for @lynxelement annotations in web source files
 * Uses tiger.config.json to find web source directory and element definitions
 */
export async function scanWebElements(
  projectRoot: string,
  options: {
    scanPattern?: string;
    excludePackages?: string[];
    verbose?: boolean;
  } = {}
): Promise<WebElement[]> {
  const elements: WebElement[] = [];
  const { scanPattern = '*', excludePackages = [], verbose = false } = options;
  
  // First, find packages with tiger.config.json that support web
  const packagePattern = path.join(projectRoot, 'node_modules', scanPattern);
  const packageDirs = await glob(packagePattern, { 
    onlyDirectories: true,
    absolute: true 
  });
  
  const tigerPackages: Array<{ dir: string; name: string; config: TigerConfig }> = [];
  
  for (const packageDir of packageDirs) {
    const packageName = path.basename(packageDir);
    if (excludePackages.includes(packageName)) {
      continue;
    }
    
    const config = getTigerConfig(packageDir);
    if (config) {
      tigerPackages.push({ dir: packageDir, name: packageName, config });
    }
  }
  
  if (verbose) {
    console.log(`🔍 Found ${tigerPackages.length} Tiger packages with web support`);
  }
  
  // Scan each Tiger package for web elements
  for (const { dir: packageDir, name: packageName, config } of tigerPackages) {
    // Get web source directory from config, default to 'web/src'
    const webSourceDir = config.platforms?.web?.sourceDir || 'web/src';
    const webSrcPattern = path.join(packageDir, webSourceDir, '**', '*.{ts,js}');
    const files = await glob(webSrcPattern, { absolute: true });
    
    // Get element definitions from config to match tag names
    const configElements = config.elements || [];
    const elementTagMap = new Map<string, string | undefined>(
      configElements.map((el) => [el.name, el.tagName])
    );
    
    for (const filePath of files) {
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        
        // Match @lynxelement annotation with tag name
        // Pattern: /** @lynxelement name:tag-name */
        const elementRegex = /\/\*\*\s*@lynxelement\s+name:([a-z0-9-]+)\s*\*\/\s*(?:export\s+)?class\s+(\w+)/g;
        let match;
        
        while ((match = elementRegex.exec(content)) !== null) {
          const tagNameFromAnnotation = match[1];
          const className = match[2];
          
          // Use tag name from config if available, otherwise use annotation
          const tagName = elementTagMap.get(className) || tagNameFromAnnotation;
          
          elements.push({
            name: className,
            tagName,
            className,
            filePath,
            packageName,
          });
          
          if (verbose) {
            console.log(`   - Found <${tagName}> (${className}) in ${packageName}`);
          }
        }
      } catch (error) {
        if (verbose) {
          console.warn(`Failed to scan ${filePath}:`, error);
        }
      }
    }
  }
  
  return elements;
}

/**
 * Scan for @lynxnativemodule annotations in web source files
 * Uses tiger.config.json to find web source directory
 */
export async function scanWebNativeModules(
  projectRoot: string,
  options: {
    scanPattern?: string;
    excludePackages?: string[];
    verbose?: boolean;
  } = {}
): Promise<WebNativeModule[]> {
  const modules: WebNativeModule[] = [];
  const { scanPattern = '*', excludePackages = [], verbose = false } = options;
  
  // First, find packages with tiger.config.json that support web
  const packagePattern = path.join(projectRoot, 'node_modules', scanPattern);
  const packageDirs = await glob(packagePattern, { 
    onlyDirectories: true,
    absolute: true 
  });
  
  const tigerPackages: Array<{ dir: string; name: string; config: TigerConfig }> = [];
  
  for (const packageDir of packageDirs) {
    const packageName = path.basename(packageDir);
    if (excludePackages.includes(packageName)) {
      continue;
    }
    
    const config = getTigerConfig(packageDir);
    if (config) {
      tigerPackages.push({ dir: packageDir, name: packageName, config });
    }
  }
  
  // Scan each Tiger package for web native modules
  for (const { dir: packageDir, name: packageName, config } of tigerPackages) {
    // Get web source directory from config, default to 'web/src'
    const webSourceDir = config.platforms?.web?.sourceDir || 'web/src';
    const webSrcPattern = path.join(packageDir, webSourceDir, '**', '*.{ts,js}');
    const files = await glob(webSrcPattern, { absolute: true });
    
    for (const filePath of files) {
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        
        // Match @lynxnativemodule annotation with module name
        // Pattern: /** @lynxnativemodule name:ModuleName */
        const moduleRegex = /\/\*\*\s*@lynxnativemodule\s+name:(\w+)\s*\*\/\s*(?:export\s+)?class\s+(\w+)/g;
        let match;
        
        while ((match = moduleRegex.exec(content)) !== null) {
          const moduleName = match[1];
          const className = match[2];
          
          modules.push({
            name: className,
            moduleName,
            className,
            filePath,
            packageName,
          });
          
          if (verbose) {
            console.log(`   - Found module ${moduleName} (${className}) in ${packageName}`);
          }
        }
      } catch (error) {
        if (verbose) {
          console.warn(`Failed to scan ${filePath}:`, error);
        }
      }
    }
  }
  
  return modules;
}
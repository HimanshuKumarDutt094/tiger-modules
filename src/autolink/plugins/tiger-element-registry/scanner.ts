/**
 * Scanner for discovering LynxJS extensions in node_modules
 */

import * as path from "path";
import * as fs from "fs";
import glob from "fast-glob";
import type { WebElement, TigerConfig } from "./types";

/**
 * Check if a package has tiger.config.json and supports web platform
 */
function hasTigerConfig(packagePath: string): boolean {
  const configPath = path.join(packagePath, 'tiger.config.json');
  if (!fs.existsSync(configPath)) {
    return false;
  }
  
  try {
    const config: TigerConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    return config.platforms?.web !== undefined;
  } catch {
    return false;
  }
}

/**
 * Scan for @lynxelement annotations in web source files
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
  
  const tigerPackages = packageDirs.filter(packageDir => {
    const packageName = path.basename(packageDir);
    if (excludePackages.includes(packageName)) {
      return false;
    }
    return hasTigerConfig(packageDir);
  });
  
  if (verbose) {
    console.log(`🔍 Found ${tigerPackages.length} Tiger packages with web support`);
  }
  
  // Scan each Tiger package for web elements
  for (const packageDir of tigerPackages) {
    const packageName = path.basename(packageDir);
    const webSrcPattern = path.join(packageDir, 'web', 'src', '**', '*.{ts,js}');
    const files = await glob(webSrcPattern, { absolute: true });
    
    for (const filePath of files) {
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        
        // Match @lynxelement annotation with tag name
        // Pattern: /** @lynxelement name:tag-name */
        const elementRegex = /\/\*\*\s*@lynxelement\s+name:([a-z0-9-]+)\s*\*\/\s*(?:export\s+)?class\s+(\w+)/g;
        let match;
        
        while ((match = elementRegex.exec(content)) !== null) {
          const tagName = match[1];
          const className = match[2];
          
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
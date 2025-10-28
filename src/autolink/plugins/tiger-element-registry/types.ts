/**
 * Configuration options for Tiger Element Registry plugin
 */
export interface TigerElementRegistryOptions {
  /** Project root directory (defaults to process.cwd()) */
  projectRoot?: string;
  
  /** Output directory for generated files (defaults to "generated/extensions") */
  outputDir?: string;
  
  /** Enable/disable autolink functionality (defaults to true) */
  autoLink?: boolean;
  
  /** Custom pattern for scanning packages (defaults to node_modules/*) */
  scanPattern?: string;
  
  /** Packages to exclude from scanning */
  excludePackages?: string[];
  
  /** Enable verbose logging */
  verbose?: boolean;
}

/**
 * Discovered web element information
 */
export interface WebElement {
  name: string;
  tagName: string;
  className: string;
  filePath: string;
  packageName: string;
}

/**
 * Tiger configuration from tiger.config.json
 */
export interface TigerConfig {
  platforms?: {
    android?: {
      packageName?: string;
    };
    ios?: Record<string, any>;
    web?: Record<string, any>;
  };
}
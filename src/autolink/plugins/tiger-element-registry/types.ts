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
 * Discovered web native module information
 */
export interface WebNativeModule {
  name: string;
  moduleName: string;
  className: string;
  filePath: string;
  packageName: string;
}

/**
 * Element configuration
 */
export interface ElementConfig {
  name: string;
  tagName?: string;
}

/**
 * Tiger configuration from tiger.config.json
 */
export interface TigerConfig {
  name?: string;
  version?: string;
  platforms?: {
    android?: {
      packageName?: string;
    };
    ios?: Record<string, any>;
    web?: {
      sourceDir?: string;
      entry?: string;
    };
  };
  elements?: ElementConfig[];
  nativeModules?: Array<{ name: string; className?: string }>;
  services?: string[];
}
/**
 * iOS CocoaPods Plugin for LynxJS Autolink
 *
 * This module provides utilities for generating CocoaPods plugin code that integrates
 * with iOS build lifecycle to discover extensions and generate registry code.
 */

import type { ExtensionInfo } from "../discovery.js";
import { RegistryGenerator } from "../registry-generator.js";

export interface CocoaPodsPluginConfig {
  projectRoot: string;
  outputDir: string;
  podfilePath?: string;
}

export class CocoaPodsPlugin {
  private config: CocoaPodsPluginConfig;
  private registryGenerator: RegistryGenerator;

  constructor(config: CocoaPodsPluginConfig) {
    this.config = config;
    this.registryGenerator = new RegistryGenerator();
  }

  /**
   * Generate CocoaPods plugin Ruby code
   */
  generatePluginRuby(): string {
    return `
# LynxJS Extension CocoaPods Plugin
module Pod
  class LynxExtensionPlugin
    
    def self.discover_extensions(project_root)
      extensions = []
      node_modules = File.join(project_root, 'node_modules')
      
      return extensions unless File.directory?(node_modules)
      
      Dir.glob(File.join(node_modules, '**', 'lynx.ext.json')).each do |config_file|
        extension_dir = File.dirname(config_file)
        config = JSON.parse(File.read(config_file))
        
        if config['platforms'] && config['platforms']['ios']
          extensions << {
            path: extension_dir,
            config: config,
            name: config['name'] || File.basename(extension_dir)
          }
        end
      end
      
      extensions
    end
    
    def self.add_extension_pods(installer, extensions)
      extensions.each do |ext|
        ios_config = ext[:config]['platforms']['ios']
        podspec_path = ios_config['podspecPath']
        
        if podspec_path
          full_path = File.join(ext[:path], podspec_path)
          pod File.basename(podspec_path, '.podspec'), path: File.dirname(full_path)
        end
      end
    end
    
    def self.configure_build_phases(installer, extensions)
      installer.pods_project.targets.each do |target|
        if target.name == installer.pods_project.root_object.name
          # Add registry generation build phase
          phase = target.new_shell_script_build_phase('Generate LynxJS Extension Registry')
          phase.shell_script = generate_registry_script(extensions)
        end
      end
    end
    
    def self.generate_registry_script(extensions)
      <<-SCRIPT
        echo "Generating LynxJS extension registry..."
        node -e "
          const fs = require('fs');
          const path = require('path');
          
          // Registry generation logic
          const registryCode = generateIOSRegistry();
          const outputPath = path.join('$PODS_TARGET_SRCROOT', 'generated', 'ExtensionRegistry.m');
          
          fs.mkdirSync(path.dirname(outputPath), { recursive: true });
          fs.writeFileSync(outputPath, registryCode);
          
          console.log('Registry generated at:', outputPath);
        "
      SCRIPT
    end
    
    def self.update_header_search_paths(installer, extensions)
      installer.pods_project.targets.each do |target|
        target.build_configurations.each do |config|
          header_paths = config.build_settings['HEADER_SEARCH_PATHS'] || []
          
          extensions.each do |ext|
            ios_config = ext[:config]['platforms']['ios']
            source_dir = ios_config['sourceDir'] || 'ios/src'
            header_path = File.join(ext[:path], source_dir)
            
            header_paths << "\\"$(PODS_ROOT)/#{File.basename(ext[:path])}/#{source_dir}\\""
          end
          
          config.build_settings['HEADER_SEARCH_PATHS'] = header_paths
        end
      end
    end
  end
end
`.trim();
  }

  /**
   * Generate Podfile integration snippet
   */
  generatePodfileIntegration(): string {
    return `
# LynxJS Extension Autolink
require 'json'

def setup_lynx_extensions(installer)
  project_root = File.dirname(__FILE__)
  
  # Discover extensions
  extensions = discover_lynx_extensions(project_root)
  puts "Discovered #{extensions.length} LynxJS extensions"
  
  # Add extension pods
  extensions.each do |ext|
    ios_config = ext[:config]['platforms']['ios']
    
    if ios_config['podspecPath']
      podspec_path = File.join(ext[:path], ios_config['podspecPath'])
      pod_name = File.basename(podspec_path, '.podspec')
      pod pod_name, path: File.dirname(podspec_path)
    end
  end
end

def discover_lynx_extensions(project_root)
  extensions = []
  node_modules = File.join(project_root, 'node_modules')
  
  return extensions unless File.directory?(node_modules)
  
  Dir.glob(File.join(node_modules, '**', 'lynx.ext.json')).each do |config_file|
    extension_dir = File.dirname(config_file)
    config = JSON.parse(File.read(config_file))
    
    if config['platforms'] && config['platforms']['ios']
      extensions << {
        path: extension_dir,
        config: config,
        name: config['name'] || File.basename(extension_dir)
      }
    end
  end
  
  extensions
end

# Post-install hook for registry generation
post_install do |installer|
  project_root = File.dirname(__FILE__)
  extensions = discover_lynx_extensions(project_root)
  
  # Generate registry code
  generate_extension_registry(project_root, extensions)
  
  # Update header search paths
  update_header_search_paths(installer, extensions)
end

def generate_extension_registry(project_root, extensions)
  output_dir = File.join(project_root, 'generated', 'extensions')
  FileUtils.mkdir_p(output_dir)
  
  # Generate registry files
  registry_h = generate_registry_header(extensions)
  registry_m = generate_registry_implementation(extensions)
  
  File.write(File.join(output_dir, 'ExtensionRegistry.h'), registry_h)
  File.write(File.join(output_dir, 'ExtensionRegistry.m'), registry_m)
  
  puts "Generated extension registry at: #{output_dir}"
end

def update_header_search_paths(installer, extensions)
  installer.pods_project.targets.each do |target|
    target.build_configurations.each do |config|
      header_paths = config.build_settings['HEADER_SEARCH_PATHS'] || []
      
      extensions.each do |ext|
        ios_config = ext[:config]['platforms']['ios']
        source_dir = ios_config['sourceDir'] || 'ios/src'
        header_path = File.join(ext[:path], source_dir)
        
        header_paths << "\\"#{header_path}\\""
      end
      
      config.build_settings['HEADER_SEARCH_PATHS'] = header_paths.uniq
    end
  end
end
`.trim();
  }

  /**
   * Generate registry header file
   */
  generateRegistryHeader(extensions: ExtensionInfo[]): string {
    return this.registryGenerator.generateIOSRegistryHeader(extensions);
  }

  /**
   * Generate registry implementation file
   */
  generateRegistryImplementation(extensions: ExtensionInfo[]): string {
    return this.registryGenerator.generateIOSRegistryImplementation(extensions);
  }

  /**
   * Generate build phase script for registry generation
   */
  generateBuildPhaseScript(): string {
    return `
#!/bin/bash

set -e

echo "Generating LynxJS extension registry..."

PROJECT_ROOT="$PROJECT_DIR/.."
OUTPUT_DIR="$PROJECT_DIR/generated/extensions"

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Run Node.js script to generate registry
node -e "
const fs = require('fs');
const path = require('path');

// Import registry generator
const { RegistryGenerator } = require('${this.config.projectRoot}/node_modules/@lynxjs/module/dist/autolink/registry-generator.js');
const { ExtensionDiscovery } = require('${this.config.projectRoot}/node_modules/@lynxjs/module/dist/autolink/discovery.js');

async function generateRegistry() {
  const discovery = new ExtensionDiscovery('$PROJECT_ROOT');
  const extensions = await discovery.discoverExtensions();
  
  const generator = new RegistryGenerator();
  const headerCode = generator.generateIOSRegistryHeader(extensions);
  const implCode = generator.generateIOSRegistryImplementation(extensions);
  
  fs.writeFileSync(path.join('$OUTPUT_DIR', 'ExtensionRegistry.h'), headerCode);
  fs.writeFileSync(path.join('$OUTPUT_DIR', 'ExtensionRegistry.m'), implCode);
  
  console.log('Registry generated successfully');
}

generateRegistry().catch(err => {
  console.error('Failed to generate registry:', err);
  process.exit(1);
});
"

echo "Registry generation complete"
`.trim();
  }

  /**
   * Generate Gemfile for plugin installation
   */
  generateGemfile(): string {
    return `
source 'https://rubygems.org'

# Ruby version
ruby ">= 2.6.10"

# CocoaPods
gem 'cocoapods', '>= 1.13', '!= 1.15.0', '!= 1.15.1'

# LynxJS Extension Plugin
gem 'cocoapods-lynx-extension', '>= 0.0.1'
`.trim();
  }

  /**
   * Generate complete CocoaPods plugin package
   */
  generatePluginPackage(extensions: ExtensionInfo[]): {
    pluginRuby: string;
    podfileIntegration: string;
    registryHeader: string;
    registryImplementation: string;
    buildPhaseScript: string;
    gemfile: string;
  } {
    return {
      pluginRuby: this.generatePluginRuby(),
      podfileIntegration: this.generatePodfileIntegration(),
      registryHeader: this.generateRegistryHeader(extensions),
      registryImplementation: this.generateRegistryImplementation(extensions),
      buildPhaseScript: this.generateBuildPhaseScript(),
      gemfile: this.generateGemfile(),
    };
  }

  /**
   * Generate pod installation command
   */
  generateInstallCommand(): string {
    return `
# Install CocoaPods plugin
gem install cocoapods-lynx-extension

# Or using Bundler
bundle install

# Install pods
cd ios && pod install
`.trim();
  }
}

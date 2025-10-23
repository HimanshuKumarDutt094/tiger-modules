# Implementation Plan

- [x] 1. Update configuration data models to support structured module metadata
  - Update TypeScript interfaces in src/autolink/config.ts
  - Update Kotlin data classes in Gradle plugin
  - Add backward compatibility for old string array format
  - _Requirements: 1.1, 3.1, 3.2, 3.3_

- [x] 1.1 Update TypeScript configuration interfaces
  - Modify AutolinkConfig interface to support both string[] and object[] for nativeModules
  - Add NativeModuleConfig interface with name, className, and language fields
  - Add language field to AndroidConfig interface
  - _Requirements: 1.1, 3.2, 3.3_

- [x] 1.2 Update Kotlin configuration data classes
  - Create NativeModuleConfig data class in AutolinkConfig.kt
  - Add custom deserializer to handle both old and new nativeModules format
  - Add language field to AndroidConfig with default value "kotlin"
  - _Requirements: 1.1, 3.2, 3.3_

- [ ]\* 1.3 Write unit tests for configuration parsing
  - Test parsing old format (string array)
  - Test parsing new format (object array)
  - Test mixed format scenarios
  - Test Java and Kotlin language specifications
  - _Requirements: 1.1, 3.3_

- [x] 2. Enhance registry generator to use fully qualified class names
  - Update TypeScript RegistryGenerator to generate proper imports
  - Update Kotlin RegistryGenerator to use packageName + className
  - Add support for Java class references
  - _Requirements: 1.2, 1.5, 2.1, 2.2_

- [x] 2.1 Update TypeScript registry generator
  - Modify generateAndroidRegistry to use module.className from config
  - Generate fully qualified imports using packageName + className
  - Update registration code to use proper class references
  - _Requirements: 1.2, 2.2_

- [x] 2.2 Update Kotlin registry generator
  - Modify generateAndroidRegistry to extract className from NativeModuleConfig
  - Generate imports as "packageName.className" instead of "packageName.moduleName"
  - Update registration to use className from config
  - Add comments indicating source package for each module
  - _Requirements: 1.2, 1.5, 2.1, 2.2_

- [x] 2.3 Add Java interoperability support
  - Ensure generated Kotlin code works with Java classes
  - Use ::class.java syntax which works for both Kotlin and Java classes
  - Add validation that className follows Java/Kotlin naming conventions
  - _Requirements: 1.2, 1.5, 6.2, 6.3_

- [ ]\* 2.4 Write unit tests for registry generation
  - Test registry generation with Kotlin modules
  - Test registry generation with Java modules
  - Test registry generation with mixed Kotlin and Java modules
  - Test registry generation with 10+ modules from different packages
  - _Requirements: 1.2, 2.1, 2.2_

- [x] 3. Verify unified registry handles multiple packages correctly
  - Review ExtensionDiscovery to ensure it scans all node_modules
  - Verify RegistryGenerator aggregates all modules into single file
  - Test with multiple extension packages
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 3.1 Review and test extension discovery
  - Verify scanDirectory recursively finds all tiger.config.json files
  - Test discovery with 10 different packages in node_modules
  - Ensure all packages are collected into single list
  - _Requirements: 2.1, 2.2, 7.1, 7.2_

- [x] 3.2 Verify registry aggregation logic
  - Confirm RegistryGenerator receives all discovered extensions
  - Verify single ExtensionRegistry.kt is generated with all modules
  - Test that setupGlobal method registers all modules from all packages
  - _Requirements: 2.2, 2.3, 2.4, 4.1, 4.2_

- [ ]\* 3.3 Write integration tests for multi-package scenarios
  - Create test with 10 mock extension packages
  - Run discovery and registry generation
  - Verify single registry file contains all 10 modules
  - Verify no duplicate registrations
  - _Requirements: 2.2, 2.3, 2.4_

- [x] 4. Update CLI to generate new configuration format
  - Modify init command to generate structured nativeModules
  - Add --language flag to choose between kotlin and java
  - Update templates to include className in tiger.config.json
  - _Requirements: 3.4, 3.5, 6.1_

- [x] 4.1 Update init command configuration generation
  - Generate nativeModules as array of objects with name and className
  - Set language field in platforms.android based on user choice or default
  - Include language field in each module config
  - _Requirements: 3.4, 3.5_

- [x] 4.2 Add language selection to init command
  - Add --language flag with options: kotlin, java
  - Default to kotlin if not specified
  - Update prompts to ask user for language preference
  - _Requirements: 1.1, 6.1_

- [x] 4.3 Update module templates
  - Ensure Java templates are available for Android modules
  - Update tiger.config.json template to use new format
  - Add proper package structure for Java modules
  - _Requirements: 1.1, 1.3, 1.4_

- [ ]\* 4.4 Write unit tests for CLI updates
  - Test init command generates correct tiger.config.json format
  - Test --language kotlin generates Kotlin config
  - Test --language java generates Java config
  - Test default behavior without --language flag
  - _Requirements: 3.4, 3.5_

- [x] 5. Add configuration validation and error handling
  - Validate module configuration in Gradle plugin
  - Add helpful error messages for missing or invalid fields
  - Validate package names and class names
  - _Requirements: 3.4, 3.5, 6.4, 6.5_

- [x] 5.1 Add configuration validation in Gradle plugin
  - Validate required fields (name, className) are present
  - Validate language field is "kotlin" or "java"
  - Validate packageName follows Java naming conventions
  - Validate className follows Java/Kotlin naming conventions
  - _Requirements: 3.4, 3.5, 6.4_

- [x] 5.2 Add source file validation
  - Check that module class files exist in source directories
  - Look for .kt files for Kotlin modules
  - Look for .java files for Java modules
  - Warn if declared module class is not found
  - _Requirements: 6.4, 7.3, 7.4_

- [x] 5.3 Improve error messages
  - Provide clear error messages for missing configuration
  - Suggest fixes for common configuration errors
  - Include package name and module name in error messages
  - _Requirements: 3.5, 6.4_

- [ ]\* 5.4 Write unit tests for validation
  - Test validation catches missing required fields
  - Test validation catches invalid language values
  - Test validation catches invalid package/class names
  - Test validation provides helpful error messages
  - _Requirements: 3.4, 3.5, 6.4_

- [ ] 6. Add backward compatibility support
  - Support old string array format for nativeModules
  - Convert old format to new format internally
  - Add deprecation warnings for old format
  - _Requirements: 3.4, 6.1_

- [ ] 6.1 Implement format detection and conversion
  - Detect if nativeModules is string array or object array
  - Convert string array to object array with name=className
  - Default language to "kotlin" for converted modules
  - _Requirements: 3.4_

- [ ] 6.2 Add deprecation warnings
  - Log warning when old format is detected
  - Suggest migration to new format
  - Provide example of new format in warning message
  - _Requirements: 6.1_

- [ ]\* 6.3 Write tests for backward compatibility
  - Test old format is correctly parsed
  - Test old format is converted to new format
  - Test mixed old and new format scenarios
  - Test deprecation warnings are shown
  - _Requirements: 3.4, 6.1_

- [ ] 7. Add build performance optimizations
  - Implement caching for discovery results
  - Add incremental registry generation
  - Optimize file scanning performance
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 7.1 Implement discovery result caching
  - Cache discovered extensions to build directory
  - Invalidate cache when node_modules changes
  - Use cached results when available and valid
  - _Requirements: 5.1, 5.2_

- [ ] 7.2 Add incremental registry generation
  - Only regenerate registry when extensions change
  - Compare hash of current extensions with previous
  - Skip generation if registry is up to date
  - _Requirements: 5.2, 5.4_

- [ ] 7.3 Add progress feedback
  - Log discovery progress for large node_modules
  - Show count of discovered extensions
  - Show registry generation progress
  - _Requirements: 5.5_

- [ ]\* 7.4 Write performance tests
  - Test caching reduces build time
  - Test incremental generation skips unnecessary work
  - Benchmark discovery with 50+ packages
  - _Requirements: 5.1, 5.2, 5.3_

- [ ] 8. Update documentation and examples
  - Document new configuration format
  - Add Java module development guide
  - Create multi-package setup examples
  - Update migration guide
  - _Requirements: 1.1, 3.4, 6.1_

- [ ] 8.1 Update configuration documentation
  - Document nativeModules object format
  - Document language field options
  - Provide examples for Kotlin and Java modules
  - Document backward compatibility
  - _Requirements: 3.4_

- [ ] 8.2 Create Java module guide
  - Step-by-step guide for creating Java modules
  - Example Java module implementation
  - Java-specific considerations and best practices
  - _Requirements: 1.1, 1.3_

- [ ] 8.3 Add multi-package examples
  - Example with 3-5 different extension packages
  - Show how single registry handles all modules
  - Demonstrate runtime usage
  - _Requirements: 2.2, 2.3, 4.1_

- [ ] 9. End-to-end testing with real Android project
  - Create test Android project
  - Install multiple test extension packages
  - Verify registry generation and compilation
  - Test runtime module registration
  - _Requirements: 2.2, 2.3, 4.1, 4.2, 4.3, 4.4_

- [ ] 9.1 Set up test Android project
  - Create minimal Android app in temp-testing
  - Configure Gradle plugin
  - Set up proper build configuration
  - _Requirements: 2.2, 4.1_

- [ ] 9.2 Create test extension packages
  - Create 3 test packages with Kotlin modules
  - Create 2 test packages with Java modules
  - Install all packages in test project
  - _Requirements: 1.1, 1.2, 2.2_

- [ ] 9.3 Verify build and runtime behavior
  - Run Gradle build and verify registry generation
  - Verify ExtensionRegistry.kt contains all 5 modules
  - Compile and run Android app
  - Verify all modules are registered and accessible
  - _Requirements: 2.2, 2.3, 4.1, 4.2, 4.3, 4.4_

- [ ]\* 9.4 Create automated integration tests
  - Automate test project setup
  - Automate package installation
  - Automate build verification
  - Add to CI pipeline
  - _Requirements: 2.2, 2.3, 4.1_

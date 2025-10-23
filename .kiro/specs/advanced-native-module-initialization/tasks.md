# Implementation Plan

- [x] 1. Extend configuration data models for advanced initialization
  - Update AutolinkConfig.kt to include InitializationConfig and InitializationHook data classes
  - Add JSON parsing support for new initialization fields in lynx.ext.json
  - Implement backward compatibility handling for existing configurations
  - _Requirements: 2.1, 2.2, 5.1_

- [ ] 2. Enhance configuration validation system
- [ ] 2.1 Add validation for initialization hook configurations
  - Extend ConfigValidator.kt to validate initialization hook syntax and types
  - Add validation for requiresApplicationContext flag and hook parameter combinations
  - Implement validation for static method existence and parameter compatibility
  - _Requirements: 5.1, 5.2, 5.5_

- [ ] 2.2 Implement dependency validation and circular dependency detection
  - Create dependency graph construction logic in ConfigValidator.kt
  - Add topological sorting algorithm for dependency resolution
  - Implement circular dependency detection with clear error reporting
  - _Requirements: 3.1, 3.2, 5.4_

- [ ]\* 2.3 Write unit tests for configuration validation
  - Create test cases for valid and invalid initialization configurations
  - Test dependency resolution and circular dependency detection
  - Verify error message quality and actionability
  - _Requirements: 5.1, 5.2, 5.3_

- [ ] 3. Enhance registry generator for advanced initialization patterns
- [-] 3.1 Implement Application context handling in registry generation
  - Update RegistryGenerator.kt to generate context validation and casting logic
  - Add error handling for missing or invalid Application context
  - Generate appropriate logging for context-related issues
  - _Requirements: 1.2, 1.4, 4.2_

- [-] 3.2 Add lifecycle callback registration code generation
  - Generate code for ActivityLifecycleCallbacks registration in setupGlobal method
  - Implement error isolation for lifecycle callback registration failures
  - Add logging for successful and failed callback registrations
  - _Requirements: 1.1, 1.3, 1.5_

- [ ] 3.3 Implement static method initialization code generation
  - Generate calls to static initialize methods when declared in configuration
  - Handle parameter passing for Application context and other required parameters
  - Add exception handling and error logging for static method calls
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ] 3.4 Create dependency-ordered initialization code generation
  - Implement topological sorting in RegistryGenerator for module initialization order
  - Generate separate initialization methods for each module with dependencies
  - Add dependency validation at runtime with clear error reporting
  - _Requirements: 3.1, 3.3, 3.4, 3.5_

- [ ]\* 3.5 Write unit tests for registry generation
  - Test Application context handling and validation
  - Test lifecycle callback registration code generation
  - Test static method initialization code generation
  - Test dependency-ordered initialization
  - _Requirements: 1.1, 1.2, 2.1, 3.1, 4.1_

- [ ] 4. Update gradle plugin integration
- [ ] 4.1 Enhance ExtensionDiscovery to parse new configuration fields
  - Update parseExtension method to handle initialization configuration
  - Add validation calls for new configuration fields during discovery
  - Implement backward compatibility for existing lynx.ext.json files
  - _Requirements: 2.1, 2.2, 5.1_

- [ ] 4.2 Update LynxExtensionBuildPlugin to use enhanced registry generation
  - Modify generateLynxExtensionRegistry task to pass initialization configurations
  - Update error handling to report initialization-specific validation errors
  - Ensure generated code is properly integrated into Android source sets
  - _Requirements: 1.1, 2.1, 3.1_

- [ ]\* 4.3 Write integration tests for gradle plugin enhancements
  - Test end-to-end module discovery with initialization configurations
  - Test registry generation with various initialization patterns
  - Test build integration and generated code compilation
  - _Requirements: 1.1, 2.1, 3.1, 4.1_

- [ ] 5. Create example configuration and update documentation
- [ ] 5.1 Create example lynx.ext.json with advanced initialization
  - Update e2e-test/lynxjs-linking-module/lynx.ext.json with lifecycle callback configuration
  - Add comprehensive examples for different initialization hook types
  - Include dependency declaration examples
  - _Requirements: 1.1, 2.1, 3.1, 4.1_

- [ ] 5.2 Update module implementation to work with new system
  - Ensure LynxjsLinkingModule.kt is compatible with generated initialization code
  - Verify LynxLinkingActivityListener.kt works with automatic registration
  - Test that existing module functionality remains unchanged
  - _Requirements: 1.1, 1.2, 1.3_

- [ ]\* 5.3 Write end-to-end integration tests
  - Test complete workflow from lynx.ext.json to working Android application
  - Verify ActivityLifecycleCallbacks are properly registered and functional
  - Test error handling and recovery scenarios
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ] 6. Implement backward compatibility and migration support
- [ ] 6.1 Ensure existing modules continue to work without changes
  - Test that modules without initialization configuration use legacy registration
  - Verify no breaking changes to existing AutolinkConfig parsing
  - Maintain compatibility with existing generated registry code
  - _Requirements: 2.2, 4.4_

- [ ] 6.2 Create migration utilities and documentation
  - Document how to migrate existing complex modules to use new initialization system
  - Provide examples of common migration patterns
  - Create validation warnings for modules that could benefit from new system
  - _Requirements: 2.1, 5.1, 5.2_

- [ ]\* 6.3 Write backward compatibility tests
  - Test that existing lynx.ext.json files work unchanged
  - Test that mixed old/new configuration scenarios work correctly
  - Verify no regression in existing functionality
  - _Requirements: 2.2, 4.4_

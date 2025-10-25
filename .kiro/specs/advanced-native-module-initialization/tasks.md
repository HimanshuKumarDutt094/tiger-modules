# Implementation Plan

- [x] 0. Clean up existing complex initialization system (preparation for maintainer's approach)
- [x] 0.1 Remove complex InitializationConfig and InitializationHook classes from AutolinkConfig.kt

  - Remove InitializationConfig, InitializationHook data classes
  - Remove initialization field from AndroidConfig, IOSConfig, WebConfig
  - Keep only basic configuration structure
  - _Requirements: 2.1, 2.2_

- [x] 0.2 Simplify RegistryGenerator.kt to remove complex initialization logic

  - Remove lifecycle callback registration code generation
  - Remove initialization hook processing
  - Keep only basic module registration (LynxEnv.inst().registerModule)
  - _Requirements: 1.1, 1.3_

- [x] 0.3 Update tiger.config.json parsing to remove initialization fields

  - Remove initialization field parsing from JSON deserialization
  - Ensure backward compatibility for configs without initialization
  - Test that basic module registration still works
  - _Requirements: 2.1, 5.1_

- [x] 1. Implement maintainer's preferred init method approach
- [x] 1.1 Create ClassAnalyzer for automatic init method detection

  - Create ClassAnalyzer.kt to scan module classes for init(Context) methods
  - Detect init method signatures automatically during extension discovery
  - Mark modules with init methods for enhanced initialization
  - _Requirements: 5.1, 5.2, 5.5_

- [x] 1.2 Update NativeModuleConfig to include init method information

  - Add hasInitMethod flag to NativeModuleConfig data class
  - Update JSON parsing to preserve init method detection results
  - Ensure backward compatibility with existing configurations
  - _Requirements: 2.1, 2.2_

- [ ] 2. Demonstrate init method pattern with LynxjsLinkingModule
- [x] 2.1 Refactor LynxjsLinkingModule to use init method

  - Add init(Context) method to LynxjsLinkingModul.kt for lifecycle callback registration
  - Move lifecycle callback logic from separate listener class into the module's init method
  - Remove LynxjsLinkingActivityListener.kt class (no longer needed)
  - _Requirements: 1.1, 1.2, 2.1_

- [ ] 2.2 Test the refactored module

  - Verify that lifecycle callbacks work correctly with the new init method approach
  - Test that deep linking functionality remains unchanged
  - Ensure no regression in existing module functionality
  - _Requirements: 1.1, 1.2, 1.3_

- [ ] 3. Update registry generation for init method support
- [ ] 3.1 Enhance RegistryGenerator to call init methods

  - Modify RegistryGenerator.kt to generate init method calls for modules that have them
  - Add Application context handling and validation
  - Generate error handling and logging for init method calls
  - _Requirements: 1.1, 1.3, 4.1_

- [ ] 3.2 Update ExtensionDiscovery to use ClassAnalyzer

  - Integrate ClassAnalyzer into ExtensionDiscovery during module scanning
  - Update parseExtension method to analyze module classes for init methods
  - Mark modules with init methods in the discovery results
  - _Requirements: 2.1, 2.2, 5.1_

- [ ]\* 3.3 Write unit tests for init method support

  - Test ClassAnalyzer init method detection
  - Test registry generation with init method calls
  - Test integration between ExtensionDiscovery and ClassAnalyzer
  - _Requirements: 1.1, 2.1, 5.1_

- [ ] 4. End-to-end testing and validation
- [ ] 4.1 Test complete workflow with LynxjsLinkingModule

  - Build and test the refactored linking module in the test app
  - Verify that deep linking works correctly with the new approach
  - Test that the generated registry calls the init method properly
  - _Requirements: 1.1, 1.2, 1.3_

- [ ]\* 4.2 Create documentation and examples
  - Document the new init method pattern for module developers
  - Provide before/after examples showing the migration from separate listeners
  - Create guidelines for when to use init methods vs simple modules
  - _Requirements: 2.1, 5.1_

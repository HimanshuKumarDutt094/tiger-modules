# Implementation Plan

- [x] 1. Update configuration interfaces and types

  - Update ElementConfig interface to only require "name" property
  - Remove AndroidViewTypeConfig from element-related types
  - Update CodegenConfig to use simplified element configuration
  - _Requirements: 6.1, 6.4_

- [x] 2. Modify element parsing system

  - [x] 2.1 Update parseElementInterfaces function to handle simplified configuration

    - Remove AndroidViewTypeConfig parsing from element interfaces
    - Ensure ElementInfo only contains name and properties
    - _Requirements: 6.2, 6.5_

  - [x] 2.2 Update orchestrator to use simplified element configuration
    - Modify element processing loop to work with name-only configuration
    - Remove AndroidViewTypeConfig handling from element generation calls
    - _Requirements: 6.1, 6.3_

- [x] 3. Refactor Android element generation

  - [x] 3.1 Modify generateAndroidElement function to create complete classes

    - Remove spec file generation logic
    - Generate complete element class with @LynxElement annotation
    - Use standard View as default base type
    - _Requirements: 1.1, 1.5, 5.3_

  - [x] 3.2 Remove separate spec and implementation generation functions

    - Remove generateKotlinElement and generateJavaElement functions
    - Remove generateKotlinElementImplementation and generateJavaElementImplementation functions
    - Merge logic into single generation function
    - _Requirements: 5.1, 5.4_

  - [x] 3.3 Create unified element class generation
    - Generate complete Kotlin/Java classes with LynxUI<View> base
    - Include @LynxProp annotations directly in main class
    - Add TODO comments for user customization
    - Include helper methods for event emission
    - _Requirements: 1.2, 1.3, 3.1, 3.5_

- [x] 4. Update file generation structure

  - [x] 4.1 Modify directory structure to remove generated/ folders for elements

    - Generate element classes directly in main source directory
    - Remove generated/ subdirectory creation for elements
    - _Requirements: 5.1, 5.3_

  - [x] 4.2 Update import statements in generated classes
    - Remove imports to spec files
    - Add standard imports for View, LynxUI, and annotations
    - _Requirements: 5.2, 5.4_

- [x] 5. Clean up AndroidViewTypeConfig related code

  - [x] 5.1 Remove AndroidViewTypeConfig interface and related functions

    - Remove getAdditionalAndroidImports function
    - Remove validateAndroidViewTypeImports function
    - Remove view-specific instantiation examples
    - _Requirements: 6.4_

  - [x] 5.2 Simplify element generation parameters
    - Remove androidViewType parameter from generation functions
    - Update function signatures to not accept AndroidViewTypeConfig
    - _Requirements: 6.2, 6.3_

- [ ] 6. Update iOS and Web element generation

  - [ ] 6.1 Modify generateIOSElement to remove spec file generation

    - Generate complete Swift element class without separate spec file
    - Use standard UIView as base type
    - _Requirements: 1.1, 5.1_

  - [ ] 6.2 Modify generateWebElement to remove spec file generation
    - Generate complete Web element class without separate spec file
    - Use standard HTMLElement as base type
    - _Requirements: 1.1, 5.1_

- [ ] 7. Update existing test files and examples

  - [ ] 7.1 Update test configurations to use simplified element format

    - Modify test data to only include name property
    - Remove AndroidViewTypeConfig from test cases
    - _Requirements: 6.1_

  - [ ] 7.2 Update example projects to remove spec file dependencies
    - Modify existing element implementations to not extend spec files
    - Add @LynxElement annotations to existing implementations
    - _Requirements: 5.2, 5.4_

- [ ]\* 8. Add comprehensive tests for new generation system
  - Write unit tests for simplified element generation
  - Test property handling with standard View type
  - Validate generated file structure and annotations
  - _Requirements: 1.1, 1.2, 1.3_

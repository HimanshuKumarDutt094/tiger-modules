# Implementation Plan

- [ ] 1. Fix critical TypeScript generation issues
  - Fix missing imports for BaseEvent and CSSProperties in generated TypeScript module augmentation files
  - Eliminate duplicate property generation in IntrinsicElements interface
  - Ensure proper type resolution from source interfaces to generated code
  - Fix web platform code generation to use appropriate DOM types instead of Lynx types
  - _Requirements: 1.4, 2.4, 3.4_

- [x] 1.1 Fix TypeScript module augmentation import issues
  - Update generateTypeScriptModuleAugmentation function to detect and import required types
  - Add import statements for BaseEvent and CSSProperties from @lynx-js/types
  - Ensure all custom types from original interface are properly imported
  - _Requirements: 1.4, 2.4_

- [x] 1.2 Fix duplicate property generation
  - Modify property collection logic to prevent duplicate common properties (className, id, style)
  - Ensure common properties are only added once to IntrinsicElements interface
  - Update ExplorerInputProps interface generation to avoid duplicates
  - _Requirements: 1.4, 3.4_

- [x] 1.3 Fix web platform code generation
  - Update generateWebElement function to use proper DOM types instead of Lynx types
  - Ensure web-generated code doesn't reference BaseEvent or CSSProperties inappropriately
  - Use standard HTMLElement event types for web platform
  - _Requirements: 1.5, 3.4_

- [ ]* 1.4 Add tests for TypeScript generation fixes
  - Write unit tests to verify proper import generation
  - Test duplicate property prevention
  - Verify web platform type correctness
  - _Requirements: 1.4, 2.4, 3.4_

- [x] 2. Implement JSDoc annotation parsing for Android view types
  - Extend TypeScript AST parser to extract JSDoc comments from interface definitions
  - Add support for @androidViewType annotation parsing
  - Create AndroidViewTypeConfig data structure for storing parsed view type information
  - Implement validation for JSDoc annotation format
  - _Requirements: 2.1, 2.2, 2.4_

- [x] 2.1 Create JSDoc parser utilities
  - Implement function to extract JSDoc comments from TypeScript interfaces using ts-morph
  - Add regex patterns to parse @androidViewType annotations
  - Create validation logic for annotation format
  - _Requirements: 2.1, 2.2_

- [x] 2.2 Integrate JSDoc parsing into existing codegen pipeline
  - Modify parser.ts to call JSDoc extraction during interface processing
  - Update ElementInfo interface to include androidViewType field
  - Ensure JSDoc parsing works with existing property extraction
  - _Requirements: 2.1, 2.3_

- [ ] 3. Create Android view type registry and validation
  - Build registry of common Android view types with their full class names and import paths
  - Implement validation logic to check if specified view types exist in registry
  - Add fallback mechanism to use default View type for invalid specifications
  - Create clear error messages for invalid view type specifications
  - _Requirements: 1.3, 2.4, 3.1_

- [x] 3.1 Build Android view type registry
  - Create ANDROID_VIEW_TYPES constant with common view types (View, Button, EditText, AppCompatEditText, etc.)
  - Include full class names, package names, and short names for each type
  - Add utility functions to resolve view types from registry
  - _Requirements: 1.3, 3.1_

- [x] 3.2 Implement view type validation
  - Create validation function to check if specified Android view type exists in registry
  - Add warning system for unknown view types with fallback to View
  - Implement error reporting with clear messages for invalid annotations
  - _Requirements: 1.3, 2.4_

- [x] 4. Update Kotlin codegen to support custom Android view types
  - Modify generateKotlinElement function to use custom view types in LynxUI generic parameter
  - Update import generation to include custom Android view type imports
  - Enhance createView method signature to return specified view type
  - Update implementation template generation to use custom view types
  - _Requirements: 1.1, 3.2, 3.3_

- [x] 4.1 Modify Kotlin base class generation
  - Update LynxUI generic parameter from hardcoded View to custom view type
  - Generate proper import statements for custom Android view types
  - Ensure createView method returns the specified view type
  - _Requirements: 1.1, 3.2_

- [x] 4.2 Update Kotlin implementation template generation
  - Modify implementation template to use custom view type in createView method
  - Add proper view type instantiation in template comments
  - Ensure generated implementation compiles with custom view types
  - _Requirements: 3.2, 3.3_

- [x] 4.3 Add import management for Android view types
  - Implement automatic import generation for custom Android view types
  - Ensure imports are added to both base class and implementation files
  - Handle package resolution for different Android view types
  - _Requirements: 3.1, 3.4_

- [ ] 5. Ensure backward compatibility and comprehensive testing
  - Verify existing elements without @androidViewType annotations continue to work
  - Test complete flow from TypeScript interface with JSDoc to generated Kotlin code
  - Validate that generated code compiles successfully for various Android view types
  - Create integration tests for end-to-end functionality
  - _Requirements: 1.5, 3.5_

- [ ] 5.1 Implement backward compatibility tests
  - Test existing interfaces without JSDoc annotations continue to generate View-based code
  - Verify no breaking changes to existing generated code
  - Ensure API stability for existing functionality
  - _Requirements: 1.5, 3.5_

- [ ] 5.2 Create end-to-end integration tests
  - Test complete codegen flow with AppCompatEditText example
  - Verify generated Kotlin code compiles and imports are correct
  - Test multiple different Android view types (Button, RecyclerView, etc.)
  - _Requirements: 1.1, 3.2, 3.4_

- [ ]* 5.3 Add comprehensive unit tests
  - Test JSDoc parsing with various annotation formats
  - Test view type validation and error handling
  - Test import generation for different Android view types
  - Test TypeScript generation fixes
  - _Requirements: 1.3, 2.4, 3.1_
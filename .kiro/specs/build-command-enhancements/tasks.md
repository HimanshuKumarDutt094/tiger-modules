# Implementation Plan

- [x] 1. Implement generated folder copying functionality

  - Create copyGeneratedFolder function to handle generated TypeScript files
  - Add file listing for transparency when copying generated files
  - Provide informational message when generated folder is missing
  - Ensure proper error handling for copy operations
  - _Requirements: 1.1, 1.2, 1.5_

- [x] 1.1 Create copyGeneratedFolder function

  - Implement function to check for generated folder existence
  - Copy all files from generated/ to dist/generated/ preserving structure
  - Log copied files for build transparency
  - Handle missing generated folder gracefully with informational message
  - _Requirements: 1.1, 1.2_

- [x] 1.2 Integrate generated folder copying into build flow

  - Add copyGeneratedFolder call to main buildModule function
  - Position after platform folder copying but before package.json generation
  - Ensure generated files are available for export map generation
  - _Requirements: 1.1, 1.3_

- [ ] 2. Implement export validation and guidance system

  - Create validateExports function to analyze src/index.ts exports
  - Detect missing exports and provide specific guidance
  - Suggest type-only imports for interface exports
  - Recommend running codegen for missing generated file references
  - _Requirements: 2.1, 2.2, 2.3_

- [ ] 2.1 Create export validation function

  - Parse src/index.ts to extract export statements
  - Check if exported items exist in referenced modules
  - Identify type vs value export mismatches
  - Generate actionable error messages with file and line references
  - _Requirements: 2.1, 2.2_

- [ ] 2.2 Add export guidance system

  - Provide specific suggestions for fixing missing exports
  - Recommend type modifier for interface exports
  - Suggest running codegen when generated files are referenced but missing
  - Include examples in error messages for clarity
  - _Requirements: 2.2, 2.3_

- [ ] 2.3 Integrate export validation into build flow

  - Add validateExports call after tsdown compilation
  - Continue build process even with export warnings
  - Provide summary of export issues in build output
  - _Requirements: 2.4, 2.5_

- [ ] 3. Enhance package.json generation with generated file exports

  - Modify writeDistPackageJson to include generated folder in files array
  - Add generated file exports to package.json exports map
  - Create pattern exports for generated files (./generated/\*)
  - Add specific exports for each generated file
  - _Requirements: 3.1, 3.2, 3.4_

- [ ] 3.1 Update files array generation

  - Add "generated" to baseFiles array when generated folder exists
  - Ensure generated files are included in published package
  - Maintain existing file patterns for backward compatibility
  - _Requirements: 3.3, 3.4_

- [ ] 3.2 Implement generated file export map creation

  - Add "./generated/\*" pattern export for all generated files
  - Create specific exports for each generated TypeScript file
  - Ensure proper TypeScript support in export definitions
  - Handle both .ts and .d.ts generated files appropriately
  - _Requirements: 3.1, 3.2_

- [ ] 3.3 Integrate enhanced exports into package.json writing

  - Modify writeDistPackageJson to call generated export functions
  - Preserve existing exports while adding generated file exports
  - Ensure export map maintains proper TypeScript resolution
  - _Requirements: 3.4, 3.5_

- [ ] 4. Implement comprehensive build summary and guidance

  - Create provideBuildSummary function to report build results
  - List which platform folders were copied and which were skipped
  - Report generated files that were included
  - Provide actionable guidance for missing optional components
  - _Requirements: 4.1, 4.2, 4.4_

- [ ] 4.1 Create build summary function

  - Report platform folder copy status (android, ios, web)
  - List generated files that were copied to dist
  - Calculate and display final package size information
  - Count total files included in distribution package
  - _Requirements: 4.1, 4.2_

- [ ] 4.2 Add guidance for missing components

  - Explain which folders are optional vs required
  - Provide suggestions for creating missing platform implementations
  - Recommend running codegen for missing generated files
  - Include links to documentation where appropriate
  - _Requirements: 4.3, 4.5_

- [ ] 4.3 Integrate build summary into main build flow

  - Add provideBuildSummary call at end of buildModule function
  - Ensure summary reflects actual build results
  - Include export validation results in summary
  - _Requirements: 4.4, 4.5_

- [ ] 5. Ensure backward compatibility and comprehensive testing

  - Test build process with extensions that have no generated folder
  - Verify legacy extensions with module.config.ts continue working
  - Test RFC-compliant extensions with full generated folder structure
  - Validate that existing functionality remains unchanged
  - _Requirements: 5.1, 5.2, 5.3_

- [ ] 5.1 Test backward compatibility scenarios

  - Test building extension without generated folder
  - Test building legacy extension with module.config.ts
  - Verify no breaking changes to existing build outputs
  - Ensure graceful degradation when RFC features unavailable
  - _Requirements: 5.1, 5.3_

- [ ] 5.2 Test RFC-compliant extension building
  - Test complete build flow with rfc-test package
  - Verify generated files are properly copied and exported
  - Test export validation with various export patterns
  - Validate final package structure matches RFC specification
  - _Requirements: 5.2, 5.4_

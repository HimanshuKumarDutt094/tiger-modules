# Design Document

## Overview

This design addresses the build command enhancements needed to fully support the RFC-based autolink extension structure. The current build system successfully handles basic platform folder copying and configuration compilation, but needs improvements for generated TypeScript files integration, export validation, and enhanced package exports.

## Architecture

### Current Build Flow
```
1. Verify autolink extension (tiger.config exists)
2. Run tsdown compilation (TS → JS + .d.ts)
3. Generate global.d.ts for TypeScript bindings
4. Copy platform folders (android, ios, web)
5. Copy/compile tiger.config to JSON
6. Write enhanced package.json with exports
```

### Enhanced Build Flow
```
1. Verify autolink extension (tiger.config exists)
2. Run tsdown compilation (TS → JS + .d.ts)
3. Generate global.d.ts for TypeScript bindings
4. Copy platform folders (android, ios, web)
5. **NEW: Copy generated folder if exists**
6. **NEW: Validate exports and provide guidance**
7. Copy/compile tiger.config to JSON
8. **NEW: Write enhanced package.json with generated file exports**
9. **NEW: Provide comprehensive build summary**
```

## Components and Interfaces

### Enhanced Build Function

```typescript
export default async function buildModule() {
  const moduleDir = process.cwd();
  const distDir = path.join(moduleDir, "dist");

  // Existing steps 1-4 remain unchanged
  
  // NEW: Copy generated folder
  await copyGeneratedFolder(moduleDir, distDir);
  
  // NEW: Validate exports
  await validateExports(moduleDir);
  
  // Enhanced: Write package.json with generated exports
  await writeEnhancedPackageJson(moduleDir, distDir);
  
  // NEW: Provide build summary
  provideBuildSummary(moduleDir, distDir);
}
```

### New Functions

#### copyGeneratedFolder
```typescript
async function copyGeneratedFolder(moduleDir: string, distDir: string): Promise<void> {
  const generatedSrc = path.join(moduleDir, "generated");
  
  if (fs.existsSync(generatedSrc)) {
    const generatedDest = path.join(distDir, "generated");
    await copyDir(generatedSrc, generatedDest);
    console.log("✓ copied generated/ -> dist/generated/");
    
    // List copied files for transparency
    const files = await fs.promises.readdir(generatedSrc);
    files.forEach(file => console.log(`  • ${file}`));
  } else {
    console.log("ℹ️  No generated/ folder found (run 'tiger-module codegen' to create)");
  }
}
```

#### validateExports
```typescript
async function validateExports(moduleDir: string): Promise<void> {
  const indexPath = path.join(moduleDir, "src", "index.ts");
  
  if (!fs.existsSync(indexPath)) {
    console.log("ℹ️  No src/index.ts found, skipping export validation");
    return;
  }
  
  // Parse exports from index.ts and check if they exist
  // Provide specific guidance for missing exports
  // Suggest type-only imports where appropriate
}
```

#### writeEnhancedPackageJson
```typescript
async function writeEnhancedPackageJson(moduleDir: string, distDir: string): Promise<void> {
  // Existing logic +
  
  // Add generated folder to files array if it exists
  if (fs.existsSync(path.join(distDir, "generated"))) {
    baseFiles.push("generated");
  }
  
  // Add generated file exports
  const generatedDir = path.join(distDir, "generated");
  if (fs.existsSync(generatedDir)) {
    const generatedFiles = await fs.promises.readdir(generatedDir);
    
    // Add pattern export for all generated files
    pkg.exports["./generated/*"] = "./generated/*";
    
    // Add specific exports for each generated file
    generatedFiles.forEach(file => {
      const name = path.parse(file).name;
      pkg.exports[`./generated/${name}`] = `./generated/${file}`;
    });
  }
}
```

## Data Models

### Enhanced Package.json Structure
```json
{
  "exports": {
    ".": {
      "types": "./index.d.ts",
      "import": "./index.js",
      "require": "./index.js"
    },
    "./types": {
      "types": "./global.d.ts"
    },
    "./generated/*": "./generated/*",
    "./generated/ModuleName": "./generated/ModuleName.ts",
    "./package.json": "./package.json"
  },
  "files": [
    "android",
    "ios", 
    "web",
    "generated",
    "*.js",
    "*.d.ts",
    "tiger.config.json"
  ]
}
```

### Build Summary Data
```typescript
interface BuildSummary {
  platformsFolders: {
    android: boolean;
    ios: boolean;
    web: boolean;
  };
  generatedFiles: string[];
  exportIssues: string[];
  packageSize: string;
  totalFiles: number;
}
```

## Error Handling

### Export Validation Errors
- **Missing exports**: Provide specific file and line guidance
- **Type vs value exports**: Suggest adding `type` modifier
- **Generated file references**: Recommend running codegen first

### File Copy Errors
- **Permission issues**: Clear error messages with suggested fixes
- **Missing source folders**: Distinguish between required and optional folders
- **Disk space**: Provide helpful guidance for storage issues

## Testing Strategy

### Unit Tests
- Test `copyGeneratedFolder` with various folder structures
- Test `validateExports` with different export patterns
- Test `writeEnhancedPackageJson` export generation

### Integration Tests
- Test complete build flow with RFC-test package
- Test backward compatibility with legacy extensions
- Test build output validation

### End-to-End Tests
- Build and publish test packages
- Verify consumer can import generated files
- Test autolink integration with Gradle plugin

## RFC Compliance

### Generated Folder Structure
Following RFC specification:
```
generated/
├── ModuleName.ts          # TypeScript bindings
├── ElementName.d.ts       # Element type declarations
└── ServiceName.ts         # Service interfaces
```

### Export Pattern Compliance
- Main exports via `./` pattern
- Generated files via `./generated/*` pattern
- Global types via `./types` pattern
- Configuration via `./package.json` pattern

## Backward Compatibility


### Graceful Degradation
- Missing optional folders don't break builds
- Export validation provides warnings, not errors
- Generated file exports only added when files exist

## Performance Considerations

### File Copy Optimization
- Use native `fs.cp` when available
- Parallel copying of platform folders
- Skip unnecessary file operations

### Build Speed
- Only validate exports when issues detected
- Cache file existence checks
- Minimize file system operations

## Integration Points

### Gradle Plugin Compatibility
The enhanced build output must work with the existing Gradle autolink plugin:
- `tiger.config.json` format remains compatible
- Platform folder structure preserved
- Generated registry files accessible

### TypeScript Integration
- Global declarations properly augment NativeModules
- Generated files provide type-safe interfaces
- Export maps enable proper module resolution
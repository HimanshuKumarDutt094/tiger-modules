# Technology Stack

## Build System

- **tsdown**: Primary build tool for TypeScript compilation and bundling
- **TypeScript 5.9+**: Language and type system
- **Bun 1.3.0**: Package manager (specified in packageManager field)

## Core Dependencies

- **ts-morph**: TypeScript AST manipulation for code generation
- **commander**: CLI framework
- **@clack/prompts**: Interactive CLI prompts
- **chalk**: Terminal styling
- **fast-glob**: File pattern matching
- **fs-extra**: Enhanced file system operations

## TypeScript Configuration

- Target: `esnext`
- Module: `preserve` with `bundler` resolution
- Strict mode enabled with `noUnusedLocals`
- Declaration files generated (`emitDeclarationOnly: true`)
- `verbatimModuleSyntax` for explicit imports/exports

## Common Commands

```bash
# Development
 bun run build && bun link             # Build the project with tsdown
npm run dev            # Watch mode for development
npm run typecheck      # Type checking without emit
npm run test           # Run vitest tests

# Module Development (inside generated modules)
npm run codegen        # Generate native platform code
npm run build          # Build module with tsdown
```

## Project Structure Conventions

- Entry points defined in `tsdown.config.ts`
- CLI binaries exported via package.json `bin` field
- ES modules only (`"type": "module"`)
- Multiple entry points: cli, codegen, index, install

## Code Generation

Uses ts-morph to parse TypeScript interfaces and generate:
- Kotlin code for Android (package structure follows androidPackageName)
- Swift code for iOS (placed in ios/modules/)
- TypeScript declarations (global NativeModules interface augmentation)

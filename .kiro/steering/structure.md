# Project Structure

## Root Directory

```
/
├── src/                    # Source code
├── dist/                   # Build output (generated)
├── tests/                  # Test files
├── temp-testing/           # Testing workspace with sample projects
├── .kiro/                  # Kiro configuration and steering
└── templates/              # Module templates (if present)
```

## Source Organization (`src/`)

- **cli.ts**: Main CLI entry point with commander setup
- **codegen.ts**: Code generation logic (TS → Kotlin/Swift)
- **init.ts**: Module scaffolding logic
- **build.ts**: Build command implementation
- **moduleInstaller.ts**: Module installation utilities
- **module.config.ts**: Configuration interface and example
- **util.ts**: Shared utility functions (type conversion, etc.)
- **global.d.ts**: Global type declarations
- **cli/**: CLI-specific subcommands
  - **generate-install.ts**: Installation script generation

## Generated Module Structure

When `lynxjs-module init` creates a new module:

```
<modulename>/
├── src/
│   ├── module.ts          # TypeScript interface definition
│   └── index.ts           # Module entry point
├── android/               # Generated Kotlin code
│   └── src/main/java/...
├── ios/                   # Generated Swift code
│   └── modules/
├── module.config.ts       # Module configuration
├── tsdown.config.ts       # Build configuration
├── tsconfig.json          # TypeScript configuration
└── package.json
```

## Configuration Files

- **module.config.ts**: Defines moduleName, androidPackageName, description, srcFile
- **tsdown.config.ts**: Build entry points and output configuration
- **tsconfig.json**: TypeScript compiler options

## Naming Conventions

- Module names: PascalCase (e.g., `LocalStorage`)
- Package names: lowercase (e.g., `localstorage`)
- Android packages: reverse domain notation (e.g., `com.myapp.modules`)
- Generated files: `<ModuleName>Module.kt`, `<ModuleName>Module.swift`

## Test Structure

- Unit tests in `tests/` directory
- Integration testing workspace in `temp-testing/` with sample apps

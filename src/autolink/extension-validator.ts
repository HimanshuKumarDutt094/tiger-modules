/**
 * Extension package validation system
 * Validates extension structure, platform compatibility, and version requirements
 */

import { pathExistsSync } from "fs-extra/esm";
import { join } from "path";
import type { ExtensionInfo, Platform } from "./discovery.js";

/**
 * Validation severity levels
 */
export enum ValidationSeverity {
  ERROR = "error",
  WARNING = "warning",
  INFO = "info",
}

/**
 * Validation issue
 */
export interface ValidationIssue {
  severity: ValidationSeverity;
  code: string;
  message: string;
  suggestion?: string;
  path?: string;
}

/**
 * Extension validation report
 */
export interface ValidationReport {
  extensionName: string;
  valid: boolean;
  issues: ValidationIssue[];
}

/**
 * Platform compatibility check result
 */
export interface CompatibilityCheck {
  platform: Platform;
  compatible: boolean;
  reason?: string;
}

/**
 * Extension validator
 */
export class ExtensionValidator {
  /**
   * Validates an extension package
   * @param extension - Extension to validate
   * @returns Validation report
   */
  validate(extension: ExtensionInfo): ValidationReport {
    const issues: ValidationIssue[] = [];

    // Validate package structure
    issues.push(...this.validatePackageStructure(extension));

    // Validate platform configurations
    issues.push(...this.validatePlatformConfigurations(extension));

    // Validate version requirements
    issues.push(...this.validateVersionRequirements(extension));

    // Validate source files exist
    issues.push(...this.validateSourceFiles(extension));

    // Check for common issues
    issues.push(...this.checkCommonIssues(extension));

    const hasErrors = issues.some(
      (issue) => issue.severity === ValidationSeverity.ERROR,
    );

    return {
      extensionName: extension.name,
      valid: !hasErrors,
      issues,
    };
  }

  /**
   * Validates package structure
   * @param extension - Extension to validate
   * @returns List of validation issues
   */
  private validatePackageStructure(
    extension: ExtensionInfo,
  ): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    // Check package.json exists
    const packageJsonPath = join(extension.path, "package.json");
    if (!pathExistsSync(packageJsonPath)) {
      issues.push({
        severity: ValidationSeverity.ERROR,
        code: "MISSING_PACKAGE_JSON",
        message: "package.json not found",
        suggestion: "Create a package.json file in the extension root",
        path: packageJsonPath,
      });
    }

    // Check tiger.config.json exists (should always exist if discovered)
    const configPath = join(extension.path, "tiger.config.json");
    if (!pathExistsSync(configPath)) {
      issues.push({
        severity: ValidationSeverity.ERROR,
        code: "MISSING_CONFIG",
        message: "tiger.config.json not found",
        suggestion: "Create a tiger.config.json configuration file",
        path: configPath,
      });
    }

    // Validate name consistency
    if (extension.config.name !== extension.name) {
      issues.push({
        severity: ValidationSeverity.WARNING,
        code: "NAME_MISMATCH",
        message: `Config name (${extension.config.name}) doesn't match package name (${extension.name})`,
        suggestion: "Ensure tiger.config.json name matches package.json name",
      });
    }

    return issues;
  }

  /**
   * Validates platform-specific configurations
   * @param extension - Extension to validate
   * @returns List of validation issues
   */
  private validatePlatformConfigurations(
    extension: ExtensionInfo,
  ): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    // Validate Android configuration
    if (extension.config.platforms.android) {
      const androidIssues = this.validateAndroidPlatform(extension);
      issues.push(...androidIssues);
    }

    // Validate iOS configuration
    if (extension.config.platforms.ios) {
      const iosIssues = this.validateIOSPlatform(extension);
      issues.push(...iosIssues);
    }

    // Validate Web configuration
    if (extension.config.platforms.web) {
      const webIssues = this.validateWebPlatform(extension);
      issues.push(...webIssues);
    }

    // Warn if no platforms configured
    if (extension.platforms.length === 0) {
      issues.push({
        severity: ValidationSeverity.ERROR,
        code: "NO_PLATFORMS",
        message: "No platforms configured",
        suggestion:
          "Add at least one platform configuration (android, ios, or web)",
      });
    }

    return issues;
  }

  /**
   * Validates Android platform configuration
   * @param extension - Extension to validate
   * @returns List of validation issues
   */
  private validateAndroidPlatform(extension: ExtensionInfo): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const androidConfig = extension.config.platforms.android!;

    // Check source directory exists
    const sourceDir = join(
      extension.path,
      androidConfig.sourceDir || "android/src/main",
    );
    if (!pathExistsSync(sourceDir)) {
      issues.push({
        severity: ValidationSeverity.ERROR,
        code: "ANDROID_SOURCE_MISSING",
        message: `Android source directory not found: ${androidConfig.sourceDir}`,
        suggestion: `Create the directory at ${sourceDir} or update sourceDir in tiger.config.json`,
        path: sourceDir,
      });
    }

    // Check for build.gradle.kts
    const buildGradle = join(extension.path, "android", "build.gradle.kts");
    if (!pathExistsSync(buildGradle)) {
      issues.push({
        severity: ValidationSeverity.WARNING,
        code: "ANDROID_BUILD_FILE_MISSING",
        message: "android/build.gradle.kts not found",
        suggestion: "Create a Gradle build file for Android platform",
        path: buildGradle,
      });
    }

    return issues;
  }

  /**
   * Validates iOS platform configuration
   * @param extension - Extension to validate
   * @returns List of validation issues
   */
  private validateIOSPlatform(extension: ExtensionInfo): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const iosConfig = extension.config.platforms.ios!;

    // Check source directory exists
    const sourceDir = join(extension.path, iosConfig.sourceDir || "ios/src");
    if (!pathExistsSync(sourceDir)) {
      issues.push({
        severity: ValidationSeverity.ERROR,
        code: "IOS_SOURCE_MISSING",
        message: `iOS source directory not found: ${iosConfig.sourceDir}`,
        suggestion: `Create the directory at ${sourceDir} or update sourceDir in tiger.config.json`,
        path: sourceDir,
      });
    }

    // Check for podspec if specified
    if (iosConfig.podspecPath) {
      const podspecPath = join(extension.path, iosConfig.podspecPath);
      if (!pathExistsSync(podspecPath)) {
        issues.push({
          severity: ValidationSeverity.WARNING,
          code: "IOS_PODSPEC_MISSING",
          message: `Podspec file not found: ${iosConfig.podspecPath}`,
          suggestion:
            "Create a podspec file or remove podspecPath from configuration",
          path: podspecPath,
        });
      }
    }

    return issues;
  }

  /**
   * Validates Web platform configuration
   * @param extension - Extension to validate
   * @returns List of validation issues
   */
  private validateWebPlatform(extension: ExtensionInfo): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const webConfig = extension.config.platforms.web!;

    // Check entry file exists
    const entryFile = join(
      extension.path,
      webConfig.entry || "web/src/index.ts",
    );
    if (!pathExistsSync(entryFile)) {
      issues.push({
        severity: ValidationSeverity.ERROR,
        code: "WEB_ENTRY_MISSING",
        message: `Web entry file not found: ${webConfig.entry}`,
        suggestion: `Create the entry file at ${entryFile} or update entry in tiger.config.json`,
        path: entryFile,
      });
    }

    return issues;
  }

  /**
   * Validates version requirements
   * @param extension - Extension to validate
   * @returns List of validation issues
   */
  private validateVersionRequirements(
    extension: ExtensionInfo,
  ): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    // Check if lynxVersion is specified
    if (!extension.config.lynxVersion) {
      issues.push({
        severity: ValidationSeverity.INFO,
        code: "NO_LYNX_VERSION",
        message: "No LynxJS version requirement specified",
        suggestion:
          'Add "lynxVersion" field to tiger.config.json (e.g., ">=0.70.0")',
      });
    }

    // Validate version format
    if (extension.config.lynxVersion) {
      if (!this.isValidVersionRange(extension.config.lynxVersion)) {
        issues.push({
          severity: ValidationSeverity.WARNING,
          code: "INVALID_VERSION_RANGE",
          message: `Invalid version range: ${extension.config.lynxVersion}`,
          suggestion: 'Use semver range format (e.g., ">=0.70.0", "^1.0.0")',
        });
      }
    }

    return issues;
  }

  /**
   * Validates that source files exist
   * @param extension - Extension to validate
   * @returns List of validation issues
   */
  private validateSourceFiles(extension: ExtensionInfo): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    // Check if extension declares modules/elements/services but directories don't exist
    const hasDeclarations =
      (extension.config.nativeModules?.length || 0) > 0 ||
      (extension.config.elements?.length || 0) > 0 ||
      (extension.config.services?.length || 0) > 0;

    if (hasDeclarations) {
      for (const platform of extension.platforms) {
        let sourceDir = "";
        switch (platform) {
          case "android":
            sourceDir =
              extension.config.platforms.android?.sourceDir ||
              "android/src/main";
            break;
          case "ios":
            sourceDir = extension.config.platforms.ios?.sourceDir || "ios/src";
            break;
          case "web":
            sourceDir =
              extension.config.platforms.web?.entry || "web/src/index.ts";
            break;
        }

        const fullPath = join(extension.path, sourceDir);
        if (!pathExistsSync(fullPath)) {
          issues.push({
            severity: ValidationSeverity.ERROR,
            code: "SOURCE_FILE_MISSING",
            message: `Source file/directory missing for ${platform}: ${sourceDir}`,
            suggestion: `Create the required source files for ${platform} platform`,
            path: fullPath,
          });
        }
      }
    }

    return issues;
  }

  /**
   * Checks for common issues and best practices
   * @param extension - Extension to validate
   * @returns List of validation issues
   */
  private checkCommonIssues(extension: ExtensionInfo): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    // Check if README exists
    const readmePath = join(extension.path, "README.md");
    if (!pathExistsSync(readmePath)) {
      issues.push({
        severity: ValidationSeverity.INFO,
        code: "NO_README",
        message: "README.md not found",
        suggestion: "Add a README.md file to document your extension",
        path: readmePath,
      });
    }

    // Warn if no modules, elements, or services declared
    const hasExports =
      (extension.config.nativeModules?.length || 0) > 0 ||
      (extension.config.elements?.length || 0) > 0 ||
      (extension.config.services?.length || 0) > 0;

    if (!hasExports) {
      issues.push({
        severity: ValidationSeverity.WARNING,
        code: "NO_EXPORTS",
        message: "No native modules, elements, or services declared",
        suggestion: "Add nativeModules, elements, or services to tiger.config.json",
      });
    }

    return issues;
  }

  /**
   * Checks platform compatibility
   * @param extension - Extension to check
   * @param targetPlatform - Target platform
   * @returns Compatibility check result
   */
  checkPlatformCompatibility(
    extension: ExtensionInfo,
    targetPlatform: Platform,
  ): CompatibilityCheck {
    if (!extension.platforms.includes(targetPlatform)) {
      return {
        platform: targetPlatform,
        compatible: false,
        reason: `Extension does not support ${targetPlatform} platform`,
      };
    }

    return {
      platform: targetPlatform,
      compatible: true,
    };
  }

  /**
   * Generates a detailed validation report with fix suggestions
   * @param extension - Extension to validate
   * @returns Formatted validation report string
   */
  generateReport(extension: ExtensionInfo): string {
    const report = this.validate(extension);
    const lines: string[] = [];

    lines.push(`\nValidation Report: ${report.extensionName}`);
    lines.push(`Status: ${report.valid ? "✓ VALID" : "✗ INVALID"}`);
    lines.push("");

    if (report.issues.length === 0) {
      lines.push("No issues found.");
      return lines.join("\n");
    }

    // Group issues by severity
    const errors = report.issues.filter(
      (i) => i.severity === ValidationSeverity.ERROR,
    );
    const warnings = report.issues.filter(
      (i) => i.severity === ValidationSeverity.WARNING,
    );
    const info = report.issues.filter(
      (i) => i.severity === ValidationSeverity.INFO,
    );

    if (errors.length > 0) {
      lines.push("Errors:");
      for (const issue of errors) {
        lines.push(`  ✗ [${issue.code}] ${issue.message}`);
        if (issue.suggestion) {
          lines.push(`    → ${issue.suggestion}`);
        }
        if (issue.path) {
          lines.push(`    Path: ${issue.path}`);
        }
      }
      lines.push("");
    }

    if (warnings.length > 0) {
      lines.push("Warnings:");
      for (const issue of warnings) {
        lines.push(`  ⚠ [${issue.code}] ${issue.message}`);
        if (issue.suggestion) {
          lines.push(`    → ${issue.suggestion}`);
        }
      }
      lines.push("");
    }

    if (info.length > 0) {
      lines.push("Info:");
      for (const issue of info) {
        lines.push(`  ℹ [${issue.code}] ${issue.message}`);
        if (issue.suggestion) {
          lines.push(`    → ${issue.suggestion}`);
        }
      }
    }

    return lines.join("\n");
  }

  /**
   * Validates version range format
   * @param versionRange - Version range string
   * @returns True if valid
   */
  private isValidVersionRange(versionRange: string): boolean {
    // Basic validation for common semver range patterns
    const patterns = [
      /^\d+\.\d+\.\d+$/, // Exact: 1.0.0
      /^>=\d+\.\d+\.\d+$/, // Greater or equal: >=1.0.0
      /^>\d+\.\d+\.\d+$/, // Greater: >1.0.0
      /^<=\d+\.\d+\.\d+$/, // Less or equal: <=1.0.0
      /^<\d+\.\d+\.\d+$/, // Less: <1.0.0
      /^\^\d+\.\d+\.\d+$/, // Caret: ^1.0.0
      /^~\d+\.\d+\.\d+$/, // Tilde: ~1.0.0
      /^\d+\.x$/, // Wildcard: 1.x
      /^\*$/, // Any: *
    ];

    return patterns.some((pattern) => pattern.test(versionRange));
  }
}

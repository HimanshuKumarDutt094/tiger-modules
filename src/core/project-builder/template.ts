import { cancel, isCancel } from "@clack/prompts";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Find the CLI package root by looking for package.json with name "tiger-module"
function findPackageRoot(startDir: string): string {
  let currentDir = startDir;
  const root = path.parse(currentDir).root;

  while (currentDir !== root) {
    const packageJsonPath = path.join(currentDir, "package.json");
    try {
      if (fs.existsSync(packageJsonPath)) {
        const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
        // Only return if this is the tiger-module package
        if (pkg.name === "tiger-module") {
          return currentDir;
        }
      }
    } catch {
      // Continue searching
    }
    currentDir = path.dirname(currentDir);
  }

  // Fallback: assume templates are in dist folder (for development)
  return path.resolve(__dirname, "..");
}

const packageRoot = findPackageRoot(__dirname);

export type ProjectType = "element" | "module" | "service";

export function checkCancel<T>(value: T | symbol): T {
  if (isCancel(value)) {
    cancel("Operation cancelled");
    process.exit(0);
  }
  return value;
}

export function formatProjectName(projectName: string): {
  packageName: string;
  targetDir: string;
} {
  const packageName = projectName.toLowerCase().replace(/[^a-z0-9-]/g, "-");
  const targetDir = projectName;

  return { packageName, targetDir };
}

export function templatePath(templateName: string): string {
  return path.resolve(packageRoot, "templates", `template-${templateName}`);
}

export function defaultLanguage(platform: string): string {
  switch (platform) {
    case "android":
      return "kotlin";
    case "ios":
      return "swift";
    case "web":
      return "ts";
    default:
      return "ts";
  }
}

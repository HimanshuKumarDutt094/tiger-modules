#!/usr/bin/env node
import { spawnSync } from "child_process";
import fs from "fs";
import path from "path";
import { generateGlobalDts } from "./generate-types";
import { loadConfig } from "./autolink/config-loader.js";

async function copyDir(src: string, dest: string) {
  // Check if source exists
  if (!fs.existsSync(src)) {
    console.log(`source directory ${src} does not exist, skipping copy`);
    return;
  }

  // Check if source is a directory
  const srcStat = await fs.promises.stat(src);
  if (!srcStat.isDirectory()) {
    console.log(`source ${src} is not a directory, skipping copy`);
    return;
  }

  console.log(`copying ${src} -> ${dest}`);

  // prefer fs.cp when available
  // @ts-ignore
  if (fs.cp) {
    await fs.promises.mkdir(dest, { recursive: true });
    // @ts-ignore
    return fs.promises.cp(src, dest, { recursive: true, errorOnExist: false });
  }
  // fallback: simple recursive copy
  const entries = await fs.promises.readdir(src, { withFileTypes: true });
  await fs.promises.mkdir(dest, { recursive: true });
  for (const ent of entries) {
    const srcPath = path.join(src, ent.name);
    const dstPath = path.join(dest, ent.name);
    if (ent.isDirectory()) {
      await copyDir(srcPath, dstPath);
    } else if (ent.isFile()) {
      await fs.promises.copyFile(srcPath, dstPath);
      console.log(`  copied file: ${ent.name}`);
    } else if (ent.isSymbolicLink()) {
      // Handle symlinks by reading and recreating them
      const linkTarget = await fs.promises.readlink(srcPath);
      await fs.promises.symlink(linkTarget, dstPath);
      console.log(`  copied symlink: ${ent.name}`);
    }
  }
}

function runTsdown(cwd: string) {
  console.log("running tsdown in", cwd);
  const res = spawnSync("npx", ["tsdown"], {
    cwd,
    stdio: "inherit",
    shell: true,
  });
  if (res.error || res.status !== 0) {
    throw new Error("tsdown failed");
  }
  console.log("tsdown compilation completed successfully");
}

async function copyAutolinkConfig(moduleDir: string, distDir: string) {
  try {
    const { configFile, configPath } = await loadConfig(moduleDir);

    if (configFile === "lynx.ext.json") {
      // Copy JSON file directly
      const destPath = path.join(distDir, "lynx.ext.json");
      await fs.promises.copyFile(configPath, destPath);
      console.log("✓ copied lynx.ext.json to dist/");
    } else {
      // For TS/JS configs, we need to compile and generate JSON
      const { config } = await loadConfig(moduleDir);
      const destPath = path.join(distDir, "lynx.ext.json");
      await fs.promises.writeFile(destPath, JSON.stringify(config, null, 2));
      console.log(`✓ compiled ${configFile} to dist/lynx.ext.json`);
    }
  } catch (error) {
    throw new Error(
      `Failed to load autolink configuration: ${error instanceof Error ? error.message : error}\n` +
        `This tool only supports autolink extensions. Run 'lynxjs-module init' to create a new extension.`,
    );
  }
}

async function writeDistPackageJson(moduleDir: string, distDir: string) {
  const pkgPath = path.join(moduleDir, "package.json");
  const pkg = JSON.parse(await fs.promises.readFile(pkgPath, "utf8"));

  // Make sure files include what we need for autolink
  const baseFiles = [
    "android",
    "ios",
    "web",
    "*.js",
    "*.d.ts",
    "lynx.ext.json", // Always include JSON in dist for runtime
  ];

  pkg.files = Array.from(new Set([...(pkg.files || []), ...baseFiles]));

  // Set correct paths for main/module/types
  pkg.main = "./index.js";
  pkg.module = "./index.js";
  pkg.types = "./index.d.ts";

  // Ensure proper exports map
  pkg.exports = pkg.exports || {};

  // Main entry point
  pkg.exports["."] = {
    types: "./index.d.ts",
    import: "./index.js",
    require: "./index.js",
  };

  // Global types export (for TypeScript bindings)
  pkg.exports["./types"] = {
    types: "./global.d.ts",
  };

  // Keep package.json export
  pkg.exports["./package.json"] = "./package.json";

  const outPkg = path.join(distDir, "package.json");
  await fs.promises.writeFile(
    outPkg,
    JSON.stringify(pkg, null, 2) + "\n",
    "utf8",
  );
  console.log("✓ wrote", outPkg);
  console.log("  type: autolink extension");
  console.log("  main:", pkg.main);
  console.log("  types:", pkg.types);
  console.log("  files:", pkg.files.join(", "));
}

export default async function buildModule() {
  const moduleDir = process.cwd();
  const distDir = path.join(moduleDir, "dist");

  console.log("\n🔨 Building LynxJS autolink extension");
  console.log("   Module directory:", moduleDir);
  console.log("   Output directory:", distDir);
  console.log();

  // 1. Verify this is an autolink extension
  try {
    await loadConfig(moduleDir);
  } catch (error) {
    throw new Error(
      `No autolink configuration found. This tool only supports autolink extensions.\n` +
        `Run 'lynxjs-module init' to create a new extension.\n` +
        `Error: ${error instanceof Error ? error.message : error}`,
    );
  }

  // 2. Run tsdown to compile TS -> dist (this clears dist first)
  runTsdown(moduleDir);

  // 3. Generate global.d.ts from TigerModule interface (for TypeScript bindings)
  try {
    await generateGlobalDts(path.join(distDir, "global.d.ts"));
    console.log("✓ generated global.d.ts for TypeScript bindings");
  } catch (err) {
    console.warn(
      "⚠️  global.d.ts generation failed:",
      err instanceof Error ? err.message : err,
    );
    console.warn("   TypeScript bindings will not be available");
  }

  // 4. Copy android directory to dist
  const androidSrc = path.join(moduleDir, "android");
  if (fs.existsSync(androidSrc)) {
    try {
      await copyDir(androidSrc, path.join(distDir, "android"));
      console.log("✓ copied android/ -> dist/android/");
    } catch (err) {
      console.warn(
        "⚠️  android copy failed:",
        err instanceof Error ? err.message : err,
      );
    }
  } else {
    console.warn("⚠️  android/ directory not found");
  }

  // 5. Copy ios directory to dist
  const iosSrc = path.join(moduleDir, "ios");
  if (fs.existsSync(iosSrc)) {
    try {
      await copyDir(iosSrc, path.join(distDir, "ios"));
      console.log("✓ copied ios/ -> dist/ios/");
    } catch (err) {
      console.warn(
        "⚠️  ios copy failed:",
        err instanceof Error ? err.message : err,
      );
    }
  } else {
    console.warn("⚠️  ios/ directory not found");
  }

  // 6. Copy web directory to dist (if exists)
  const webSrc = path.join(moduleDir, "web");
  if (fs.existsSync(webSrc)) {
    try {
      await copyDir(webSrc, path.join(distDir, "web"));
      console.log("✓ copied web/ -> dist/web/");
    } catch (err) {
      console.warn(
        "⚠️  web copy failed:",
        err instanceof Error ? err.message : err,
      );
    }
  }

  // 7. Copy/compile config to dist/lynx.ext.json (required for autolink)
  await copyAutolinkConfig(moduleDir, distDir);

  // 8. Write dist/package.json with proper exports
  await writeDistPackageJson(moduleDir, distDir);

  console.log();
  console.log("✅ Build complete!");
  console.log();
  console.log("📦 Your extension is ready to publish:");
  console.log("   1. Test locally: npm link");
  console.log("   2. Publish: npm publish");
  console.log();
  console.log(
    "🔗 Extensions using autolink will auto-integrate via Gradle/CocoaPods plugins",
  );
}

// ES module safe entry check. In ESM `require` and `module` are undefined,
// so compare the resolved entry script path with this module's path.
if (typeof process !== "undefined") {
  try {
    const entry =
      process.argv && process.argv[1] ? path.resolve(process.argv[1]) : null;
    const here = path.resolve(new URL(import.meta.url).pathname);
    if (entry && entry === here) {
      buildModule().catch((err) => {
        console.error(err);
        process.exit(1);
      });
    }
  } catch (e) {
    // fallback: attempt to run
    // (if import.meta is not supported for some reason)
    // no-op
  }
}

import fs from "fs";
import path from "path";
import fg from "fast-glob";

type ModuleConfig = {
  moduleName: string;
  androidPackageName?: string;
  description?: string;
  moduleFile?: string;
};

async function fileExists(p: string) {
  try {
    await fs.promises.access(p);
    return true;
  } catch {
    return false;
  }
}

function findHostRoot(moduleDir: string) {
  const parts = moduleDir.split(path.sep);
  const idx = parts.lastIndexOf("node_modules");
  if (idx > 0) return parts.slice(0, idx).join(path.sep) || path.sep;
  return path.resolve(moduleDir, "..", "..");
}

async function readModuleConfig(
  moduleDir: string
): Promise<ModuleConfig | null> {
  // Priority order: config.js in current dir (if already in dist), dist/config.js, module.config.js, then package.json
  const tryFiles = [
    { path: path.join(moduleDir, "config.js"), type: "config.js" },
    { path: path.join(moduleDir, "dist", "config.js"), type: "dist/config.js" },
    { path: path.join(moduleDir, "module.config.js"), type: "module.config.js" },
  ];
  
  console.log("moduleInstaller: attempting to load module config...");
  
  // Try loading compiled config files using dynamic import
  for (const { path: filePath, type } of tryFiles) {
    if (await fileExists(filePath)) {
      console.log(`moduleInstaller: attempting to load ${type} from ${filePath}`);
      try {
        // Use dynamic import for ES modules
        const fileUrl = `file://${filePath.replace(/\\/g, "/")}`;
        const imported = await import(fileUrl);
        const config = imported.config || imported.default;
        
        if (config && config.moduleName) {
          console.log(`moduleInstaller: successfully loaded config from ${type}`);
          console.log(`moduleInstaller: moduleName="${config.moduleName}", androidPackageName="${config.androidPackageName || 'not specified'}"`);
          return {
            moduleName: config.moduleName,
            androidPackageName: config.androidPackageName,
            description: config.description,
            moduleFile: config.moduleFile,
          };
        } else {
          console.warn(`moduleInstaller: ${type} exists but does not export valid config`);
        }
      } catch (err) {
        console.warn(`moduleInstaller: failed to import ${type}:`, err instanceof Error ? err.message : String(err));
      }
    } else {
      console.log(`moduleInstaller: ${type} not found at ${filePath}`);
    }
  }
  
  // Fallback to package.json
  console.warn("moduleInstaller: no module config files found, falling back to package.json");
  const pkgJson = path.join(moduleDir, "package.json");
  if (await fileExists(pkgJson)) {
    console.log(`moduleInstaller: attempting to load from package.json at ${pkgJson}`);
    try {
      const pkg = JSON.parse(await fs.promises.readFile(pkgJson, "utf8"));
      const moduleName = pkg.name || "UnnamedModule";
      console.warn(`moduleInstaller: using package.json fallback, moduleName="${moduleName}"`);
      console.warn("moduleInstaller: androidPackageName not available from package.json");
      return { moduleName };
    } catch (err) {
      console.error(`moduleInstaller: failed to read package.json:`, err instanceof Error ? err.message : String(err));
    }
  } else {
    console.error(`moduleInstaller: package.json not found at ${pkgJson}`);
  }
  
  console.error("moduleInstaller: could not load module config from any source");
  return null;
}

async function copyFileIfDifferent(src: string, dst: string) {
  await fs.promises.mkdir(path.dirname(dst), { recursive: true });
  if (await fileExists(dst)) {
    const [a, b] = await Promise.all([
      fs.promises.readFile(src),
      fs.promises.readFile(dst),
    ]);
    if (a.equals(b)) return false;
  }
  await fs.promises.copyFile(src, dst);
  return true;
}

async function copyAndroidSources(
  moduleDir: string,
  hostRoot: string,
  androidPackageName?: string
) {
  if (!androidPackageName) return;
  const packagePath = androidPackageName.split(".").join("/");
  const searchRoot = moduleDir.replace(/\\/g, "/");
  // Check if we're already in dist folder to avoid dist/dist pattern
  const isInDist = searchRoot.endsWith("/dist");
  const patterns = isInDist
    ? [
        `${searchRoot}/android/**/src/**/java/**/${packagePath}/**/*.{kt,java}`,
        `${searchRoot}/android/**/java/**/${packagePath}/**/*.{kt,java}`,
      ]
    : [
        `${searchRoot}/android/**/src/**/java/**/${packagePath}/**/*.{kt,java}`,
        `${searchRoot}/dist/android/**/src/**/java/**/${packagePath}/**/*.{kt,java}`,
        `${searchRoot}/android/**/java/**/${packagePath}/**/*.{kt,java}`,
      ];
  // use absolute paths for clarity and reliable substring operations
  const found = await fg(patterns, {
    dot: true,
    onlyFiles: true,
    unique: true,
    absolute: true,
  });
  console.log("module android source search patterns:", patterns);
  console.log("found android source files:", found.length);
  if (found.length === 0) return;
  const hostRoots = await fg(
    ["**/android/**/src/**/main/**/java", "**/android/**/src/**/java"],
    { cwd: hostRoot, onlyDirectories: true, unique: true, absolute: true }
  );
  console.log("host android java roots found:", hostRoots.length);
  if (hostRoots.length === 0) return;

  for (const hostRootRel of hostRoots) {
    const hostJavaRoot = hostRootRel; // already absolute
    console.log("using host java root:", hostJavaRoot);
    for (const s of found) {
      // determine path under the packagePath
      const idx = s.indexOf(packagePath);
      const fileRel =
        idx >= 0 ? s.substring(idx + packagePath.length + 1) : path.basename(s);
      const dst = path.join(
        hostJavaRoot,
        packagePath,
        fileRel || path.basename(s)
      );
      const changed = await copyFileIfDifferent(s, dst);
      if (changed) console.log("copied", s, "->", dst);
    }
  }
}

async function patchAndroidRegistration(
  hostRoot: string,
  moduleCfg: ModuleConfig
) {
  const moduleName = moduleCfg.moduleName;
  const pkg = moduleCfg.androidPackageName;
  if (!moduleName) return;
  const className = `${moduleName}Module`;

  const files = await fg(["**/*.{kt,java}"], {
    cwd: hostRoot,
    absolute: true,
    ignore: ["**/node_modules/**"],
  });
  console.log(
    "scanning host files for LynxEnv.inst(), total candidate files:",
    files.length
  );
  for (const f of files) {
    const content = await fs.promises.readFile(f, "utf8");
    if (!content.includes("LynxEnv.inst()")) continue;
    console.log("found LynxEnv.inst() in", f);
    let newContent = content;
    const isKotlin = f.endsWith(".kt");
    const regLine = isKotlin
      ? `LynxEnv.inst().registerModule("${moduleName}Module", ${className}::class.java);`
      : `LynxEnv.inst().registerModule("${moduleName}Module", ${className}.class.java);`;

    if (pkg) {
      const importK = isKotlin
        ? `import ${pkg}.${className}`
        : `import ${pkg}.${className};`;
      if (!newContent.includes(importK)) {
        console.log("adding import", importK, "to", f);
        newContent = newContent.replace(
          /(package\s+[\w\.]+\s*)/,
          `$1\n${importK}\n`
        );
      }
    }

    if (!newContent.includes(regLine)) {
      console.log("inserting registration line into", f, "=>", regLine);
      newContent = newContent.replace(
        /(LynxEnv\.inst\([\s\S]*?\)\s*\n)/,
        `$1    ${regLine}\n`
      );
      await fs.promises.writeFile(f, newContent, "utf8");
      console.log("patched", f, "to register", className);
    } else {
      console.log("registration already present in", f);
    }
  }
}

async function copyIOSSources(
  moduleDir: string,
  hostRoot: string,
  moduleName: string
) {
  if (!moduleName) return;
  
  const searchRoot = moduleDir.replace(/\\/g, "/");
  // Check if we're already in dist folder to avoid dist/dist pattern
  const isInDist = searchRoot.endsWith("/dist");
  const patterns = isInDist
    ? [
        `${searchRoot}/ios/modules/**/*.{swift,m,h}`,
      ]
    : [
        `${searchRoot}/ios/modules/**/*.{swift,m,h}`,
        `${searchRoot}/dist/ios/modules/**/*.{swift,m,h}`,
      ];
  
  const found = await fg(patterns, {
    dot: true,
    onlyFiles: true,
    unique: true,
    absolute: true,
  });
  
  console.log("module iOS source search patterns:", patterns);
  console.log("found iOS source files:", found.length);
  
  if (found.length === 0) return;
  
  // Find host iOS/apple directories
  const hostIOSRoots = await fg(
    ["**/ios/**", "**/apple/**"],
    {
      cwd: hostRoot,
      onlyDirectories: true,
      unique: true,
      absolute: true,
      ignore: ["**/node_modules/**"],
    }
  );
  
  console.log("host iOS roots found:", hostIOSRoots.length);
  if (hostIOSRoots.length === 0) return;
  
  // Copy to first matching iOS root's modules directory
  const hostIOSRoot = hostIOSRoots[0];
  const modulesDir = path.join(hostIOSRoot, "modules");
  
  console.log("using host iOS root:", hostIOSRoot);
  console.log("target modules directory:", modulesDir);
  
  for (const srcFile of found) {
    const fileName = path.basename(srcFile);
    const dstFile = path.join(modulesDir, fileName);
    const changed = await copyFileIfDifferent(srcFile, dstFile);
    if (changed) console.log("copied", srcFile, "->", dstFile);
  }
}

async function patchBridgingHeader(hostRoot: string, moduleCfg: ModuleConfig) {
  const moduleName = moduleCfg.moduleName;
  if (!moduleName) return;
  const patterns = ["**/*-Bridging-Header.h", "**/Bridging-Header.h"];
  const headers = await fg(patterns, {
    cwd: hostRoot,
    absolute: true,
    ignore: ["**/node_modules/**"],
  });
  for (const h of headers) {
    let content = await fs.promises.readFile(h, "utf8");
    if (!content.includes("#import <Lynx/LynxModule.h>")) {
      content = `#import <Lynx/LynxModule.h>\n` + content;
    }
    const modHeader = `#import \"${moduleName}Module.h\"`;
    if (!content.includes(modHeader))
      content = content + "\n" + modHeader + "\n";
    await fs.promises.writeFile(h, content, "utf8");
    console.log("patched bridging header", h);
  }
}

async function patchSwiftRegister(hostRoot: string, moduleCfg: ModuleConfig) {
  const moduleName = moduleCfg.moduleName;
  if (!moduleName) return;
  const swiftFiles = await fg(["**/*.swift"], {
    cwd: hostRoot,
    absolute: true,
    ignore: ["**/node_modules/**"],
  });
  for (const s of swiftFiles) {
    let content = await fs.promises.readFile(s, "utf8");
    if (content.includes("// config.register(YourModuleName.self)")) {
      const reg = `config.register(${moduleName}Module.self)`;
      const newContent = content.replace(
        "// config.register(YourModuleName.self)",
        reg
      );
      await fs.promises.writeFile(s, newContent, "utf8");
      console.log("patched swift file", s, "to register", moduleName);
    }
  }
}

export default async function install(opts: { moduleDir?: string } = {}) {
  const moduleDir = opts.moduleDir
    ? path.resolve(opts.moduleDir)
    : path.resolve(__dirname, "..");
  const hostRoot = findHostRoot(moduleDir);
  console.log("=== lynx module installer ===");
  console.log("moduleDir=", moduleDir);
  console.log("hostRoot=", hostRoot);
  const cfg = await readModuleConfig(moduleDir);
  if (!cfg) {
    console.warn("could not read module config; aborting installer");
    return;
  }
  console.log("module config:", cfg);
  if (!cfg.androidPackageName)
    console.warn("androidPackageName not found in module config");

  // Android integration
  await copyAndroidSources(moduleDir, hostRoot, cfg.androidPackageName);
  await patchAndroidRegistration(hostRoot, cfg);
  
  // iOS integration
  console.log("=== Starting iOS integration ===");
  try {
    await copyIOSSources(moduleDir, hostRoot, cfg.moduleName);
    console.log("iOS source files copied successfully");
  } catch (err) {
    console.error("iOS source file copying failed:", err);
    console.log("Continuing with iOS registration patching...");
  }
  
  try {
    await patchBridgingHeader(hostRoot, cfg);
    await patchSwiftRegister(hostRoot, cfg);
    console.log("iOS registration patching completed");
  } catch (err) {
    console.error("iOS registration patching failed:", err);
    console.log("Manual iOS integration may be required");
  }
}

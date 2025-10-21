#!/usr/bin/env node
import fs from "fs";
import path from "path";

async function fileExists(p: string) {
  try {
    await fs.promises.access(p);
    return true;
  } catch {
    return false;
  }
}

async function ensureDistInstall(moduleDir: string) {
  const distDir = path.join(moduleDir, "dist");
  await fs.promises.mkdir(distDir, { recursive: true });
  const out = path.join(distDir, "install.js");
  const content = `import install from 'lynxjs-module/install';
import path from 'path';

const moduleDir = process.cwd();

install({ moduleDir }).catch((err) => {
  console.error('lynx module installer failed:', err);
  process.exit(1);
});
`;
  await fs.promises.writeFile(out, content, "utf8");
  console.log("wrote", out);
}

async function patchPackageJson(moduleDir: string) {
  const pkgPath = path.join(moduleDir, "package.json");
  if (!(await fileExists(pkgPath))) {
    throw new Error("package.json not found in " + moduleDir);
  }
  const pkg = JSON.parse(await fs.promises.readFile(pkgPath, "utf8"));

  pkg.files = Array.from(
    new Set([...(pkg.files || []), "dist", "android", "ios"])
  );

  pkg.scripts = pkg.scripts || {};
  if (
    !pkg.scripts.postinstall ||
    pkg.scripts.postinstall.indexOf("dist/install.js") === -1
  ) {
    pkg.scripts.postinstall = "node ./dist/install.js";
    console.log("added postinstall to package.json");
  }

  await fs.promises.writeFile(
    pkgPath,
    JSON.stringify(pkg, null, 2) + "\n",
    "utf8"
  );
  console.log("patched package.json in", moduleDir);
}

async function main() {
  const moduleDir = process.argv[2]
    ? path.resolve(process.argv[2])
    : process.cwd();
  await ensureDistInstall(moduleDir);
  await patchPackageJson(moduleDir);
}

// ESM-safe entry check
try {
  const entry =
    process.argv && process.argv[1] ? path.resolve(process.argv[1]) : null;
  const here = path.resolve(new URL(import.meta.url).pathname);
  if (entry && entry === here) {
    main().catch((err) => {
      console.error(err);
      process.exit(1);
    });
  }
} catch {}

export default main;

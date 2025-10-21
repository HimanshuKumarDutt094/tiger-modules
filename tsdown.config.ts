import { defineConfig } from "tsdown/config";

export default defineConfig({
  entry: {
    cli: "./src/cli.ts",
    codegen: "./src/codegen.ts",
    index: "./src/index.ts",
    install: "./src/moduleInstaller.ts",
  },
  outDir: "dist",
  platform: "node",
  format: ["esm"],
  shims: true,
  dts: true,
  exports: true,
});

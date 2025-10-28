import { defineConfig } from "tsdown/config";

export default defineConfig({
  entry: {
    cli: "./src/cli.ts",
    codegen: "./src/commands/codegen.ts",
    index: "./src/index.ts",
    runtime: "./src/core/runtime.ts",
    config: "./src/autolink/config.ts",
    "config-loader": "./src/autolink/config-loader.ts",
    plugin:"./src/autolink/plugins/index.ts",
  },
  outDir: "dist",
  platform: "node",
  format: ["esm"],
  shims: true,
  dts: true,
  exports: true,
});

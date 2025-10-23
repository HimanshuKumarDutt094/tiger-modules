import { defineConfig } from "tsdown";

export default defineConfig([
  {
    entry: {
      index: "./src/index.ts",
    },
    platform: "browser",
    dts: true,
  },
]);

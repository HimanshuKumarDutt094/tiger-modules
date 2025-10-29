import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { pluginWebPlatform } from '@lynx-js/web-platform-rsbuild-plugin';
export default defineConfig({
  plugins: [pluginReact(),pluginWebPlatform({
    nativeModulesPath:path.join(
      __dirname,
      '../',
      'node_modules',
      'module-element-testing',
      'web','src','index.ts'
    ),
  })],
  server: {
    publicDir: [
      {
        name: path.join(
          __dirname,
          '../',
          // Please replace this with your actual Lynx project name
          'dist',
        ),
      },
    ],
  },
});
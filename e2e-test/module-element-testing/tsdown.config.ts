import { defineConfig } from 'tsdown'

export default defineConfig([
  {
    entry: {
      index: './src/index.ts',
    },
    platform: 'neutral',
    dts: true,
  },
  {
    entry: {
      web: './web/src/index.ts',
    },
    platform: 'browser',
    dts: true,
    outDir: './dist/web',
  },
])

import { nodeExternals } from 'rollup-plugin-node-externals'
import { defineConfig } from 'vite'

export default defineConfig(({ mode }) => ({
  plugins: [nodeExternals()],
  ssr: {
    // bundle and treeshake everything
    noExternal: true,
  },
  build: {
    ssr: true,
    lib: {
      entry: ['src/bin/cli.ts'],
      formats: ['cjs'],
    },
    target: 'node20',
    outDir: 'build',
    sourcemap: true,
    minify: mode === 'production' && 'esbuild',
  },
}))

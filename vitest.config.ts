// @ts-ignore
import path from 'path'
import tsPath from 'vite-tsconfig-paths'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    include: ['tests/**/*.(spec|test).ts'],
  },
  plugins: [tsPath()],
  resolve: {
    alias: {
      '~': path.resolve(__dirname, 'src'),
    },
  },
  define: {
    __DEV__: false,
  },
})

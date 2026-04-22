import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

const frontendSrc = resolve(__dirname, '../../../frontend/React/src')

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@src': frontendSrc,
    },
    dedupe: ['react', 'react-dom', '@emotion/react', '@emotion/styled'],
  },
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: './setup.ts',
    include: ['./**/*.test.{ts,tsx}'],
    server: {
      deps: {
        inline: [/@mui\//, /@emotion\//],
      },
    },
  },
})

/// <reference types="vitest" />
import angular from '@analogjs/vite-plugin-angular'
import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

const frontendSrc = resolve(__dirname, '../../../frontend/Angular/src')

export default defineConfig(({ mode }) => ({
  plugins: [angular()],
  resolve: {
    alias: {
      '@src': frontendSrc,
    },
    dedupe: [
      '@angular/core',
      '@angular/common',
      '@angular/compiler',
      '@angular/platform-browser',
      '@angular/platform-browser-dynamic',
      '@angular/animations',
      'rxjs',
      'zone.js',
      'tslib',
    ],
  },
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./setup.ts'],
    include: ['./**/*.spec.ts'],
  },
  define: {
    'import.meta.vitest': mode !== 'production',
  },
}))

import { defineConfig, devices } from '@playwright/test'
import { resolve } from 'node:path'

const repoRoot = resolve(__dirname, '../../..')

/**
 * Integration/E2E tests against the real running stack.
 *
 * - Boots the FastAPI backend on :5000 (uvicorn) and the Angular dev server
 *   on :4200 automatically if they are not already running.
 * - `reuseExistingServer: true` means if you've started them manually (e.g.
 *   via the `Command: run` from ANALYSIS.md) these tests attach to the
 *   existing processes instead of spawning duplicates.
 */
export default defineConfig({
  testDir: './specs',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],

  use: {
    baseURL: 'http://127.0.0.1:4200',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: [
    {
      command:
        `"${resolve(repoRoot, '.venv/Scripts/python.exe')}" -m uvicorn app.main:app --host 127.0.0.1 --port 5000`,
      cwd: resolve(repoRoot, 'backend/Python'),
      url: 'http://127.0.0.1:5000/health',
      reuseExistingServer: true,
      timeout: 60_000,
      stdout: 'pipe',
      stderr: 'pipe',
    },
    {
      command: 'npx --no-install ng serve --host 127.0.0.1 --port 4200',
      cwd: resolve(repoRoot, 'frontend/Angular'),
      url: 'http://127.0.0.1:4200',
      reuseExistingServer: true,
      timeout: 180_000,
      stdout: 'pipe',
      stderr: 'pipe',
    },
  ],
})

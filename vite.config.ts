import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// In production (GitHub Pages), set VITE_BASE_URL to '/repo-name/'
// In development, leave it unset to use '/'
const base = process.env.VITE_BASE_URL ?? '/'

export default defineConfig({
  base,
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
})

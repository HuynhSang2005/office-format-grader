import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react-swc'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.ts'],
    globals: true,
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    // Add this to ensure the environment is properly set up
    environmentOptions: {
      jsdom: {
        url: 'http://localhost',
        pretendToBeVisual: true,
        resources: 'usable'
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
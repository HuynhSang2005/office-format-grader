import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/tests/**/*.test.ts'],
    exclude: ['node_modules', 'dist'],
    testTimeout: 10000,
    setupFiles: [],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: [
        'src/extractors/**/*.ts',
        'src/rule-engine/**/*.ts',
        'src/services/**/*.ts',
        'src/controllers/**/*.ts'
      ],
      exclude: [
        'src/tests/**',
        'src/types/**',
        'src/schemas/**',
        '**/*.d.ts'
      ]
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@core': resolve(__dirname, './src/core'),
      '@services': resolve(__dirname, './src/services'),
      '@config': resolve(__dirname, './src/config'),
      '@schemas': resolve(__dirname, './src/schemas'),
      '@types': resolve(__dirname, './src/types'),
      '@utils': resolve(__dirname, './src/utils'),
      '@controllers': resolve(__dirname, './src/controllers'),
      '@routes': resolve(__dirname, './src/routes'),
      '@middlewares': resolve(__dirname, './src/middlewares'),
      '@prisma': resolve(__dirname, './src/prisma')
    }
  }
});
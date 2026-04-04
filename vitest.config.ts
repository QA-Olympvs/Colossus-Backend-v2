import { defineConfig } from 'vitest/config';
import swc from 'unplugin-swc';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'dist/',
        'test/',
        '**/*.dto.ts',
        '**/*.entity.ts',
      ],
    },
  },
  plugins: [swc.vite()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});

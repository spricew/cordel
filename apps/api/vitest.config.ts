import { defineConfig } from 'vitest/config';
import { tscTransform } from './vite.plugin-tsc.js';

export default defineConfig({
  test: {
    globals: true,
    include: ['src/**/*.spec.ts'],
    root: './',
  },
  plugins: [tscTransform()],
});
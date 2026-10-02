import { defineConfig } from 'vitest/config';
import { tscTransform } from './vite.plugin-tsc.js';

export default defineConfig({
  test: {
    globals: true,
    include: ['test/**/*.e2e-spec.ts'],
    root: './',
  },
  plugins: [tscTransform()],
});
import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    cache: false,
    clearMocks: true,
    deps: {
      interopDefault: false,
    },
    coverage: {
      exclude: [...configDefaults.exclude, '**/interfaces.ts', '**/examples/**', '*.mjs'],
    },
    watch: false,
  },
});

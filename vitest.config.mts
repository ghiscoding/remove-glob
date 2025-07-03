import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    cache: false,
    clearMocks: true,
    environment: 'node',
    deps: {
      interopDefault: false,
    },
    coverage: {
      exclude: [...configDefaults.exclude, '**/interfaces.ts', '**/scripts/**', '*.mjs'],
    },
    watch: false,
  },
});

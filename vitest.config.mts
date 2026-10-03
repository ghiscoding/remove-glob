import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    cache: false,
    clearMocks: true,
    environment: 'node',
    include: ['src/**/*.spec.ts'],
    deps: {
      interopDefault: false,
    },
    coverage: {
      exclude: [...configDefaults.exclude, '**/interfaces.ts', '**/scripts/**', '*.mjs'],
    },
    watch: false,
  },
});

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/setupVitest.ts'],
    include: ['src/services/__tests__/**/*.test.ts'],
    globals: true,
    clearMocks: true,
  },
});
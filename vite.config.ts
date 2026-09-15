import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE_PATH ?? '/',
  build: { target: 'es2022', sourcemap: true },
  test: { exclude: ['tests/e2e/**', 'node_modules/**'] },
});

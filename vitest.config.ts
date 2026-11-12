import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  // Tests must never hit the network: force mock mode even if .env.local sets NEXT_PUBLIC_API_URL.
  test: { environment: 'jsdom', globals: true, env: { NEXT_PUBLIC_API_URL: '' } },
});

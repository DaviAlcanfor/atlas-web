import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Tests must never hit the network: force mock mode even if .env.local sets VITE_API_URL.
  test: { environment: 'jsdom', globals: true, env: { VITE_API_URL: '' } },
});

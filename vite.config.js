import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// On a production build we serve from a GitHub Pages project subpath
// (https://<user>.github.io/craps-simulator/), so assets need that base.
// The dev server keeps base '/' so `npm run dev` works normally.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/craps-simulator/' : '/',
  plugins: [react()],
  test: {
    environment: 'node',
  },
}));

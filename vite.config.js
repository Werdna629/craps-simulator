import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// On a production build we use a relative base ('./') so the same bundle works
// at any path: the root Pages site (/craps-simulator/) and per-PR preview
// subpaths (/craps-simulator/pr-preview/pr-N/). The dev server stays at '/'.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? './' : '/',
  plugins: [react()],
  test: {
    environment: 'node',
  },
}));

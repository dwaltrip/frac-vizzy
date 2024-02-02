import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { UserConfig } from 'vitest/config';

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    // setup absolute imports
    alias: [{ find: '@', replacement: '/src' }],
   },
  plugins: [react()],
});

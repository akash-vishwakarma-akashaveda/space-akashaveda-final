import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Build output, archives and design source files aren't part of the app; watching them can crash the dev server
  // (a zip being written is locked on Windows).
  server: { watch: { ignored: ['**/dist/**', '**/*.zip', '**/design/**'] } },
  build: {
    target: 'es2020',
    // three.js (~600 kB with the meshopt decoder) is only pulled in by the dynamically imported scene modules.
    chunkSizeWarningLimit: 650,
    rollupOptions: {
      output: { manualChunks: (id) => (id.includes('node_modules/three/') ? 'three' : undefined) },
    },
  },
});

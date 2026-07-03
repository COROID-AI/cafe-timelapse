import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    // Use the runner-provided PORT if available, otherwise default to 5173.
    // This allows the dev server smoke check to probe the correct port.
    port: process.env.PORT ? Number(process.env.PORT) : 5173,
    open: false,
  },
  build: {
    target: 'es2022',
    outDir: 'dist',
  },
});

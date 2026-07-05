import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';

// Honour the runner-provided PORT when present (dev + preview), falling back
// to Vite's conventional 5173 for local development.
const port = process.env.PORT ? Number(process.env.PORT) : 5173;

export default defineConfig({
  // The HTML entry point lives under public/, so public/ is the Vite root.
  root: 'public',

  // The public/ directory *is* the root, so Vite's implicit publicDir must be
  // disabled to avoid a recursive public/public lookup.
  publicDir: false,

  resolve: {
    alias: {
      // Source modules (e.g. src/contracts/PeriodPackage.js) live outside the
      // public root but are resolvable via the @ alias.
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },

  server: {
    host: '127.0.0.1',
    port,
    strictPort: false,
    // Allow imports from the repository root (src/ sits outside public/).
    fs: {
      allow: [fileURLToPath(new URL('.', import.meta.url))],
    },
  },

  preview: {
    host: '127.0.0.1',
    port,
    strictPort: false,
  },

  build: {
    // Emit build artefacts to the repository-root dist/, not public/dist.
    outDir: fileURLToPath(new URL('./dist', import.meta.url)),
    emptyOutDir: true,
  },
});

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL(".", import.meta.url));

/**
 * Build aislado para el APK/AAB de Android.
 *
 * No usa `index.html` ni `src/main.tsx`: esa entry pertenece a la app web y al
 * Controlador de escritorio. Aquí se compila únicamente `src/mobile`, de modo
 * que ninguna pantalla de proyección/segunda pantalla termina empaquetada.
 */
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist-mobile",
    emptyOutDir: true,
    sourcemap: false,
    rollupOptions: {
      input: {
        index: `${projectRoot}mobile.html`,
      },
    },
  },
  server: {
    host: true,
    port: 5174,
    strictPort: true,
    proxy: {
      "/content": {
        target: "http://127.0.0.1:4174",
        changeOrigin: true,
        rewrite: (requestPath) => requestPath.replace(/^\/content/, ""),
      },
    },
  },
});

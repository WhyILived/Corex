import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Tauri expects a fixed port and ignores src-tauri during HMR watching.
const host = process.env.TAURI_DEV_HOST;

export default defineConfig({
  plugins: [react()],
  // Prevent Vite from obscuring Rust errors.
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      ignored: ["**/src-tauri/**"],
    },
  },
  // Produce a build that the Tauri shell serves from dist/.
  // Vite 8 (Rolldown) uses its built-in oxc transpiler/minifier by default,
  // so no esbuild-specific target/minify overrides are needed.
  build: {
    sourcemap: false,
  },
});

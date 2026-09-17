import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

/**
 * Browser-only preview of the renderer UI (no Electron, no real IPC — see
 * `src/renderer/src/mock-directify.ts`). Not used by the real app build,
 * which goes through `electron.vite.config.ts` instead.
 */
export default defineConfig({
  root: "src/renderer",
  resolve: {
    alias: {
      "@renderer": resolve("src/renderer/src"),
    },
  },
  plugins: [react()],
  server: {
    port: 5174,
  },
});

import { resolve } from "node:path";
import { defineConfig, externalizeDepsPlugin } from "electron-vite";
import react from "@vitejs/plugin-react";

const workspacePackages = ["@directify/shared", "@directify/ui"];

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin({ exclude: workspacePackages })],
  },
  preload: {
    plugins: [externalizeDepsPlugin({ exclude: workspacePackages })],
  },
  renderer: {
    resolve: {
      alias: {
        "@renderer": resolve("src/renderer/src"),
      },
    },
    plugins: [react()],
  },
});

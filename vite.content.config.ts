import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    emptyOutDir: false, // Do not delete other dist files
    outDir: "dist",
    lib: {
      entry: "src/content.tsx",
      name: "SmartFormContent",
      formats: ["iife"],
      fileName: () => "content.js",
    },
  },
  define: {
    "process.env.NODE_ENV": "\"production\"",
  },
});

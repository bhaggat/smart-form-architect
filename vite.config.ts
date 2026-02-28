import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5200,
    strictPort: true, // Optional: prevents Vite from trying 5201 if 5200 is busy
  },
  build: {
    outDir: "dist",
    rollupOptions: {
      input: {
        main: "./index.html",
        background: "./src/background.ts",
      },
      output: {
        entryFileNames: "[name].js",
      },
    },
  },
});

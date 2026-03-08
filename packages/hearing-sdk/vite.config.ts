import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "HearingSDK",
      formats: ["iife"],
      fileName: () => "hearing-sdk.iife.js",
    },
    outDir: "dist",
    minify: true,
    sourcemap: true,
    rollupOptions: {
      output: {
        exports: "named",
      },
    },
  },
});

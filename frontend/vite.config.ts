import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

const target = process.env.VITE_PROXY_TARGET;

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 3000,
    proxy: target
      ? {
          "/api": {
            target,
            changeOrigin: true,
          },
        }
      : undefined,
  },
  build: {
    outDir: "dist",
    sourcemap: true,
  },
});

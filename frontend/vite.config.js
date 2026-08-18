import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:4000",
    },
  },
  // `vite preview` (serves the production build) doesn't inherit the dev
  // server's proxy config above — it needs its own, or /api requests will
  // 404 against the static file server instead of reaching the backend.
  preview: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:4000",
    },
  },
});

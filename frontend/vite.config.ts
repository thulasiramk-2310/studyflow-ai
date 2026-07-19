import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/**
 * Vite configuration
 *
 * Dev-server proxy:
 *   Any request to /auth/* (and other API paths) made from the React app
 *   is forwarded to the Spring Boot backend at http://localhost:8080.
 *   This eliminates CORS issues during local development — the browser
 *   only ever talks to the Vite dev server on localhost:5173.
 *
 *   In production the frontend will be served from Spring Boot itself
 *   (or a separate CDN/Nginx), so no proxy is needed there.
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      "/auth": {
        target: "http://studyflow-alb-dev-2122782669.ap-south-1.elb.amazonaws.com",
        changeOrigin: true,
        secure: false,
      },
      "/api": {
        target: "http://studyflow-alb-dev-2122782669.ap-south-1.elb.amazonaws.com",
        changeOrigin: true,
        secure: false,
      },
      "/internal": {
        target: "http://studyflow-alb-dev-2122782669.ap-south-1.elb.amazonaws.com",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});

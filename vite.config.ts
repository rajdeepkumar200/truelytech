import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";

const ICON_VERSION = "20260201f";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: "./",
  server: {
    host: "::",
    port: 8080,
    watch: {
      ignored: ["**/android/**", "**/dist/**", "**/.git/**"],
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      // We register the service worker manually in code so we can skip it
      // inside Capacitor (Android) where SW caching can cause stale bundles.
      injectRegister: null,
      includeAssets: [
        "favicon.ico",
        "favicon.svg",
        "robots.txt",
        "pwa-192x192.png",
        "pwa-512x512.png",
        "pwa-512x512-maskable.png",
      ],
      manifest: {
        name: "Habitency",
        short_name: "Habitency",
        description: "Beautiful daily habit tracker to build consistency and track your weekly progress.",
        theme_color: "#2C4A6F",
        background_color: "#FFFFFF",
        display: "standalone",
        orientation: "portrait",
        orientation: "portrait",
        start_url: "./",
        icons: [
          {
            src: `pwa-192x192.png?v=${ICON_VERSION}`,
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: `pwa-512x512.png?v=${ICON_VERSION}`,
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: `pwa-512x512-maskable.png?v=${ICON_VERSION}`,
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        // Prevent the service worker SPA fallback from hijacking APK/JSON requests.
        // Without this, navigating to /habitency.apk can return index.html (looks like the website).
        navigateFallbackDenylist: [/^\/habitency\.apk$/i, /^\/app-update\.json$/i, /\.apk$/i],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));

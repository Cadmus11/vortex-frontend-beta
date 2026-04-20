import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import path from "path"
import { defineConfig } from "vite"

const API_BASE = process.env.VITE_API_URL || "http://localhost:3000"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    include: ['face-api.js'],
  },
  server: {
    proxy: {
      '/auth': {
        target: API_BASE,
        changeOrigin: true,
        secure: false
      },
      '/elections': {
        target: API_BASE,
        changeOrigin: true,
        secure: false
      },
      '/positions': {
        target: API_BASE,
        changeOrigin: true,
        secure: false
      },
      '/candidates': {
        target: API_BASE,
        changeOrigin: true,
        secure: false
      },
      '/votes': {
        target: API_BASE,
        changeOrigin: true,
        secure: false
      },
      '/users': {
        target: API_BASE,
        changeOrigin: true,
        secure: false
      },
      '/media': {
        target: API_BASE,
        changeOrigin: true,
        secure: false
      },
      '/face': {
        target: API_BASE,
        changeOrigin: true,
        secure: false
      },
      '/campaigns': {
        target: API_BASE,
        changeOrigin: true,
        secure: false
      }
    }
  }
})

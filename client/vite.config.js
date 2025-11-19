import path from "path"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],

  server: {
    port: 3000,
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    proxy: {
      '/api': {
        target: 'https://paymentgateway-app.onrender.com',
        changeOrigin: true,
        secure: false
      }
    }
  }
})

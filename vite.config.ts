import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'
import path from "path"

import { tanstackRouter } from '@tanstack/router-plugin/vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const config = defineConfig({
  resolve: { 
    tsconfigPaths: true,
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  }, 
  plugins: [
    devtools(),
    tailwindcss(),
    tanstackRouter({ target: 'react', autoCodeSplitting: true }),
    viteReact(),
  ],
  optimizeDeps: {
    // Exclude WASM and heavy vision packages from Vite pre-bundling
    exclude: [
      '@tensorflow/tfjs-tflite',
      '@mediapipe/tasks-vision'
    ],
  },
  server: {
    // Enable SharedArrayBuffer support for WASM multi-threading
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
    allowedHosts: ['.ngrok-free.dev']
  },
  assetsInclude: ['**/*.tflite', '**/*.task'], // Treat model files as static assets
})

export default config
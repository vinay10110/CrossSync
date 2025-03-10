import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { loadEnv } from 'vite'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, __dirname, '')
  
  return {
    plugins: [react()],
    define: {
      // Expose env variables to your app
      'process.env.VITE_GOOGLE_MAPS_API_KEY': JSON.stringify(env.VITE_GOOGLE_MAPS_API_KEY),
      'process.env.VITE_SEAROUTES_API_KEY': JSON.stringify('YSBAD4dqGn67jOnxXEHSi7MeJgjg0N4W4bn8xjeN')
    },
    server: {
      host: true,
      port: 3000,
      hmr: true,
      cache: true
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'mantine': ['@mantine/core', '@mantine/hooks'],
            'vendor': ['react', 'react-dom'],
          }
        }
      },
      sourcemap: true,
      chunkSizeWarningLimit: 1000
    },
  }
})

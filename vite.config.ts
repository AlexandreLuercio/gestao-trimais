import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Casting process to any to avoid strict type checking issues on build environments
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
      // Polyfill for process to avoid crashes in browser if libs use it
      'process.env': {} 
    },
    build: {
      outDir: 'dist',
      sourcemap: false
    }
  }
})

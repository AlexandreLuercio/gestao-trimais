import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    base: '/', // Essencial para Vercel (caminhos corretos em deploy)
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY)
    },
    server: {
      port: 3000 // Para testes locais consistentes
    },
    build: {
      outDir: 'dist',
      sourcemap: mode === 'production' ? false : true, // Sourcemap só em dev
      rollupOptions: { // <--- ADICIONE ESTA SEÇÃO
        external: [/^@firebase\/.*/], // <--- E ESTA LINHA: Garante que todos os módulos do Firebase sejam tratados como externos
      }
    }
  }
})

import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],

  server: {
    port: 5173,
    // Em desenvolvimento o front chama caminhos relativos (/api/posts) e o Vite
    // repassa para a API. Assim nao dependemos de CORS e o codigo fica igual ao
    // de producao, onde o Nginx faz o mesmo proxy.
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },

  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/setupTests.ts',
    coverage: {
      reporter: ['text', 'text-summary', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.test.{ts,tsx}', 'src/main.tsx', 'src/**/*.d.ts'],
      // Meta propria do front (o back-end usa 20%). Concentra-se em api/,
      // hooks/ e contexts/, que e onde mora a logica.
      thresholds: {
        statements: 40,
        branches: 30,
        functions: 40,
        lines: 40,
      },
    },
  },
})

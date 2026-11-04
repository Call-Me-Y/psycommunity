import { defineConfig, loadEnv } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const backend = env.API_PROXY_TARGET || 'http://localhost:8080'

  return {
    plugins: [uni()],
    server: {
      host: '0.0.0.0',
      port: 5173,
      proxy: {
        '/api': { target: backend, changeOrigin: true },
        '/uploads': { target: backend, changeOrigin: true },
        '/ws': { target: backend, changeOrigin: true, ws: true }
      }
    },
    build: {
      assetsDir: 'static',
      target: 'es2020'
    }
  }
})

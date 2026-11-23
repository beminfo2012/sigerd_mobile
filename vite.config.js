import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    extensions: ['.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json']
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//]
      },
      includeAssets: ['favicon.png', 'apple-touch-icon.png', 'pwa-icon.png', 'pwa-192x192.png', 'pwa-512x512.png', 'pwa-maskable-512x512.png'],
      manifest: {
        id: '/',
        name: 'SIGERD - Defesa Civil',
        short_name: 'SIGERD',
        description: 'Sistema de Gerenciamento de Emergências e Riscos para Defesa Civil Municipal',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#2a5299',
        lang: 'pt-BR',
        scope: '/',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/pwa-maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ],
        shortcuts: [
          {
            name: 'Iniciar Checklist de Saída',
            short_name: 'Checklist',
            description: 'Verificar equipamentos antes de sair',
            url: '/checklist-saida',
            icons: [{ src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' }]
          },
          {
            name: 'Nova Vistoria',
            short_name: 'Vistoria',
            description: 'Criar nova vistoria de campo',
            url: '/vistorias',
            icons: [{ src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' }]
          }
        ]
      }
    })
  ],
  server: {
    proxy: {
      '/cemaden': {
        target: 'https://sws.cemaden.gov.br',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/cemaden/, '')
      },
      '/api/importar_pdf': {
        target: 'https://sigerd-mobile.vercel.app',
        changeOrigin: true
      },
      '/api': {
        target: 'https://sigerd-mobile.vercel.app', // Fallback para produção para evitar o erro local
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api')
      }
    }
  }
})

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      workbox: {
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true
      },
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'Defesa Civil Municipal',
        short_name: 'DefesaCivil',
        description: 'Aplicativo de uso em campo para Defesa Civil',
        theme_color: '#2a5299',
        version: '1.2.0',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ],
        shortcuts: [
          {
            name: 'Iniciar Vistoria',
            short_name: 'Checklist',
            description: 'Verificar equipamentos antes de sair',
            url: '/checklist-saida',
            icons: [{ src: '/pwa-192x192.png', sizes: '192x192' }]
          },
          {
            name: 'Nova Vistoria',
            short_name: 'Vistoria',
            description: 'Criar nova vistoria',
            url: '/vistorias',
            icons: [{ src: '/pwa-192x192.png', sizes: '192x192' }]
          }
        ]
      }
    })
  ],
})

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles/global.css'
import L from 'leaflet'
import { registerSW } from 'virtual:pwa-register'

// Ensure Leaflet is globally available before any component renders
if (typeof window !== 'undefined') {
    window.L = L;
}

// Auto update PWA Service Worker na Vercel para forçar a nova versão no navegador do usuário
const updateSW = registerSW({
  onNeedRefresh() {
    console.log('Nova versão detectada! Atualizando Service Worker e recarregando aplicação...');
    updateSW(true);
  },
  onOfflineReady() {
    console.log('Aplicativo pronto para funcionamento offline.');
  },
  immediate: true
});

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
)

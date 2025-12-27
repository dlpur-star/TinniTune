import React from 'react'
import ReactDOM from 'react-dom/client'
import TinniTune from './TinniTune.jsx'
import './index.css'

// Register service worker for PWA functionality (with graceful degradation)
if ('serviceWorker' in navigator && 'caches' in window) {
  window.addEventListener('load', () => {
    try {
      const base = import.meta.env.BASE_URL || '/TinniTune/';
      navigator.serviceWorker
        .register(`${base}service-worker.js`)
        .then((registration) => {
          console.log('Service Worker registered successfully:', registration.scope);
        })
        .catch((error) => {
          // Service worker failed but app should still work
          console.log('Service Worker registration failed (PWA features disabled):', error);
        });
    } catch (error) {
      // Silently fail - app works without PWA
      console.log('Service Worker not supported (app works in non-PWA mode)');
    }
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <TinniTune />
  </React.StrictMode>,
)

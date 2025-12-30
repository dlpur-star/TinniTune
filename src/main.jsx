import React from 'react'
import ReactDOM from 'react-dom/client'
import TinniTune from './TinniTune.jsx'
import './index.css'

// TEMPORARILY DISABLED: Service workers are causing blank page issues
// Will re-enable once the caching bugs are fully resolved
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Unregister ALL service workers to fix blank page
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => {
        console.log('Unregistering service worker:', registration.scope);
        registration.unregister();
      });
    });

    // Clear all caches
    if ('caches' in window) {
      caches.keys().then((cacheNames) => {
        cacheNames.forEach((cacheName) => {
          console.log('Clearing cache:', cacheName);
          caches.delete(cacheName);
        });
      });
    }
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <TinniTune />
  </React.StrictMode>,
)

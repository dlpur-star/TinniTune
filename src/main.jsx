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

          // Immediate update check on registration
          registration.update();

          // Check for updates when user returns to the app
          document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
              registration.update();
            }
          });

          // Also check when window regains focus
          window.addEventListener('focus', () => {
            registration.update();
          });

          // Check for updates every 5 minutes (as backup)
          setInterval(() => {
            registration.update();
          }, 5 * 60 * 1000);

          // Listen for updates and reload automatically
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'activated' && navigator.serviceWorker.controller) {
                // New service worker activated - reload to get latest version
                console.log('New version available! Reloading...');
                window.location.reload();
              }
            });
          });
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

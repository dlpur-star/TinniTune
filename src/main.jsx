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

// Error boundary to catch React errors and display them
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('React Error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '40px',
          fontFamily: 'system-ui, sans-serif',
          background: 'linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%)',
          color: 'white',
          minHeight: '100vh'
        }}>
          <h1 style={{ color: '#ff6b6b' }}>⚠️ Something went wrong</h1>
          <p>TinniTune encountered an error. Please try:</p>
          <ol>
            <li>Refresh the page</li>
            <li>Clear your browser cache and cookies</li>
            <li>Visit <a href="/recover.html" style={{ color: '#4ECDC4' }}>/recover.html</a> to reset everything</li>
          </ol>
          <details style={{ marginTop: '20px', background: 'rgba(255,255,255,0.1)', padding: '20px', borderRadius: '10px' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>Error Details (for developers)</summary>
            <pre style={{ background: '#000', padding: '10px', overflow: 'auto', marginTop: '10px' }}>
              {this.state.error && this.state.error.toString()}
              {this.state.errorInfo && this.state.errorInfo.componentStack}
            </pre>
          </details>
        </div>
      );
    }
    return this.props.children;
  }
}

// Global error handler for non-React errors
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  const root = document.getElementById('root');
  if (root && !root.innerHTML.trim()) {
    root.innerHTML = `
      <div style="padding: 40px; font-family: system-ui; background: linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%); color: white; min-height: 100vh;">
        <h1 style="color: #ff6b6b">⚠️ JavaScript Error</h1>
        <p>TinniTune failed to load. Error:</p>
        <pre style="background: #000; padding: 10px; overflow: auto;">${event.error ? event.error.toString() : event.message}</pre>
        <p>Please try:</p>
        <ol>
          <li>Visit <a href="/recover.html" style="color: #4ECDC4">/recover.html</a></li>
          <li>Clear browser data</li>
          <li>Restart your device</li>
        </ol>
      </div>
    `;
  }
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <TinniTune />
    </ErrorBoundary>
  </React.StrictMode>,
)

import React, { useState, useEffect } from 'react';
import './OfflineIndicator.css';

/**
 * OfflineIndicator - Shows connection status and offline capabilities
 */
const OfflineIndicator = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showIndicator, setShowIndicator] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowIndicator(true);
      // Hide the "back online" message after 3 seconds
      setTimeout(() => setShowIndicator(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowIndicator(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showIndicator) return null;

  return (
    <div className={`offline-indicator ${isOnline ? 'online' : 'offline'}`}>
      <div className="indicator-content">
        {isOnline ? (
          <>
            <span className="indicator-icon">✓</span>
            <span className="indicator-text">Back online</span>
          </>
        ) : (
          <>
            <span className="indicator-icon">📡</span>
            <span className="indicator-text">Offline mode - Your data is safe</span>
          </>
        )}
      </div>
    </div>
  );
};

export default OfflineIndicator;

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY_PREFIX = 'tinnitune_user_settings';

const DEFAULT_SETTINGS = {
  // Frequency matching results
  frequency: null,
  ear: null,
  confidence: null,

  // Therapy preferences
  mode: 'daytime',
  notchEnabled: true,
  notchIntensity: 'standard',
  volumeLeft: -15,
  volumeRight: -15,

  // Calm mode preferences
  calmMode: {
    enabled: false,
    heartbeatBPM: 55,
    heartbeatVolume: -15, // dB scale (consistent with component state)
    breathingEnabled: true
  },

  // Favorite therapy presets
  favorites: [],

  // Metadata
  lastUpdated: null,
  calibrationCompleted: false
};

/**
 * Custom hook for managing user settings persistence (profile-aware)
 * @param {string} profileId - The active profile ID to load settings for
 * @returns {Object} Settings object and methods to update/reset settings
 */
export const useUserSettings = (profileId = null) => {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  // Generate storage key based on profile ID
  const getStorageKey = useCallback(() => {
    return profileId ? `${STORAGE_KEY_PREFIX}_${profileId}` : STORAGE_KEY_PREFIX;
  }, [profileId]);

  // Load settings from localStorage when profileId changes
  useEffect(() => {
    if (!profileId) {
      setIsLoaded(false);
      return;
    }

    try {
      const storageKey = getStorageKey();
      const savedSettings = localStorage.getItem(storageKey);
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      } else {
        // No saved settings for this profile, use defaults
        setSettings(DEFAULT_SETTINGS);
      }
      setIsLoaded(true);
    } catch (error) {
      console.error('Error loading user settings:', error);
      setSettings(DEFAULT_SETTINGS);
      setIsLoaded(true);
    }
  }, [profileId, getStorageKey]);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    if (isLoaded && profileId) {
      try {
        const toSave = {
          ...settings,
          lastUpdated: new Date().toISOString()
        };
        const storageKey = getStorageKey();
        localStorage.setItem(storageKey, JSON.stringify(toSave));
      } catch (error) {
        console.error('Error saving user settings:', error);
      }
    }
  }, [settings, isLoaded, profileId, getStorageKey]);

  /**
   * Update specific settings
   * @param {Object} updates - Partial settings object to merge
   */
  const updateSettings = useCallback((updates) => {
    setSettings(prev => ({ ...prev, ...updates }));
  }, []);

  /**
   * Update nested calm mode settings
   * @param {Object} calmModeUpdates - Partial calm mode settings
   */
  const updateCalmMode = useCallback((calmModeUpdates) => {
    setSettings(prev => ({
      ...prev,
      calmMode: { ...prev.calmMode, ...calmModeUpdates }
    }));
  }, []);

  /**
   * Save calibration results
   * @param {number} frequency - Matched tinnitus frequency
   * @param {string} ear - Selected ear ('left', 'right', 'both')
   * @param {number} confidence - Confidence level (0-95)
   */
  const saveCalibration = useCallback((frequency, ear, confidence = null) => {
    setSettings(prev => ({
      ...prev,
      frequency,
      ear,
      confidence,
      calibrationCompleted: true
    }));
  }, []);

  /**
   * Reset all settings to defaults
   */
  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    if (profileId) {
      const storageKey = getStorageKey();
      localStorage.removeItem(storageKey);
    }
  }, [profileId, getStorageKey]);

  /**
   * Check if user has completed calibration
   * @returns {boolean}
   */
  const hasCalibration = useCallback(() => {
    return settings.calibrationCompleted && settings.frequency !== null;
  }, [settings]);

  /**
   * Save current therapy settings as a favorite preset
   * @param {string} name - Name for the favorite preset
   * @param {Object} currentSettings - Current therapy settings to save
   * @returns {Object} The created favorite
   */
  const saveFavorite = useCallback((name, currentSettings = null) => {
    // Use provided settings or fall back to saved settings
    const settingsToSave = currentSettings || settings;

    const newFavorite = {
      id: `favorite_${Date.now()}`,
      name: name.trim(),
      mode: settingsToSave.mode,
      notchEnabled: settingsToSave.notchEnabled,
      notchIntensity: settingsToSave.notchIntensity,
      volumeLeft: settingsToSave.volumeLeft,
      volumeRight: settingsToSave.volumeRight,
      calmMode: settingsToSave.calmMode ? { ...settingsToSave.calmMode } : { enabled: false, heartbeatBPM: 55, heartbeatVolume: -15, breathingEnabled: true },
      createdAt: new Date().toISOString()
    };

    setSettings(prev => ({
      ...prev,
      favorites: [...prev.favorites, newFavorite]
    }));

    return newFavorite;
  }, [settings]);

  /**
   * Load a favorite preset into current therapy settings
   * @param {string} favoriteId - ID of the favorite to load
   */
  const loadFavorite = useCallback((favoriteId) => {
    const favorite = settings.favorites.find(f => f.id === favoriteId);
    if (favorite) {
      setSettings(prev => ({
        ...prev,
        mode: favorite.mode,
        notchEnabled: favorite.notchEnabled,
        notchIntensity: favorite.notchIntensity,
        volumeLeft: favorite.volumeLeft,
        volumeRight: favorite.volumeRight,
        calmMode: { ...favorite.calmMode }
      }));
    }
  }, [settings.favorites]);

  /**
   * Delete a favorite preset
   * @param {string} favoriteId - ID of the favorite to delete
   */
  const deleteFavorite = useCallback((favoriteId) => {
    setSettings(prev => ({
      ...prev,
      favorites: prev.favorites.filter(f => f.id !== favoriteId)
    }));
  }, []);

  /**
   * Rename a favorite preset
   * @param {string} favoriteId - ID of the favorite to rename
   * @param {string} newName - New name for the favorite
   */
  const renameFavorite = useCallback((favoriteId, newName) => {
    setSettings(prev => ({
      ...prev,
      favorites: prev.favorites.map(f =>
        f.id === favoriteId ? { ...f, name: newName.trim() } : f
      )
    }));
  }, []);

  /**
   * Update an existing favorite preset with new settings
   * @param {string} favoriteId - ID of the favorite to update
   * @param {Object} currentSettings - Current therapy settings to save
   */
  const updateFavorite = useCallback((favoriteId, currentSettings = null) => {
    const settingsToSave = currentSettings || settings;

    setSettings(prev => ({
      ...prev,
      favorites: prev.favorites.map(f =>
        f.id === favoriteId ? {
          ...f,
          mode: settingsToSave.mode,
          notchEnabled: settingsToSave.notchEnabled,
          notchIntensity: settingsToSave.notchIntensity,
          volumeLeft: settingsToSave.volumeLeft,
          volumeRight: settingsToSave.volumeRight,
          calmMode: settingsToSave.calmMode ? { ...settingsToSave.calmMode } : { enabled: false, heartbeatBPM: 55, heartbeatVolume: -15, breathingEnabled: true },
          updatedAt: new Date().toISOString()
        } : f
      )
    }));
  }, [settings]);

  return {
    settings,
    isLoaded,
    updateSettings,
    updateCalmMode,
    saveCalibration,
    resetSettings,
    hasCalibration,
    saveFavorite,
    loadFavorite,
    deleteFavorite,
    renameFavorite,
    updateFavorite
  };
};

export default useUserSettings;

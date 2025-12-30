import { useState, useEffect, useCallback } from 'react';

const PROFILES_KEY = 'tinnitune_user_profiles';
const ACTIVE_PROFILE_KEY = 'tinnitune_active_profile';

/**
 * Custom hook for managing multiple user profiles
 * @returns {Object} Profile management methods and state
 */
export const useUserProfiles = () => {
  const [profiles, setProfiles] = useState([]);
  const [activeProfileId, setActiveProfileId] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load profiles from localStorage on mount
  useEffect(() => {
    try {
      const savedProfiles = localStorage.getItem(PROFILES_KEY);
      const savedActiveId = localStorage.getItem(ACTIVE_PROFILE_KEY);

      if (savedProfiles) {
        const parsed = JSON.parse(savedProfiles);
        setProfiles(parsed);

        // Set active profile
        if (savedActiveId && parsed.find(p => p.id === savedActiveId)) {
          setActiveProfileId(savedActiveId);
        } else if (parsed.length > 0) {
          // Default to first profile if no active profile set
          setActiveProfileId(parsed[0].id);
        }
      }
      setIsLoaded(true);
    } catch (error) {
      console.error('Error loading user profiles:', error);
      setIsLoaded(true);
    }
  }, []);

  // Save profiles to localStorage whenever they change
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
      } catch (error) {
        console.error('Error saving user profiles:', error);
      }
    }
  }, [profiles, isLoaded]);

  // Save active profile ID whenever it changes
  useEffect(() => {
    if (isLoaded && activeProfileId) {
      try {
        localStorage.setItem(ACTIVE_PROFILE_KEY, activeProfileId);
      } catch (error) {
        console.error('Error saving active profile:', error);
      }
    }
  }, [activeProfileId, isLoaded]);

  /**
   * Create a new user profile
   * @param {string} name - Profile name
   * @returns {Object} The created profile
   */
  const createProfile = useCallback((name) => {
    const newProfile = {
      id: `profile_${Date.now()}`,
      name: name.trim(),
      createdAt: new Date().toISOString(),
      lastUsed: new Date().toISOString()
    };

    setProfiles(prev => [...prev, newProfile]);
    setActiveProfileId(newProfile.id);

    return newProfile;
  }, []);

  /**
   * Switch to a different profile
   * @param {string} profileId - Profile ID to switch to
   */
  const switchProfile = useCallback((profileId) => {
    const profile = profiles.find(p => p.id === profileId);
    if (profile) {
      setActiveProfileId(profileId);

      // Update last used timestamp
      setProfiles(prev => prev.map(p =>
        p.id === profileId
          ? { ...p, lastUsed: new Date().toISOString() }
          : p
      ));
    }
  }, [profiles]);

  /**
   * Delete a profile
   * @param {string} profileId - Profile ID to delete
   */
  const deleteProfile = useCallback((profileId) => {
    // Don't allow deleting if it's the only profile
    if (profiles.length <= 1) {
      return false;
    }

    const newProfiles = profiles.filter(p => p.id !== profileId);
    setProfiles(newProfiles);

    // If we deleted the active profile, switch to the first available
    if (activeProfileId === profileId && newProfiles.length > 0) {
      setActiveProfileId(newProfiles[0].id);
    }

    // Also delete the profile's settings
    try {
      localStorage.removeItem(`tinnitune_user_settings_${profileId}`);
    } catch (error) {
      console.error('Error deleting profile settings:', error);
    }

    return true;
  }, [profiles, activeProfileId]);

  /**
   * Rename a profile
   * @param {string} profileId - Profile ID to rename
   * @param {string} newName - New profile name
   */
  const renameProfile = useCallback((profileId, newName) => {
    setProfiles(prev => prev.map(p =>
      p.id === profileId
        ? { ...p, name: newName.trim() }
        : p
    ));
  }, []);

  /**
   * Get the active profile object
   * @returns {Object|null} Active profile or null
   */
  const getActiveProfile = useCallback(() => {
    return profiles.find(p => p.id === activeProfileId) || null;
  }, [profiles, activeProfileId]);

  /**
   * Get profile count
   * @returns {number} Number of profiles
   */
  const getProfileCount = useCallback(() => {
    return profiles.length;
  }, [profiles]);

  return {
    profiles,
    activeProfileId,
    activeProfile: getActiveProfile(),
    isLoaded,
    createProfile,
    switchProfile,
    deleteProfile,
    renameProfile,
    getProfileCount
  };
};

export default useUserProfiles;

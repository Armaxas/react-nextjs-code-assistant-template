"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import {
  FeatureSettings,
  UserSettings,
  DEFAULT_FEATURE_SETTINGS,
} from "@/types/settings";

interface SettingsContextType {
  settings: UserSettings;
  updateFeatureSetting: (
    feature: keyof FeatureSettings,
    enabled: boolean
  ) => void;
  resetToDefaults: () => void;
  isLoading: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined
);

const SETTINGS_STORAGE_KEY = "isc-code-connect-settings";

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<UserSettings>({
    features: DEFAULT_FEATURE_SETTINGS,
    lastUpdated: new Date().toISOString(),
  });
  const [isLoading, setIsLoading] = useState(true);

  // Load settings from localStorage on mount
  useEffect(() => {
    const loadSettings = () => {
      try {
        const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
        if (stored) {
          const parsedSettings: UserSettings = JSON.parse(stored);
          // Merge with defaults to ensure all features are present
          const mergedFeatures = {
            ...DEFAULT_FEATURE_SETTINGS,
            ...parsedSettings.features,
          };
          setSettings({
            features: mergedFeatures,
            lastUpdated: parsedSettings.lastUpdated || new Date().toISOString(),
          });
        }
      } catch (error) {
        console.error("Error loading settings from localStorage:", error);
        // If there's an error, use defaults
        setSettings({
          features: DEFAULT_FEATURE_SETTINGS,
          lastUpdated: new Date().toISOString(),
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
      } catch (error) {
        console.error("Error saving settings to localStorage:", error);
      }
    }
  }, [settings, isLoading]);

  const updateFeatureSetting = (
    feature: keyof FeatureSettings,
    enabled: boolean
  ) => {
    setSettings((prev) => ({
      features: {
        ...prev.features,
        [feature]: enabled,
      },
      lastUpdated: new Date().toISOString(),
    }));
  };

  const resetToDefaults = () => {
    setSettings({
      features: DEFAULT_FEATURE_SETTINGS,
      lastUpdated: new Date().toISOString(),
    });
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateFeatureSetting,
        resetToDefaults,
        isLoading,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
};

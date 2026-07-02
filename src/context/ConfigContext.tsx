
import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { SettingsState } from '../types/settings';
import { settingsDefinitions } from '../data/settingsDefinition';

const STORAGE_KEY = 'ciclocred_settings_v4';

const getInitialConfig = () => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      // Merge with definitions to ensure new settings are included
      const merged = settingsDefinitions.reduce((acc, curr) => {
        acc[curr.id] = (parsed && parsed.config && parsed.config[curr.id]) || { ...curr };
        return acc;
      }, {} as Record<string, any>);
      return merged;
    } catch (e) {
      console.error('Error parsing saved settings', e);
    }
  }
  return settingsDefinitions.reduce((acc, curr) => {
    acc[curr.id] = { ...curr };
    return acc;
  }, {} as Record<string, any>);
};

const initialConfig = getInitialConfig();

const ConfigContext = createContext<{
  settings: SettingsState;
  updateSetting: (id: string, value: any) => void;
  applyChanges: () => void;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
}>({
  settings: { version: '4.2.0', lastUpdated: new Date(), config: initialConfig },
  updateSetting: () => {},
  applyChanges: () => {},
  isSaving: false,
  hasUnsavedChanges: false
});

export const ConfigProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<SettingsState>({ 
    version: '4.2.0', 
    lastUpdated: new Date(), 
    config: initialConfig 
  });
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const updateSetting = (id: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      config: {
        ...prev.config,
        [id]: { ...prev.config[id], value }
      }
    }));
    setHasUnsavedChanges(true);
  };

  const applyChanges = () => {
    setIsSaving(true);
    
    // Simulate API call
    setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      setIsSaving(false);
      setHasUnsavedChanges(false);
      console.log('Settings persisted to localStorage.');
    }, 800);
  };

  // Auto-save effect
  useEffect(() => {
    if (hasUnsavedChanges && !isSaving) {
      const timer = setTimeout(() => {
        applyChanges();
      }, 2000); // Auto-save after 2 seconds of inactivity
      return () => clearTimeout(timer);
    }
  }, [settings, hasUnsavedChanges, isSaving]);

  return (
    <ConfigContext.Provider value={{ settings, updateSetting, applyChanges, isSaving, hasUnsavedChanges }}>
      {children}
    </ConfigContext.Provider>
  );
};

export const useConfig = () => useContext(ConfigContext);

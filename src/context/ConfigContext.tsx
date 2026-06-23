
import { createContext, useContext, useState, ReactNode } from 'react';
import { SettingsState } from '../types/settings';

import { settingsDefinitions } from '../data/settingsDefinition';

const initialConfig = settingsDefinitions.reduce((acc, curr) => {
  acc[curr.id] = { ...curr };
  return acc;
}, {} as Record<string, any>);

const ConfigContext = createContext<{
  settings: SettingsState;
  updateSetting: (id: string, value: any) => void;
  applyChanges: () => void;
}>({
  settings: { version: '4.2.0', lastUpdated: new Date(), config: initialConfig },
  updateSetting: () => {},
  applyChanges: () => {}
});

export const ConfigProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<SettingsState>({ 
    version: '4.2.0', 
    lastUpdated: new Date(), 
    config: initialConfig 
  });

  const updateSetting = (id: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      config: {
        ...prev.config,
        [id]: { ...prev.config[id], value }
      }
    }));
  };

  const applyChanges = () => {
    // Logic to save to Firebase/Backend
    console.log('Applying changes...');
  };

  return (
    <ConfigContext.Provider value={{ settings, updateSetting, applyChanges }}>
      {children}
    </ConfigContext.Provider>
  );
};

export const useConfig = () => useContext(ConfigContext);

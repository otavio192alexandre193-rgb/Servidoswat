
export type SettingType = 'string' | 'number' | 'boolean' | 'enum' | 'secret' | 'textarea';
export type SettingImpact = 'low' | 'medium' | 'high' | 'critical';

export interface SettingDefinition<T> {
  id: string;
  category: string;
  label: string;
  description: string;
  type: SettingType;
  defaultValue: T;
  value: T;
  options?: { label: string; value: any }[];
  permissions: 'admin' | 'support' | 'user';
  impact: SettingImpact;
  needsRestart: boolean;
  validationRule?: (val: T) => boolean;
}

export interface SettingsState {
  version: string;
  lastUpdated: Date;
  config: Record<string, SettingDefinition<any>>;
}

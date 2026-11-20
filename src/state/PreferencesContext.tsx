import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import { settingsSections } from '@/data/settings';

type PreferenceValue = boolean | string;

function defaults(): Record<string, PreferenceValue> {
  const values: Record<string, PreferenceValue> = {};
  for (const section of settingsSections) {
    for (const group of section.groups) {
      for (const item of group.items) {
        if (item.kind === 'toggle' || item.kind === 'choice') values[`${section.id}.${item.id}`] = item.defaultValue;
      }
    }
  }
  return values;
}

interface PreferencesValue {
  get: <T extends PreferenceValue>(key: string, fallback: T) => T;
  set: (key: string, value: PreferenceValue) => void;
}

const PreferencesContext = createContext<PreferencesValue | null>(null);

/** In-memory user preferences. Swap for persisted storage / API later. */
export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [values, setValues] = useState(defaults);

  const get = useCallback(
    <T extends PreferenceValue>(key: string, fallback: T): T => (key in values ? (values[key] as T) : fallback),
    [values],
  );
  const set = useCallback((key: string, value: PreferenceValue) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  }, []);

  const value = useMemo(() => ({ get, set }), [get, set]);
  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences(): PreferencesValue {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error('usePreferences must be used inside PreferencesProvider');
  return ctx;
}

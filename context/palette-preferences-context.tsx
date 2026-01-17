import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ColorPaletteKey, defaultPaletteOrder } from '@/constants/palettes';

type PalettePreferences = {
  order: ColorPaletteKey[];
  enabled: Record<ColorPaletteKey, boolean>;
};

type PalettePreferencesContextType = {
  preferences: PalettePreferences;
  isLoading: boolean;
  togglePalette: (key: ColorPaletteKey) => void;
  movePaletteUp: (key: ColorPaletteKey) => void;
  movePaletteDown: (key: ColorPaletteKey) => void;
  getEnabledPalettes: () => ColorPaletteKey[];
  resetToDefaults: () => void;
};

const PalettePreferencesContext = createContext<PalettePreferencesContextType | undefined>(undefined);

const STORAGE_KEY = 'palette_preferences';

// Default: all palettes enabled
const getDefaultPreferences = (): PalettePreferences => ({
  order: [...defaultPaletteOrder],
  enabled: defaultPaletteOrder.reduce((acc, key) => {
    acc[key] = true;
    return acc;
  }, {} as Record<ColorPaletteKey, boolean>),
});

export function PalettePreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<PalettePreferences>(getDefaultPreferences());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as PalettePreferences;
        // Ensure any new palettes are added to the order and enabled
        const currentKeys = new Set(parsed.order);
        const newKeys = defaultPaletteOrder.filter(key => !currentKeys.has(key));
        if (newKeys.length > 0) {
          parsed.order = [...parsed.order, ...newKeys];
          newKeys.forEach(key => {
            parsed.enabled[key] = true;
          });
        }
        setPreferences(parsed);
      }
    } catch (error) {
      console.error('Error loading palette preferences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const savePreferences = async (newPrefs: PalettePreferences) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newPrefs));
    } catch (error) {
      console.error('Error saving palette preferences:', error);
    }
  };

  const togglePalette = (key: ColorPaletteKey) => {
    const newPrefs = {
      ...preferences,
      enabled: {
        ...preferences.enabled,
        [key]: !preferences.enabled[key],
      },
    };
    setPreferences(newPrefs);
    savePreferences(newPrefs);
  };

  const movePaletteUp = (key: ColorPaletteKey) => {
    const index = preferences.order.indexOf(key);
    if (index <= 0) return;

    const newOrder = [...preferences.order];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];

    const newPrefs = { ...preferences, order: newOrder };
    setPreferences(newPrefs);
    savePreferences(newPrefs);
  };

  const movePaletteDown = (key: ColorPaletteKey) => {
    const index = preferences.order.indexOf(key);
    if (index < 0 || index >= preferences.order.length - 1) return;

    const newOrder = [...preferences.order];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];

    const newPrefs = { ...preferences, order: newOrder };
    setPreferences(newPrefs);
    savePreferences(newPrefs);
  };

  const getEnabledPalettes = (): ColorPaletteKey[] => {
    return preferences.order.filter(key => preferences.enabled[key]);
  };

  const resetToDefaults = () => {
    const defaultPrefs = getDefaultPreferences();
    setPreferences(defaultPrefs);
    savePreferences(defaultPrefs);
  };

  return (
    <PalettePreferencesContext.Provider
      value={{
        preferences,
        isLoading,
        togglePalette,
        movePaletteUp,
        movePaletteDown,
        getEnabledPalettes,
        resetToDefaults,
      }}
    >
      {children}
    </PalettePreferencesContext.Provider>
  );
}

export function usePalettePreferences() {
  const context = useContext(PalettePreferencesContext);
  if (context === undefined) {
    throw new Error('usePalettePreferences must be used within a PalettePreferencesProvider');
  }
  return context;
}

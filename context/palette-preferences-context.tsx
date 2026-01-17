import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ColorPaletteKey, defaultPaletteOrder } from '@/constants/palettes';

type CustomCape = {
  name: string;
  colors: { name: string; hex: string }[];
  enabled: boolean;
  position: number; // Index in the combined list (0 = first)
} | null;

type PalettePreferences = {
  order: ColorPaletteKey[];
  enabled: Record<ColorPaletteKey, boolean>;
};

type PalettePreferencesContextType = {
  preferences: PalettePreferences;
  customCape: CustomCape;
  isLoading: boolean;
  togglePalette: (key: ColorPaletteKey) => void;
  setAllEnabled: (enabled: boolean) => void;
  movePaletteUp: (key: ColorPaletteKey) => void;
  movePaletteDown: (key: ColorPaletteKey) => void;
  getEnabledPalettes: () => ColorPaletteKey[];
  resetToDefaults: () => void;
  saveCustomCape: (cape: CustomCape) => void;
  deleteCustomCape: () => void;
  toggleCustomCape: () => void;
  moveCustomCapeUp: () => void;
  moveCustomCapeDown: () => void;
};

const PalettePreferencesContext = createContext<PalettePreferencesContextType | undefined>(undefined);

const STORAGE_KEY = 'palette_preferences';
const CUSTOM_CAPE_KEY = 'custom_cape';

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
  const [customCape, setCustomCape] = useState<CustomCape>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPreferences();
    loadCustomCape();
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

  const loadCustomCape = async () => {
    try {
      const stored = await AsyncStorage.getItem(CUSTOM_CAPE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Ensure defaults for older saved capes
        setCustomCape({
          ...parsed,
          enabled: parsed.enabled ?? true,
          position: parsed.position ?? 0,
        });
      }
    } catch (error) {
      console.error('Error loading custom cape:', error);
    }
  };

  const saveCustomCape = async (cape: CustomCape) => {
    try {
      if (cape) {
        await AsyncStorage.setItem(CUSTOM_CAPE_KEY, JSON.stringify(cape));
      } else {
        await AsyncStorage.removeItem(CUSTOM_CAPE_KEY);
      }
      setCustomCape(cape);
    } catch (error) {
      console.error('Error saving custom cape:', error);
    }
  };

  const deleteCustomCape = async () => {
    try {
      await AsyncStorage.removeItem(CUSTOM_CAPE_KEY);
      setCustomCape(null);
    } catch (error) {
      console.error('Error deleting custom cape:', error);
    }
  };

  const toggleCustomCape = async () => {
    if (!customCape) return;
    const updated = { ...customCape, enabled: !customCape.enabled };
    try {
      await AsyncStorage.setItem(CUSTOM_CAPE_KEY, JSON.stringify(updated));
      setCustomCape(updated);
    } catch (error) {
      console.error('Error toggling custom cape:', error);
    }
  };

  const moveCustomCapeUp = async () => {
    if (!customCape || customCape.position <= 0) return;
    const updated = { ...customCape, position: customCape.position - 1 };
    try {
      await AsyncStorage.setItem(CUSTOM_CAPE_KEY, JSON.stringify(updated));
      setCustomCape(updated);
    } catch (error) {
      console.error('Error moving custom cape:', error);
    }
  };

  const moveCustomCapeDown = async () => {
    if (!customCape) return;
    const maxPosition = preferences.order.length;
    if (customCape.position >= maxPosition) return;
    const updated = { ...customCape, position: customCape.position + 1 };
    try {
      await AsyncStorage.setItem(CUSTOM_CAPE_KEY, JSON.stringify(updated));
      setCustomCape(updated);
    } catch (error) {
      console.error('Error moving custom cape:', error);
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

  const setAllEnabled = (enabled: boolean) => {
    const newEnabled = preferences.order.reduce((acc, key) => {
      acc[key] = enabled;
      return acc;
    }, {} as Record<ColorPaletteKey, boolean>);
    const newPrefs = { ...preferences, enabled: newEnabled };
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
        customCape,
        isLoading,
        togglePalette,
        setAllEnabled,
        movePaletteUp,
        movePaletteDown,
        getEnabledPalettes,
        resetToDefaults,
        saveCustomCape,
        deleteCustomCape,
        toggleCustomCape,
        moveCustomCapeUp,
        moveCustomCapeDown,
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

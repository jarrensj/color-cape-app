import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ColorPaletteKey, defaultPaletteOrder, seasonalPalettes } from '@/constants/palettes';

type CustomCape = {
  id: string;
  name: string;
  colors: { name: string; hex: string }[];
  enabled: boolean;
  position: number; // Index in the combined list (0 = first)
};

const MAX_CUSTOM_CAPES = 5;

type PalettePreferences = {
  order: ColorPaletteKey[];
  enabled: Record<ColorPaletteKey, boolean>;
};

// Color mode for seasonal palettes: 'all8' = all 8, 'first4' = first 4, 'last4' = last 4
type ColorMode = 'all8' | 'first4' | 'last4';
type ColorModePrefs = Partial<Record<ColorPaletteKey, ColorMode>>;

type PalettePreferencesContextType = {
  preferences: PalettePreferences;
  customCapes: CustomCape[];
  colorModePrefs: ColorModePrefs;
  isLoading: boolean;
  togglePalette: (key: ColorPaletteKey) => void;
  setAllEnabled: (enabled: boolean) => void;
  movePaletteUp: (key: ColorPaletteKey) => void;
  movePaletteDown: (key: ColorPaletteKey) => void;
  getEnabledPalettes: () => ColorPaletteKey[];
  resetToDefaults: () => void;
  resetCustomCapes: () => void;
  saveCustomCape: (cape: Omit<CustomCape, 'id'> & { id?: string }) => void;
  deleteCustomCape: (id: string) => void;
  toggleCustomCape: (id: string) => void;
  moveCustomCapeUp: (id: string) => void;
  moveCustomCapeDown: (id: string) => void;
  canAddCustomCape: () => boolean;
  getDefaultCapeName: () => string;
  getColorMode: (key: ColorPaletteKey) => ColorMode;
  toggleColorMode: (key: ColorPaletteKey) => void;
  isSeasonalPalette: (key: ColorPaletteKey) => boolean;
};

const PalettePreferencesContext = createContext<PalettePreferencesContextType | undefined>(undefined);

const STORAGE_KEY = 'palette_preferences';
const CUSTOM_CAPE_KEY = 'custom_cape';
const COLOR_COUNT_KEY = 'color_count_prefs';

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
  const [customCapes, setCustomCapes] = useState<CustomCape[]>([]);
  const [colorModePrefs, setColorModePrefs] = useState<ColorModePrefs>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPreferences();
    loadCustomCapes();
    loadColorModePrefs();
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

  const loadCustomCapes = async () => {
    try {
      const stored = await AsyncStorage.getItem(CUSTOM_CAPE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Handle migration from single cape to array
        if (Array.isArray(parsed)) {
          setCustomCapes(parsed.map((cape: any) => ({
            ...cape,
            id: cape.id ?? `custom-${Date.now()}-${Math.random()}`,
            enabled: cape.enabled ?? true,
            position: cape.position ?? 0,
          })));
        } else {
          // Migrate single cape to array
          const migrated = [{
            ...parsed,
            id: parsed.id ?? `custom-${Date.now()}`,
            enabled: parsed.enabled ?? true,
            position: parsed.position ?? 0,
          }];
          setCustomCapes(migrated);
          await AsyncStorage.setItem(CUSTOM_CAPE_KEY, JSON.stringify(migrated));
        }
      }
    } catch (error) {
      console.error('Error loading custom capes:', error);
    }
  };

  const loadColorModePrefs = async () => {
    try {
      const stored = await AsyncStorage.getItem(COLOR_COUNT_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Migrate old format (4 | 8) to new format ('all8' | 'first4' | 'last4')
        const migrated: ColorModePrefs = {};
        for (const [key, value] of Object.entries(parsed)) {
          if (value === 4) {
            migrated[key as ColorPaletteKey] = 'first4';
          } else if (value === 8) {
            migrated[key as ColorPaletteKey] = 'all8';
          } else {
            migrated[key as ColorPaletteKey] = value as ColorMode;
          }
        }
        setColorModePrefs(migrated);
      }
    } catch (error) {
      console.error('Error loading color mode preferences:', error);
    }
  };

  const saveColorModePrefs = async (prefs: ColorModePrefs) => {
    try {
      await AsyncStorage.setItem(COLOR_COUNT_KEY, JSON.stringify(prefs));
      setColorModePrefs(prefs);
    } catch (error) {
      console.error('Error saving color mode preferences:', error);
    }
  };

  const isSeasonalPalette = (key: ColorPaletteKey): boolean => {
    return seasonalPalettes.includes(key);
  };

  const getColorMode = (key: ColorPaletteKey): ColorMode => {
    // Only seasonal palettes can have mode toggle, default to 'first4' (core colors)
    if (!isSeasonalPalette(key)) return 'all8';
    return colorModePrefs[key] ?? 'first4';
  };

  const toggleColorMode = async (key: ColorPaletteKey) => {
    if (!isSeasonalPalette(key)) return;
    const current = getColorMode(key);
    // Cycle: all8 -> first4 -> last4 -> all8
    const nextMode: ColorMode = current === 'all8' ? 'first4' : current === 'first4' ? 'last4' : 'all8';
    const newPrefs = { ...colorModePrefs, [key]: nextMode };
    await saveColorModePrefs(newPrefs);
  };

  const saveCustomCapes = async (capes: CustomCape[]) => {
    try {
      await AsyncStorage.setItem(CUSTOM_CAPE_KEY, JSON.stringify(capes));
      setCustomCapes(capes);
    } catch (error) {
      console.error('Error saving custom capes:', error);
    }
  };

  const saveCustomCape = async (cape: Omit<CustomCape, 'id'> & { id?: string }) => {
    const capeWithId: CustomCape = {
      ...cape,
      id: cape.id ?? `custom-${Date.now()}-${Math.random()}`,
    };

    const existingIndex = customCapes.findIndex(c => c.id === capeWithId.id);
    let updated: CustomCape[];
    if (existingIndex >= 0) {
      updated = [...customCapes];
      updated[existingIndex] = capeWithId;
    } else {
      if (customCapes.length >= MAX_CUSTOM_CAPES) return;
      updated = [...customCapes, capeWithId];
    }
    await saveCustomCapes(updated);
  };

  const deleteCustomCape = async (id: string) => {
    const updated = customCapes.filter(c => c.id !== id);
    await saveCustomCapes(updated);
  };

  const toggleCustomCape = async (id: string) => {
    const updated = customCapes.map(c =>
      c.id === id ? { ...c, enabled: !c.enabled } : c
    );
    await saveCustomCapes(updated);
  };

  const moveCustomCapeUp = async (id: string) => {
    const cape = customCapes.find(c => c.id === id);
    if (!cape || cape.position <= 0) return;
    const updated = customCapes.map(c =>
      c.id === id ? { ...c, position: c.position - 1 } : c
    );
    await saveCustomCapes(updated);
  };

  const moveCustomCapeDown = async (id: string) => {
    const cape = customCapes.find(c => c.id === id);
    if (!cape) return;
    const maxPosition = preferences.order.length + customCapes.length - 1;
    if (cape.position >= maxPosition) return;
    const updated = customCapes.map(c =>
      c.id === id ? { ...c, position: c.position + 1 } : c
    );
    await saveCustomCapes(updated);
  };

  const canAddCustomCape = () => customCapes.length < MAX_CUSTOM_CAPES;

  const getDefaultCapeName = () => `Untitled Custom ${customCapes.length + 1}`;

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

  const resetCustomCapes = async () => {
    await AsyncStorage.removeItem(CUSTOM_CAPE_KEY);
    setCustomCapes([]);
  };

  return (
    <PalettePreferencesContext.Provider
      value={{
        preferences,
        customCapes,
        colorModePrefs,
        isLoading,
        togglePalette,
        setAllEnabled,
        movePaletteUp,
        movePaletteDown,
        getEnabledPalettes,
        resetToDefaults,
        resetCustomCapes,
        saveCustomCape,
        deleteCustomCape,
        toggleCustomCape,
        moveCustomCapeUp,
        moveCustomCapeDown,
        canAddCustomCape,
        getDefaultCapeName,
        getColorMode,
        toggleColorMode,
        isSeasonalPalette,
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

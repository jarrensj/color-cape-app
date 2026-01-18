import { StyleSheet, View, Text, Pressable } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Camera, Sparkles, Palette } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colorPalettes, ColorPaletteKey } from '@/constants/palettes';
import { usePalettePreferences } from '@/context/palette-preferences-context';

type LastUsedPalette =
  | { type: 'palette'; key: ColorPaletteKey }
  | { type: 'custom'; id: string }
  | null;

const LAST_USED_PALETTE_KEY = 'last_used_palette';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { customCapes } = usePalettePreferences();
  const [lastUsed, setLastUsed] = useState<LastUsedPalette>(null);

  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem(LAST_USED_PALETTE_KEY).then((value) => {
        if (value) {
          setLastUsed(JSON.parse(value));
        }
      });
    }, [])
  );

  // Get display info for last used palette
  const getLastUsedInfo = () => {
    if (!lastUsed) return null;
    if (lastUsed.type === 'palette') {
      const palette = colorPalettes[lastUsed.key];
      return {
        name: palette.name,
        colors: palette.colors.slice(0, 4),
      };
    } else {
      const customCape = customCapes.find(c => c.id === lastUsed.id);
      if (!customCape) return null;
      return {
        name: customCape.name,
        colors: customCape.colors.slice(0, 4),
      };
    }
  };

  const lastUsedInfo = getLastUsedInfo();

  const openLastUsed = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/(tabs)/camera');
  };

  const openCamera = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/(tabs)/camera');
  };

  const openTest = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/(tabs)/test');
  };

  const openCustomize = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/customize');
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <View style={[styles.content, { paddingTop: insets.top + 60 }]}>
        <Text style={styles.title}>Color Cape</Text>
        <Text style={styles.subtitle}>
          Discover your perfect color palette
        </Text>

        {lastUsedInfo && (
          <Pressable
            style={({ pressed }) => [
              styles.recentActivity,
              pressed && styles.recentActivityPressed,
            ]}
            onPress={openLastUsed}
          >
            <Text style={styles.recentLabel}>Continue with</Text>
            <View style={styles.recentContent}>
              <Text style={styles.recentName}>{lastUsedInfo.name}</Text>
              <View style={styles.recentColors}>
                {lastUsedInfo.colors.map((color, index) => (
                  <View
                    key={index}
                    style={[styles.recentColorDot, { backgroundColor: color.hex }]}
                  />
                ))}
              </View>
            </View>
          </Pressable>
        )}

        <View style={styles.cardsContainer}>
          <Pressable
            style={({ pressed }) => [
              styles.card,
              pressed && styles.cardPressed,
            ]}
            onPress={openCamera}
          >
            <View style={styles.cardIconContainer}>
              <Camera size={24} color="#FFFFFF" strokeWidth={2} />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Try Palettes</Text>
              <Text style={styles.cardDescription}>
                Use camera to see how different color palettes look on you
              </Text>
            </View>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.card,
              pressed && styles.cardPressed,
            ]}
            onPress={openTest}
          >
            <View style={[styles.cardIconContainer, styles.cardIconPurple]}>
              <Sparkles size={24} color="#FFFFFF" strokeWidth={2} />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Take the Test</Text>
              <Text style={styles.cardDescription}>
                Find your seasonal color palette in a quick test
              </Text>
            </View>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.card,
              pressed && styles.cardPressed,
            ]}
            onPress={openCustomize}
          >
            <View style={[styles.cardIconContainer, styles.cardIconTeal]}>
              <Palette size={24} color="#FFFFFF" strokeWidth={2} />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Customize Capes</Text>
              <Text style={styles.cardDescription}>
                Toggle palettes, reorder, and create your own custom capes
              </Text>
            </View>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 42,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    marginBottom: 48,
  },
  recentActivity: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  recentActivityPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  recentLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  recentContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  recentName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  recentColors: {
    flexDirection: 'row',
    gap: 4,
  },
  recentColorDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  cardsContainer: {
    gap: 16,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cardPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  cardIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  cardIconPurple: {
    backgroundColor: '#9B59B6',
  },
  cardIconTeal: {
    backgroundColor: '#1ABC9C',
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.6)',
    lineHeight: 20,
  },
});

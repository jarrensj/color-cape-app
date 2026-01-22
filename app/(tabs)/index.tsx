import { StyleSheet, View, Text, Pressable, Modal, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Camera, Sparkles, Palette, SunDim, X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colorPalettes, ColorPaletteKey } from '@/constants/palettes';
import { usePalettePreferences } from '@/context/palette-preferences-context';
import { Image } from 'expo-image';
import Animated, {
  useAnimatedStyle,
  withTiming,
  withRepeat,
  useSharedValue,
  interpolateColor,
  Easing,
} from 'react-native-reanimated';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

type LastUsedPalette =
  | { type: 'palette'; key: ColorPaletteKey }
  | { type: 'custom'; id: string }
  | null;

type SavedTestResult = {
  subSeason: string;
  name: string;
  colors: { name: string; hex: string }[];
  savedAt: number;
} | null;

const LAST_USED_PALETTE_KEY = 'last_used_palette';
const SAVED_TEST_RESULT_KEY = 'saved_test_result';
const OPACITY_SETTING_KEY = 'cape_opacity';

const OPACITY_OPTIONS = [
  { label: 'Light', value: 0.5 },
  { label: 'Medium', value: 0.7 },
  { label: 'Strong', value: 0.85 },
  { label: 'Full', value: 1.0 },
];

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { customCapes, preferences } = usePalettePreferences();
  const [lastUsed, setLastUsed] = useState<LastUsedPalette>(null);
  const [savedTestResult, setSavedTestResult] = useState<SavedTestResult>(null);
  const [showOpacitySheet, setShowOpacitySheet] = useState(false);
  const [capeOpacity, setCapeOpacity] = useState(0.85);

  // Rainbow glow animation
  const glowProgress = useSharedValue(0);
  const pulseProgress = useSharedValue(0);

  useEffect(() => {
    glowProgress.value = withRepeat(
      withTiming(1, { duration: 10000, easing: Easing.linear }),
      -1,
      false
    );
    pulseProgress.value = withRepeat(
      withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
  }, []);

  const imageGlowStyle = useAnimatedStyle(() => {
    const glowColor = interpolateColor(
      glowProgress.value,
      [0, 0.16, 0.33, 0.5, 0.66, 0.83, 1],
      ['#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF', '#9B59B6', '#FF6BD6', '#FF6B6B']
    );
    const shadowRadius = 25 + (pulseProgress.value * 20);
    return {
      shadowColor: glowColor,
      shadowRadius: shadowRadius,
    };
  });

  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem(LAST_USED_PALETTE_KEY).then((value) => {
        if (value) {
          setLastUsed(JSON.parse(value));
        }
      });
      AsyncStorage.getItem(SAVED_TEST_RESULT_KEY).then((value) => {
        if (value) {
          setSavedTestResult(JSON.parse(value));
        }
      });
      AsyncStorage.getItem(OPACITY_SETTING_KEY).then((value) => {
        if (value !== null) {
          setCapeOpacity(parseFloat(value));
        }
      });
    }, [])
  );

  // Get display info for last used palette (only if still enabled)
  const getLastUsedInfo = () => {
    if (!lastUsed) return null;
    if (lastUsed.type === 'palette') {
      // Check if palette is still enabled
      if (!preferences.enabled[lastUsed.key]) return null;
      const palette = colorPalettes[lastUsed.key];
      return {
        name: palette.name,
        colors: palette.colors.slice(0, 4),
      };
    } else {
      const customCape = customCapes.find(c => c.id === lastUsed.id);
      // Check if custom cape exists and is enabled
      if (!customCape || !customCape.enabled) return null;
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

  const openOpacitySheet = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowOpacitySheet(true);
  };

  const handleOpacityChange = async (value: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCapeOpacity(value);
    await AsyncStorage.setItem(OPACITY_SETTING_KEY, value.toString());
  };

  const getOpacityLabel = () => {
    const option = OPACITY_OPTIONS.find(o => o.value === capeOpacity);
    return option?.label || 'Strong';
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <View style={[styles.content, { paddingTop: insets.top + 40 }]}>
        <Animated.View style={[styles.heroImageContainer, imageGlowStyle]}>
          <Image
            source={require('@/assets/images/unicorn-cape.png')}
            style={styles.heroImage}
            contentFit="contain"
          />
        </Animated.View>
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
            <Text style={styles.recentLabel}>Last viewed</Text>
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
                Find your seasonal color palette in a test
              </Text>
              {savedTestResult && (
                <View style={styles.savedResultInline}>
                  <Text style={styles.savedResultLabel}>Last saved result:</Text>
                  <Text style={styles.savedResultName}>{savedTestResult.name}</Text>
                  <View style={styles.savedResultColors}>
                    {savedTestResult.colors.map((color, index) => (
                      <View
                        key={index}
                        style={[styles.savedResultColorDot, { backgroundColor: color.hex }]}
                      />
                    ))}
                  </View>
                </View>
              )}
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

          <Pressable
            style={({ pressed }) => [
              styles.card,
              pressed && styles.cardPressed,
            ]}
            onPress={openOpacitySheet}
          >
            <View style={[styles.cardIconContainer, styles.cardIconIndigo]}>
              <SunDim size={24} color="#FFFFFF" strokeWidth={2} />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Cape Opacity</Text>
              <Text style={styles.cardDescription}>
                Adjust how visible the color overlay appears
              </Text>
              <View style={styles.opacityValueInline}>
                <Text style={styles.opacityValueLabel}>Current:</Text>
                <Text style={styles.opacityValueText}>{getOpacityLabel()}</Text>
              </View>
            </View>
          </Pressable>
        </View>
      </View>

      {/* Opacity Sheet */}
      <Modal
        visible={showOpacitySheet}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowOpacitySheet(false)}
      >
        <View style={styles.sheetOverlay}>
          <Pressable style={styles.sheetBackdrop} onPress={() => setShowOpacitySheet(false)} />
          <View style={[styles.sheetContent, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Cape Opacity</Text>
              <Pressable onPress={() => setShowOpacitySheet(false)} style={styles.sheetClose}>
                <X size={24} color="#FFFFFF" />
              </Pressable>
            </View>
            <Text style={styles.sheetDescription}>
              Choose how visible the color overlay appears on camera
            </Text>

            <View style={styles.opacityOptions}>
              {OPACITY_OPTIONS.map((option) => (
                <Pressable
                  key={option.value}
                  style={[
                    styles.opacityOption,
                    capeOpacity === option.value && styles.opacityOptionActive,
                  ]}
                  onPress={() => handleOpacityChange(option.value)}
                >
                  <View style={styles.opacityPreview}>
                    <View style={[styles.opacityPreviewBar, { opacity: option.value }]} />
                  </View>
                  <Text
                    style={[
                      styles.opacityOptionText,
                      capeOpacity === option.value && styles.opacityOptionTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      </Modal>
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
  heroImageContainer: {
    alignSelf: 'center',
    marginBottom: 20,
    width: 140,
    height: 140,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    elevation: 10,
  },
  heroImage: {
    width: 120,
    height: 120,
    borderRadius: 16,
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
  cardIconIndigo: {
    backgroundColor: '#5856D6',
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
  savedResultInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  savedResultLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  savedResultName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9B59B6',
  },
  savedResultColors: {
    flexDirection: 'row',
    gap: 3,
  },
  savedResultColorDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  opacityValueInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  opacityValueLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  opacityValueText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#5856D6',
  },
  sheetOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheetContent: {
    backgroundColor: '#1C1C1E',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
    paddingHorizontal: 20,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  sheetClose: {
    padding: 4,
  },
  sheetDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.5)',
    marginBottom: 20,
  },
  opacityOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  opacityOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  opacityOptionActive: {
    backgroundColor: 'rgba(88, 86, 214, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(88, 86, 214, 0.5)',
  },
  opacityPreview: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 8,
    overflow: 'hidden',
  },
  opacityPreviewBar: {
    flex: 1,
    backgroundColor: '#5856D6',
  },
  opacityOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  opacityOptionTextActive: {
    color: '#5856D6',
  },
});

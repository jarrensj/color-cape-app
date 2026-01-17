import { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Pressable, Alert, ScrollView, Switch, Animated } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RotateCcw, Crown, ChevronUp, ChevronDown } from 'lucide-react-native';
import RevenueCatUI from 'react-native-purchases-ui';
import { useOnboarding } from '@/context/onboarding-context';
import { usePalettePreferences } from '@/context/palette-preferences-context';
import { colorPalettes, ColorPaletteKey } from '@/constants/palettes';

export default function SettingsScreen() {
  const [showCustomerCenter, setShowCustomerCenter] = useState(false);
  const [highlightedKey, setHighlightedKey] = useState<ColorPaletteKey | null>(null);
  const highlightAnim = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { setHasOnboarded } = useOnboarding();
  const { preferences, togglePalette, movePaletteUp, movePaletteDown } = usePalettePreferences();

  const triggerHighlight = (key: ColorPaletteKey) => {
    setHighlightedKey(key);
    highlightAnim.setValue(1);
    Animated.timing(highlightAnim, {
      toValue: 0,
      duration: 1500,
      useNativeDriver: false,
    }).start(() => {
      setHighlightedKey(null);
    });
  };

  const resetApp = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    Alert.alert(
      'Reset App',
      'This will clear all your data and show the onboarding again. Are you sure?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.clear();
            setHasOnboarded(false);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            router.replace('/onboarding');
          },
        },
      ]
    );
  };

  const handleManageSubscription = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowCustomerCenter(true);
  };

  const handleTogglePalette = (key: ColorPaletteKey) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    togglePalette(key);
  };

  const handleMoveUp = (key: ColorPaletteKey) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    movePaletteUp(key);
    triggerHighlight(key);
  };

  const handleMoveDown = (key: ColorPaletteKey) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    movePaletteDown(key);
    triggerHighlight(key);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Customer Center Modal */}
      {showCustomerCenter && (
        <RevenueCatUI.CustomerCenter
          onDismiss={() => setShowCustomerCenter(false)}
        />
      )}

      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <Text style={styles.title}>Settings</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Cape Palettes Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cape Palettes</Text>
          <Text style={styles.sectionDescription}>
            Choose which palettes appear in the camera
          </Text>

          <View style={styles.paletteList}>
            {preferences.order.map((key, index) => {
              const palette = colorPalettes[key];
              const isEnabled = preferences.enabled[key];
              const isFirst = index === 0;
              const isLast = index === preferences.order.length - 1;

              const isHighlighted = highlightedKey === key;
              const animatedStyle = isHighlighted ? {
                backgroundColor: highlightAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['rgba(255, 255, 255, 0)', 'rgba(255, 255, 255, 0.15)'],
                }),
              } : {};

              return (
                <Animated.View key={key} style={[styles.paletteItem, animatedStyle]}>
                  <View style={styles.paletteReorder}>
                    <Pressable
                      onPress={() => handleMoveUp(key)}
                      disabled={isFirst}
                      style={[styles.reorderButton, isFirst && styles.reorderButtonDisabled]}
                    >
                      <ChevronUp size={18} color={isFirst ? 'rgba(255,255,255,0.2)' : '#FFFFFF'} />
                    </Pressable>
                    <Pressable
                      onPress={() => handleMoveDown(key)}
                      disabled={isLast}
                      style={[styles.reorderButton, isLast && styles.reorderButtonDisabled]}
                    >
                      <ChevronDown size={18} color={isLast ? 'rgba(255,255,255,0.2)' : '#FFFFFF'} />
                    </Pressable>
                  </View>

                  <View style={styles.paletteColors}>
                    {palette.colors.slice(0, 4).map((color, colorIndex) => (
                      <View
                        key={colorIndex}
                        style={[styles.colorDot, { backgroundColor: color.hex }]}
                      />
                    ))}
                  </View>

                  <View style={styles.paletteInfo}>
                    <Text style={[styles.paletteName, !isEnabled && styles.paletteNameDisabled]}>
                      {palette.name}
                    </Text>
                  </View>

                  <Switch
                    value={isEnabled}
                    onValueChange={() => handleTogglePalette(key)}
                    trackColor={{ false: 'rgba(255,255,255,0.1)', true: 'rgba(52, 199, 89, 0.5)' }}
                    thumbColor={isEnabled ? '#34C759' : '#f4f3f4'}
                  />
                </Animated.View>
              );
            })}
          </View>
        </View>

        {/* Subscription Status */}
        <View style={styles.statusCard}>
          <View style={styles.statusIconContainer}>
            <Crown size={28} color="#FFD700" strokeWidth={2} />
          </View>
          <View style={styles.statusTextContainer}>
            <Text style={styles.statusTitle}>Subscribed</Text>
          </View>
        </View>

        {/* Subscription Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Subscription</Text>

          <Pressable
            style={({ pressed }) => [
              styles.settingButton,
              pressed && styles.settingButtonPressed,
            ]}
            onPress={handleManageSubscription}
          >
            <View style={[styles.settingIcon, styles.settingIconGold]}>
              <Crown size={22} color="#FFD700" strokeWidth={2} />
            </View>
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingLabel}>Manage Subscription</Text>
              <Text style={styles.settingDescription}>
                View or cancel your subscription
              </Text>
            </View>
          </Pressable>
        </View>

        {/* App Data Section */}
        <View style={[styles.section, { paddingBottom: insets.bottom + 20 }]}>
          <Text style={styles.sectionTitle}>App Data</Text>

          <Pressable
            style={({ pressed }) => [
              styles.settingButton,
              pressed && styles.settingButtonPressed,
            ]}
            onPress={resetApp}
          >
            <View style={styles.settingIcon}>
              <RotateCcw size={22} color="#FF3B30" strokeWidth={2} />
            </View>
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingLabel}>Reset App</Text>
              <Text style={styles.settingDescription}>
                Clear all data and restart onboarding
              </Text>
            </View>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginBottom: 24,
  },
  statusIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  statusTextContainer: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.5)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  sectionDescription: {
    fontSize: 14,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.4)',
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  settingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  settingButtonPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 59, 48, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  settingIconGold: {
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
  },
  settingTextContainer: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  paletteList: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    overflow: 'hidden',
  },
  paletteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  paletteReorder: {
    marginRight: 8,
  },
  reorderButton: {
    padding: 2,
  },
  reorderButtonDisabled: {
    opacity: 0.3,
  },
  paletteColors: {
    flexDirection: 'row',
    marginRight: 12,
  },
  colorDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: -4,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.2)',
  },
  paletteInfo: {
    flex: 1,
  },
  paletteName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  paletteNameDisabled: {
    color: 'rgba(255, 255, 255, 0.4)',
  },
});

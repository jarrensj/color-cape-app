import { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Pressable, Alert, ScrollView, Switch, Animated, Modal, Share } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RotateCcw, Crown, ChevronUp, ChevronDown, Palette, X, Camera, FlipHorizontal, Share2 } from 'lucide-react-native';
import RevenueCatUI from 'react-native-purchases-ui';
import { useOnboarding } from '@/context/onboarding-context';
import { usePalettePreferences } from '@/context/palette-preferences-context';
import { colorPalettes, ColorPaletteKey } from '@/constants/palettes';

const CAMERA_SETTING_KEY = 'default_camera_facing';
const MIRROR_SETTING_KEY = 'mirror_front_camera';

export default function SettingsScreen() {
  const [showCustomerCenter, setShowCustomerCenter] = useState(false);
  const [showPaletteSheet, setShowPaletteSheet] = useState(false);
  const [highlightedKey, setHighlightedKey] = useState<ColorPaletteKey | null>(null);
  const [defaultFrontCamera, setDefaultFrontCamera] = useState(true);
  const [mirrorFrontCamera, setMirrorFrontCamera] = useState(true);
  const highlightAnim = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { setHasOnboarded } = useOnboarding();
  const { preferences, togglePalette, setAllEnabled, movePaletteUp, movePaletteDown, resetToDefaults } = usePalettePreferences();

  useEffect(() => {
    AsyncStorage.getItem(CAMERA_SETTING_KEY).then((value) => {
      if (value !== null) {
        setDefaultFrontCamera(value === 'front');
      }
    });
    AsyncStorage.getItem(MIRROR_SETTING_KEY).then((value) => {
      if (value !== null) {
        setMirrorFrontCamera(value === 'true');
      }
    });
  }, []);

  const handleToggleDefaultCamera = async (value: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setDefaultFrontCamera(value);
    await AsyncStorage.setItem(CAMERA_SETTING_KEY, value ? 'front' : 'back');
  };

  const handleToggleMirror = async (value: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMirrorFrontCamera(value);
    await AsyncStorage.setItem(MIRROR_SETTING_KEY, value ? 'true' : 'false');
  };

  const handleShareApp = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Share.share({
        message: 'Check out Color Cape - find your perfect color palette! Download it here: https://apps.apple.com/app/color-cape',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

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

  const allEnabled = preferences.order.every((key) => preferences.enabled[key]);

  const handleToggleAll = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAllEnabled(!allEnabled);
  };

  const handleResetPalettes = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    resetToDefaults();
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

      {/* Palette Bottom Sheet */}
      <Modal
        visible={showPaletteSheet}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPaletteSheet(false)}
      >
        <View style={styles.sheetOverlay}>
          <Pressable style={styles.sheetBackdrop} onPress={() => setShowPaletteSheet(false)} />
          <View style={[styles.sheetContent, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Cape Palettes</Text>
              <Pressable onPress={() => setShowPaletteSheet(false)} style={styles.sheetClose}>
                <X size={24} color="#FFFFFF" />
              </Pressable>
            </View>
            <Text style={styles.sheetDescription}>
              Toggle and reorder palettes for the camera
            </Text>

            <ScrollView style={styles.sheetScroll} showsVerticalScrollIndicator={false}>
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

              <View style={styles.paletteActions}>
                <Pressable
                  style={({ pressed }) => [
                    styles.actionButton,
                    pressed && styles.actionButtonPressed,
                  ]}
                  onPress={handleToggleAll}
                >
                  <Text style={styles.actionButtonText}>{allEnabled ? 'Disable All' : 'Enable All'}</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [
                    styles.actionButton,
                    pressed && styles.actionButtonPressed,
                  ]}
                  onPress={handleResetPalettes}
                >
                  <Text style={styles.actionButtonText}>Reset to Defaults</Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Cape Palettes Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Capes</Text>

          <Pressable
            style={({ pressed }) => [
              styles.settingButton,
              pressed && styles.settingButtonPressed,
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowPaletteSheet(true);
            }}
          >
            <View style={[styles.settingIcon, styles.settingIconPurple]}>
              <Palette size={22} color="#AF52DE" strokeWidth={2} />
            </View>
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingLabel}>Cape Palettes</Text>
              <Text style={styles.settingDescription}>
                {preferences.order.filter(k => preferences.enabled[k]).length} of {preferences.order.length} enabled
              </Text>
            </View>
          </Pressable>

          <View style={[styles.settingButton, styles.settingButtonWithSwitch]}>
            <View style={[styles.settingIcon, styles.settingIconBlue]}>
              <Camera size={22} color="#007AFF" strokeWidth={2} />
            </View>
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingLabel}>Default Front Camera</Text>
              <Text style={styles.settingDescription}>
                Use front camera when opening cape
              </Text>
            </View>
            <Switch
              value={defaultFrontCamera}
              onValueChange={handleToggleDefaultCamera}
              trackColor={{ false: 'rgba(255,255,255,0.1)', true: 'rgba(52, 199, 89, 0.5)' }}
              thumbColor={defaultFrontCamera ? '#34C759' : '#f4f3f4'}
            />
          </View>

          <View style={[styles.settingButton, styles.settingButtonWithSwitch]}>
            <View style={[styles.settingIcon, styles.settingIconTeal]}>
              <FlipHorizontal size={22} color="#5AC8FA" strokeWidth={2} />
            </View>
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingLabel}>Mirror Front Camera</Text>
              <Text style={styles.settingDescription}>
                Flip image like a mirror
              </Text>
            </View>
            <Switch
              value={mirrorFrontCamera}
              onValueChange={handleToggleMirror}
              trackColor={{ false: 'rgba(255,255,255,0.1)', true: 'rgba(52, 199, 89, 0.5)' }}
              thumbColor={mirrorFrontCamera ? '#34C759' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Share Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Share</Text>

          <Pressable
            style={({ pressed }) => [
              styles.settingButton,
              pressed && styles.settingButtonPressed,
            ]}
            onPress={handleShareApp}
          >
            <View style={[styles.settingIcon, styles.settingIconGreen]}>
              <Share2 size={22} color="#34C759" strokeWidth={2} />
            </View>
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingLabel}>Share with Friends</Text>
              <Text style={styles.settingDescription}>
                Spread the word about Color Cape
              </Text>
            </View>
          </Pressable>
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
        <View style={styles.section}>
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

        {/* App Version */}
        <View style={[styles.versionContainer, { paddingBottom: insets.bottom + 20 }]}>
          <Text style={styles.versionText}>Version 1.0.0-beta</Text>
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
  settingIconPurple: {
    backgroundColor: 'rgba(175, 82, 222, 0.15)',
  },
  settingIconBlue: {
    backgroundColor: 'rgba(0, 122, 255, 0.15)',
  },
  settingIconTeal: {
    backgroundColor: 'rgba(90, 200, 250, 0.15)',
  },
  settingIconGreen: {
    backgroundColor: 'rgba(52, 199, 89, 0.15)',
  },
  settingButtonWithSwitch: {
    marginTop: 12,
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
  paletteActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    marginBottom: 8,
  },
  actionButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
  },
  actionButtonPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  sheetOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sheetContent: {
    backgroundColor: '#1C1C1E',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
    paddingHorizontal: 16,
    maxHeight: '80%',
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
    marginBottom: 16,
  },
  sheetScroll: {
    flexGrow: 0,
  },
  versionContainer: {
    alignItems: 'center',
    paddingTop: 8,
  },
  versionText: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.3)',
  },
});

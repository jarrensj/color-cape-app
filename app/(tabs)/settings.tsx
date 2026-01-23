import { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Pressable, Alert, ScrollView, Switch, Animated, Modal, Share, Linking, TextInput } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RotateCcw, Crown, ChevronUp, ChevronDown, Palette, X, Camera, FlipHorizontal, Share2, Sparkles, RefreshCw, Shield, FileText, Plus, Trash2, Check } from 'lucide-react-native';
import RevenueCatUI from 'react-native-purchases-ui';
import { useOnboarding } from '@/context/onboarding-context';
import { usePalettePreferences } from '@/context/palette-preferences-context';
import { colorPalettes, ColorPaletteKey } from '@/constants/palettes';

const CAMERA_SETTING_KEY = 'default_camera_facing';
const MIRROR_SETTING_KEY = 'mirror_front_camera';
const OPACITY_SETTING_KEY = 'cape_opacity';
const SAVED_TEST_RESULT_KEY = 'saved_test_result';

const OPACITY_OPTIONS = [
  { label: 'Light', value: 0.5 },
  { label: 'Medium', value: 0.7 },
  { label: 'Strong', value: 0.85 },
  { label: 'Full', value: 1.0 },
];

const COLOR_COUNT_OPTIONS = [1, 2, 4, 8];

const COLOR_PICKER_COLORS = [
  // Reds & Pinks
  '#FF0000', '#E0115F', '#FF1493', '#FF69B4', '#FFB6C1', '#800020',
  // Oranges & Yellows
  '#FF4500', '#FF7F50', '#FF9500', '#FFD700', '#FFEF00', '#FFDB58',
  // Greens
  '#00FF00', '#7CFC00', '#228B22', '#556B2F', '#008080', '#40E0D0',
  // Blues
  '#00FFFF', '#87CEEB', '#4169E1', '#0000FF', '#001F3F', '#0F52BA',
  // Purples
  '#8B00FF', '#9966CC', '#800080', '#E6E6FA', '#AF8EDA', '#301934',
  // Neutrals
  '#FFFFFF', '#F5F5F5', '#D3D3D3', '#808080', '#404040', '#000000',
  // Browns & Earthy
  '#F5E6D3', '#C19A6B', '#B7410E', '#7B3F00', '#E2725B', '#8B8589',
];

export default function SettingsScreen() {
  const [showPaletteSheet, setShowPaletteSheet] = useState(false);
  const [showCustomCapeSheet, setShowCustomCapeSheet] = useState(false);
  const [highlightedKey, setHighlightedKey] = useState<ColorPaletteKey | null>(null);
  const [defaultFrontCamera, setDefaultFrontCamera] = useState(true);
  const [mirrorFrontCamera, setMirrorFrontCamera] = useState(true);
  const [capeOpacity, setCapeOpacity] = useState(0.85);
  const [customColorCount, setCustomColorCount] = useState(4);
  const [customColors, setCustomColors] = useState<string[]>(['#FF0000', '#00FF00', '#0000FF', '#FFD700']);
  const [editingColorIndex, setEditingColorIndex] = useState<number | null>(null);
  const [hexInput, setHexInput] = useState('');
  const [editingCapeId, setEditingCapeId] = useState<string | null>(null);
  const highlightAnim = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { setHasOnboarded } = useOnboarding();
  const { preferences, customCapes, togglePalette, setAllEnabled, movePaletteUp, movePaletteDown, resetToDefaults, resetCustomCapes, saveCustomCape, deleteCustomCape, toggleCustomCape, moveCustomCapeUp, moveCustomCapeDown, canAddCustomCape } = usePalettePreferences();

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
    AsyncStorage.getItem(OPACITY_SETTING_KEY).then((value) => {
      if (value !== null) {
        setCapeOpacity(parseFloat(value));
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

  const handleOpacityChange = async (value: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCapeOpacity(value);
    await AsyncStorage.setItem(OPACITY_SETTING_KEY, value.toString());
  };

  const resetSettings = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Reset Settings',
      'This will reset camera, cape settings, and delete custom capes. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.multiRemove([
              CAMERA_SETTING_KEY,
              MIRROR_SETTING_KEY,
              OPACITY_SETTING_KEY,
            ]);
            setDefaultFrontCamera(true);
            setMirrorFrontCamera(true);
            setCapeOpacity(0.85);
            resetToDefaults(); // Reset palette preferences
            resetCustomCapes(); // Delete custom capes
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ]
    );
  };

  const clearSavedTestResult = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Clear Saved Result',
      'This will remove your saved test result from the home screen. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem(SAVED_TEST_RESULT_KEY);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ]
    );
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

  const openPrivacyPolicy = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL('https://colorcape.app/privacy-policy');
  };

  const openTermsOfService = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL('https://colorcape.app/terms-of-service');
  };

  const openCustomCapeCreator = (capeId?: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const existingCape = capeId ? customCapes.find(c => c.id === capeId) : null;
    if (existingCape) {
      setEditingCapeId(existingCape.id);
      setCustomColorCount(existingCape.colors.length);
      setCustomColors(existingCape.colors.map(c => c.hex));
    } else {
      setEditingCapeId(null);
      setCustomColorCount(4);
      setCustomColors(['#FF0000', '#00FF00', '#0000FF', '#FFD700']);
    }
    setEditingColorIndex(null);
    setShowCustomCapeSheet(true);
  };

  const handleColorCountChange = (count: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCustomColorCount(count);
    // Adjust colors array
    const defaultColors = ['#FF0000', '#FF7F50', '#FFD700', '#00FF00', '#00FFFF', '#0000FF', '#8B00FF', '#FF1493'];
    const newColors = [...customColors];
    while (newColors.length < count) {
      newColors.push(defaultColors[newColors.length % defaultColors.length]);
    }
    setCustomColors(newColors.slice(0, count));
    setEditingColorIndex(null);
  };

  const handleColorSelect = (color: string) => {
    if (editingColorIndex !== null) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const newColors = [...customColors];
      newColors[editingColorIndex] = color;
      setCustomColors(newColors);
      setHexInput(color);
    }
  };

  const handleHexInputChange = (text: string) => {
    // Ensure it starts with # and only contains valid hex chars
    let hex = text.toUpperCase();
    if (!hex.startsWith('#')) {
      hex = '#' + hex;
    }
    hex = '#' + hex.slice(1).replace(/[^0-9A-F]/g, '').slice(0, 6);
    setHexInput(hex);

    // Apply color if valid 4 or 7 character hex (# + 3 or 6 chars)
    if (editingColorIndex !== null && (hex.length === 4 || hex.length === 7)) {
      const newColors = [...customColors];
      newColors[editingColorIndex] = hex;
      setCustomColors(newColors);
    }
  };

  const handleColorSlotPress = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (editingColorIndex === index) {
      setEditingColorIndex(null);
      setHexInput('');
    } else {
      setEditingColorIndex(index);
      setHexInput(customColors[index]);
    }
  };

  const handleSaveCustomCape = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const existingCape = editingCapeId ? customCapes.find(c => c.id === editingCapeId) : null;
    const capeNumber = existingCape
      ? customCapes.findIndex(c => c.id === editingCapeId) + 1
      : customCapes.length + 1;
    const cape = {
      ...(editingCapeId && { id: editingCapeId }),
      name: `Custom Cape ${capeNumber}`,
      colors: customColors.slice(0, customColorCount).map((hex, i) => ({
        name: `Color ${i + 1}`,
        hex,
      })),
      enabled: existingCape?.enabled ?? true,
      position: existingCape?.position ?? 0,
    };
    saveCustomCape(cape);
    setShowCustomCapeSheet(false);
    setEditingCapeId(null);
  };

  const handleDeleteCustomCape = (capeId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Delete Custom Cape',
      'Are you sure you want to delete this custom cape?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteCustomCape(capeId);
            setShowCustomCapeSheet(false);
            setEditingCapeId(null);
          },
        },
      ]
    );
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

  const handleLogOut = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    Alert.alert(
      'Log Out',
      'This will clear all your data and return to the start. Are you sure?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Log Out',
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

  const handleManageSubscription = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await RevenueCatUI.presentCustomerCenter();
    } catch (error) {
      console.error('Error presenting customer center:', error);
      Alert.alert(
        'Unable to Open',
        'Could not open subscription management. Please try again or manage your subscription in Settings > Apple ID > Subscriptions.'
      );
    }
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
                {(() => {
                  // Build combined list with custom capes at their positions
                  type ListItem = { type: 'custom'; cape: typeof customCapes[0] } | { type: 'palette'; key: ColorPaletteKey };
                  const items: ListItem[] = preferences.order.map(key => ({ type: 'palette' as const, key }));

                  // Insert custom capes at their positions (sorted by position descending to avoid index shifts)
                  const sortedCustomCapes = [...customCapes].sort((a, b) => b.position - a.position);
                  sortedCustomCapes.forEach(cape => {
                    const pos = Math.min(cape.position, items.length);
                    items.splice(pos, 0, { type: 'custom', cape });
                  });

                  const totalItems = items.length;

                  return items.map((item, index) => {
                    const isFirst = index === 0;
                    const isLast = index === totalItems - 1;

                    if (item.type === 'custom') {
                      const customCape = item.cape;
                      return (
                        <View key={customCape.id} style={styles.paletteItem}>
                          <View style={styles.paletteReorder}>
                            <Pressable
                              onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                moveCustomCapeUp(customCape.id);
                              }}
                              disabled={isFirst}
                              style={[styles.reorderButton, isFirst && styles.reorderButtonDisabled]}
                            >
                              <ChevronUp size={18} color={isFirst ? 'rgba(255,255,255,0.2)' : '#FFFFFF'} />
                            </Pressable>
                            <Pressable
                              onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                moveCustomCapeDown(customCape.id);
                              }}
                              disabled={isLast}
                              style={[styles.reorderButton, isLast && styles.reorderButtonDisabled]}
                            >
                              <ChevronDown size={18} color={isLast ? 'rgba(255,255,255,0.2)' : '#FFFFFF'} />
                            </Pressable>
                          </View>

                          <View style={styles.paletteColors}>
                            {customCape.colors.slice(0, 4).map((color, colorIndex) => (
                              <View
                                key={colorIndex}
                                style={[styles.colorDot, { backgroundColor: color.hex }]}
                              />
                            ))}
                          </View>

                          <View style={styles.paletteInfo}>
                            <Text style={[styles.paletteName, !customCape.enabled && styles.paletteNameDisabled]}>
                              {customCape.name}
                            </Text>
                          </View>

                          <Switch
                            value={customCape.enabled}
                            onValueChange={() => {
                              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                              toggleCustomCape(customCape.id);
                            }}
                            trackColor={{ false: 'rgba(255,255,255,0.1)', true: 'rgba(52, 199, 89, 0.5)' }}
                            thumbColor={customCape.enabled ? '#34C759' : '#f4f3f4'}
                          />
                        </View>
                      );
                    }

                    if (item.type === 'palette') {
                      const key = item.key;
                      const palette = colorPalettes[key];
                      const isEnabled = preferences.enabled[key];

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
                    }
                    return null;
                  });
                })()}
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

      {/* Custom Cape Creator Modal */}
      <Modal
        visible={showCustomCapeSheet}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCustomCapeSheet(false)}
      >
        <View style={styles.sheetOverlay}>
          <Pressable style={styles.sheetBackdrop} onPress={() => setShowCustomCapeSheet(false)} />
          <View style={[styles.sheetContent, { paddingBottom: insets.bottom + 20, maxHeight: '90%' }]}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{editingCapeId ? 'Edit Custom Cape' : 'Create Custom Cape'}</Text>
              <Pressable onPress={() => { setShowCustomCapeSheet(false); setEditingCapeId(null); }} style={styles.sheetClose}>
                <X size={24} color="#FFFFFF" />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Color Count Selector */}
              <Text style={styles.customCapeLabel}>Number of Colors</Text>
              <View style={styles.colorCountSelector}>
                {COLOR_COUNT_OPTIONS.map((count) => (
                  <Pressable
                    key={count}
                    style={[
                      styles.colorCountButton,
                      customColorCount === count && styles.colorCountButtonActive,
                    ]}
                    onPress={() => handleColorCountChange(count)}
                  >
                    <Text
                      style={[
                        styles.colorCountButtonText,
                        customColorCount === count && styles.colorCountButtonTextActive,
                      ]}
                    >
                      {count}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* Preview - tap to edit colors */}
              <Text style={styles.customCapeLabel}>Tap a color to edit</Text>
              <View style={styles.capePreview}>
                {customColors.slice(0, customColorCount).map((color, index) => (
                  <Pressable
                    key={index}
                    style={[
                      styles.capePreviewSegment,
                      { backgroundColor: color },
                      editingColorIndex === index && styles.capePreviewSegmentEditing,
                    ]}
                    onPress={() => handleColorSlotPress(index)}
                  />
                ))}
              </View>

              {/* Color Picker */}
              {editingColorIndex !== null && (
                <>
                  <Text style={styles.customCapeLabel}>Enter Hex Code</Text>
                  <View style={styles.hexInputContainer}>
                    <View style={[styles.hexPreview, { backgroundColor: hexInput.length >= 4 ? hexInput : '#000' }]} />
                    <TextInput
                      style={styles.hexInput}
                      value={hexInput}
                      onChangeText={handleHexInputChange}
                      placeholder="#FFFFFF"
                      placeholderTextColor="rgba(255,255,255,0.3)"
                      autoCapitalize="characters"
                      maxLength={7}
                    />
                  </View>

                  <Text style={styles.customCapeLabel}>Or Pick a Color</Text>
                  <View style={styles.colorPickerGrid}>
                    {COLOR_PICKER_COLORS.map((color) => (
                      <Pressable
                        key={color}
                        style={[
                          styles.colorPickerItem,
                          { backgroundColor: color },
                          customColors[editingColorIndex] === color && styles.colorPickerItemSelected,
                        ]}
                        onPress={() => handleColorSelect(color)}
                      />
                    ))}
                  </View>
                </>
              )}

              {/* Action Buttons */}
              <View style={styles.customCapeActions}>
                {editingCapeId && (
                  <Pressable
                    style={[styles.customCapeButton, styles.customCapeButtonDelete]}
                    onPress={() => handleDeleteCustomCape(editingCapeId)}
                  >
                    <Trash2 size={18} color="#FF3B30" strokeWidth={2} />
                    <Text style={styles.customCapeButtonDeleteText}>Delete</Text>
                  </Pressable>
                )}
                <Pressable
                  style={[styles.customCapeButton, styles.customCapeButtonSave]}
                  onPress={handleSaveCustomCape}
                >
                  <Check size={18} color="#000000" strokeWidth={2} />
                  <Text style={styles.customCapeButtonSaveText}>Save Cape</Text>
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
                {preferences.order.filter(k => preferences.enabled[k]).length + customCapes.filter(c => c.enabled).length} of {preferences.order.length + customCapes.length} enabled
              </Text>
            </View>
          </Pressable>

          {/* List existing custom capes */}
          {customCapes.map((cape, index) => (
            <Pressable
              key={cape.id}
              style={({ pressed }) => [
                styles.settingButton,
                styles.settingButtonMarginTop,
                pressed && styles.settingButtonPressed,
              ]}
              onPress={() => openCustomCapeCreator(cape.id)}
            >
              <View style={[styles.settingIcon, styles.settingIconCyan]}>
                <Palette size={22} color="#5AC8FA" strokeWidth={2} />
              </View>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingLabel}>{cape.name}</Text>
                <Text style={styles.settingDescription}>
                  {cape.colors.length} colors • Tap to edit
                </Text>
              </View>
            </Pressable>
          ))}

          {/* Create new custom cape button - only show if under limit */}
          {canAddCustomCape() && (
            <Pressable
              style={({ pressed }) => [
                styles.settingButton,
                styles.settingButtonMarginTop,
                pressed && styles.settingButtonPressed,
              ]}
              onPress={() => openCustomCapeCreator()}
            >
              <View style={[styles.settingIcon, styles.settingIconCyan]}>
                <Plus size={22} color="#5AC8FA" strokeWidth={2} />
              </View>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingLabel}>Create Custom Cape</Text>
                <Text style={styles.settingDescription}>
                  Design your own color palette ({customCapes.length}/3)
                </Text>
              </View>
            </Pressable>
          )}
        </View>

        {/* Camera Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Camera</Text>

          <View style={[styles.settingButton]}>
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

          <View style={[styles.settingButton, styles.settingButtonMarginTop]}>
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

        {/* Cape Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cape</Text>

          <View style={styles.settingButton}>
            <View style={[styles.settingIcon, styles.settingIconOrange]}>
              <Sparkles size={22} color="#FF9500" strokeWidth={2} />
            </View>
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingLabel}>Cape Opacity</Text>
              <Text style={styles.settingDescription}>
                How visible the color overlay appears
              </Text>
            </View>
          </View>
          <View style={styles.opacitySelector}>
            {OPACITY_OPTIONS.map((option) => (
              <Pressable
                key={option.value}
                style={[
                  styles.opacityButton,
                  capeOpacity === option.value && styles.opacityButtonActive,
                ]}
                onPress={() => handleOpacityChange(option.value)}
              >
                <Text
                  style={[
                    styles.opacityButtonText,
                    capeOpacity === option.value && styles.opacityButtonTextActive,
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            ))}
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
            onPress={clearSavedTestResult}
          >
            <View style={[styles.settingIcon, styles.settingIconPurple]}>
              <Trash2 size={22} color="#AF52DE" strokeWidth={2} />
            </View>
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingLabel}>Clear Saved Test Result</Text>
              <Text style={styles.settingDescription}>
                Remove your saved seasonal color result
              </Text>
            </View>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.settingButton,
              styles.settingButtonMarginTop,
              pressed && styles.settingButtonPressed,
            ]}
            onPress={resetSettings}
          >
            <View style={styles.settingIcon}>
              <RefreshCw size={22} color="#FF3B30" strokeWidth={2} />
            </View>
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingLabel}>Reset Settings</Text>
              <Text style={styles.settingDescription}>
                Restore camera and cape settings to defaults
              </Text>
            </View>
          </Pressable>
        </View>

        {/* Log Out */}
        <Pressable
          style={({ pressed }) => [
            styles.logOutButton,
            pressed && styles.logOutButtonPressed,
          ]}
          onPress={handleLogOut}
        >
          <Text style={styles.logOutText}>Log Out</Text>
        </Pressable>

        {/* Legal Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Legal</Text>

          <Pressable
            style={({ pressed }) => [
              styles.settingButton,
              pressed && styles.settingButtonPressed,
            ]}
            onPress={openPrivacyPolicy}
          >
            <View style={[styles.settingIcon, styles.settingIconGray]}>
              <Shield size={22} color="#8E8E93" strokeWidth={2} />
            </View>
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingLabel}>Privacy Policy</Text>
            </View>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.settingButton,
              styles.settingButtonMarginTop,
              pressed && styles.settingButtonPressed,
            ]}
            onPress={openTermsOfService}
          >
            <View style={[styles.settingIcon, styles.settingIconGray]}>
              <FileText size={22} color="#8E8E93" strokeWidth={2} />
            </View>
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingLabel}>Terms of Service</Text>
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
  settingIconOrange: {
    backgroundColor: 'rgba(255, 149, 0, 0.15)',
  },
  settingIconGray: {
    backgroundColor: 'rgba(142, 142, 147, 0.15)',
  },
  opacitySelector: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  opacityButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
  },
  opacityButtonActive: {
    backgroundColor: 'rgba(255, 149, 0, 0.3)',
  },
  opacityButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  opacityButtonTextActive: {
    color: '#FF9500',
  },
  settingButtonMarginTop: {
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
  logOutButton: {
    alignItems: 'center',
    paddingVertical: 16,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  logOutButtonPressed: {
    opacity: 0.6,
  },
  logOutText: {
    fontSize: 17,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  settingIconCyan: {
    backgroundColor: 'rgba(90, 200, 250, 0.15)',
  },
  customCapeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 20,
    marginBottom: 8,
  },
  customCapeSublabel: {
    fontSize: 12,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.4)',
    marginTop: -4,
    marginBottom: 12,
  },
  colorCountSelector: {
    flexDirection: 'row',
    gap: 10,
  },
  colorCountButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
  },
  colorCountButtonActive: {
    backgroundColor: 'rgba(90, 200, 250, 0.3)',
  },
  colorCountButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  colorCountButtonTextActive: {
    color: '#5AC8FA',
  },
  colorSlotsContainer: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
  },
  colorSlot: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorSlotEditing: {
    borderColor: '#FFFFFF',
    borderWidth: 3,
  },
  hexInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 12,
  },
  hexPreview: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  hexInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'monospace',
    paddingVertical: 8,
  },
  colorPickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  colorPickerItem: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  colorPickerItemSelected: {
    borderColor: '#FFFFFF',
    borderWidth: 3,
  },
  capePreview: {
    flexDirection: 'row',
    height: 60,
    borderRadius: 12,
    overflow: 'hidden',
  },
  capePreviewSegment: {
    flex: 1,
  },
  capePreviewSegmentEditing: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  customCapeActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    marginBottom: 8,
  },
  customCapeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  customCapeButtonDelete: {
    backgroundColor: 'rgba(255, 59, 48, 0.15)',
  },
  customCapeButtonDeleteText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF3B30',
  },
  customCapeButtonSave: {
    backgroundColor: '#FFFFFF',
  },
  customCapeButtonSaveText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
});

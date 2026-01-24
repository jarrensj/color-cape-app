import { useState, useRef } from 'react';
import { StyleSheet, View, Text, Pressable, Alert, ScrollView, Switch, Animated, Modal, TextInput } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ChevronLeft, ChevronUp, ChevronDown, X, Plus, Trash2, Check } from 'lucide-react-native';
import { usePalettePreferences } from '@/context/palette-preferences-context';
import { colorPalettes, ColorPaletteKey } from '@/constants/palettes';
import ColorPickerModal from '@/components/ColorPickerModal';

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

export default function CustomizeScreen() {
  const [showCustomCapeSheet, setShowCustomCapeSheet] = useState(false);
  const [highlightedKey, setHighlightedKey] = useState<ColorPaletteKey | null>(null);
  const [customColorCount, setCustomColorCount] = useState(4);
  const [customColors, setCustomColors] = useState<string[]>(['#FF0000', '#00FF00', '#0000FF', '#FFD700']);
  const [editingColorIndex, setEditingColorIndex] = useState<number | null>(null);
  const [hexInput, setHexInput] = useState('');
  const [editingCapeId, setEditingCapeId] = useState<string | null>(null);
  const [capeName, setCapeName] = useState('');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const highlightAnim = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    preferences,
    customCapes,
    togglePalette,
    setAllEnabled,
    movePaletteUp,
    movePaletteDown,
    resetToDefaults,
    saveCustomCape,
    deleteCustomCape,
    toggleCustomCape,
    moveCustomCapeUp,
    moveCustomCapeDown,
    canAddCustomCape,
    getDefaultCapeName
  } = usePalettePreferences();

  const goBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const openCustomCapeCreator = (capeId?: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const existingCape = capeId ? customCapes.find(c => c.id === capeId) : null;
    if (existingCape) {
      setEditingCapeId(existingCape.id);
      setCustomColorCount(existingCape.colors.length);
      setCustomColors(existingCape.colors.map(c => c.hex));
      setCapeName(existingCape.name);
    } else {
      setEditingCapeId(null);
      setCustomColorCount(4);
      setCustomColors(['#FF0000', '#00FF00', '#0000FF', '#FFD700']);
      setCapeName(getDefaultCapeName());
    }
    setEditingColorIndex(null);
    setShowCustomCapeSheet(true);
  };

  const handleColorCountChange = (count: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCustomColorCount(count);
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

  const handleVisualPickerSelect = (color: string) => {
    if (editingColorIndex !== null) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const newColors = [...customColors];
      newColors[editingColorIndex] = color;
      setCustomColors(newColors);
      setHexInput(color);
    }
  };

  const openVisualPicker = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowColorPicker(true);
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
    const cape = {
      ...(editingCapeId && { id: editingCapeId }),
      name: capeName.trim() || getDefaultCapeName(),
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
    Alert.alert(
      'Reset Palettes',
      'This will reset all palette settings to defaults. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: resetToDefaults },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Custom Cape Creator Modal */}
      <Modal
        visible={showCustomCapeSheet}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCustomCapeSheet(false)}
      >
        <View style={[styles.sheetOverlay, { paddingTop: insets.top }]}>
          <View style={[styles.sheetContent, { paddingBottom: insets.bottom + 20, flex: 1 }]}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{editingCapeId ? 'Edit Custom Cape' : 'Create Custom Cape'}</Text>
              <Pressable onPress={() => { setShowCustomCapeSheet(false); setEditingCapeId(null); }} style={styles.sheetClose}>
                <X size={24} color="#FFFFFF" />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.customCapeLabel}>Cape Name</Text>
              <TextInput
                style={styles.capeNameInput}
                value={capeName}
                onChangeText={setCapeName}
                placeholder="Enter cape name"
                placeholderTextColor="rgba(255,255,255,0.3)"
                autoCorrect={false}
                maxLength={30}
              />

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

              {editingColorIndex !== null && (
                <>
                  <Text style={styles.customCapeLabel}>Choose Color</Text>
                  <Pressable style={styles.hexInputContainer} onPress={openVisualPicker}>
                    <View style={[styles.hexPreview, { backgroundColor: hexInput.length >= 4 ? hexInput : '#000' }]} />
                    <Text style={styles.hexDisplayText}>{hexInput || 'Tap to pick color'}</Text>
                  </Pressable>

                  <Text style={styles.customCapeLabelSmall}>Quick Colors</Text>
                  <View style={styles.colorPickerGridSmall}>
                    {COLOR_PICKER_COLORS.map((color) => (
                      <Pressable
                        key={color}
                        style={[
                          styles.colorPickerItemSmall,
                          { backgroundColor: color },
                          customColors[editingColorIndex] === color && styles.colorPickerItemSmallSelected,
                        ]}
                        onPress={() => handleColorSelect(color)}
                      />
                    ))}
                  </View>
                </>
              )}

              <ColorPickerModal
                visible={showColorPicker}
                initialColor={hexInput || '#FF0000'}
                onClose={() => setShowColorPicker(false)}
                onSelect={handleVisualPickerSelect}
              />

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

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable style={styles.backButton} onPress={goBack}>
          <ChevronLeft size={28} color="#FFFFFF" strokeWidth={2} />
        </Pressable>
        <Text style={styles.title}>Customize Capes</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Custom Capes Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Custom Capes</Text>
          <Text style={styles.sectionDescription}>Create your own color cape palettes</Text>

          {customCapes.map((cape) => (
            <Pressable
              key={cape.id}
              style={({ pressed }) => [
                styles.customCapeItem,
                pressed && styles.customCapeItemPressed,
              ]}
              onPress={() => openCustomCapeCreator(cape.id)}
            >
              <View style={styles.capeColors}>
                {cape.colors.slice(0, 4).map((color, index) => (
                  <View
                    key={index}
                    style={[styles.colorDot, { backgroundColor: color.hex }]}
                  />
                ))}
              </View>
              <View style={styles.capeInfo}>
                <Text style={styles.capeName}>{cape.name}</Text>
                <Text style={styles.capeDescription}>{cape.colors.length} colors</Text>
              </View>
              <Switch
                value={cape.enabled}
                onValueChange={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  toggleCustomCape(cape.id);
                }}
                trackColor={{ false: 'rgba(255,255,255,0.1)', true: 'rgba(52, 199, 89, 0.5)' }}
                thumbColor={cape.enabled ? '#34C759' : '#f4f3f4'}
              />
            </Pressable>
          ))}

          {canAddCustomCape() && (
            <Pressable
              style={({ pressed }) => [
                styles.createButton,
                pressed && styles.createButtonPressed,
              ]}
              onPress={() => openCustomCapeCreator()}
            >
              <Plus size={20} color="#5AC8FA" strokeWidth={2} />
              <Text style={styles.createButtonText}>Create Custom Cape ({customCapes.length}/5)</Text>
            </Pressable>
          )}
        </View>

        {/* All Palettes Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>All Palettes</Text>
          <Text style={styles.sectionDescription}>Toggle and reorder your capes</Text>

          <View style={styles.paletteList}>
            {(() => {
              type ListItem = { type: 'custom'; cape: typeof customCapes[0] } | { type: 'palette'; key: ColorPaletteKey };
              const items: ListItem[] = preferences.order.map(key => ({ type: 'palette' as const, key }));

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
                            style={[styles.paletteColorDot, { backgroundColor: color.hex }]}
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
                            style={[styles.paletteColorDot, { backgroundColor: color.hex }]}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 40,
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
    marginBottom: 4,
    paddingHorizontal: 8,
  },
  sectionDescription: {
    fontSize: 14,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.4)',
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  customCapeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  customCapeItemPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  capeColors: {
    flexDirection: 'row',
    marginRight: 12,
  },
  colorDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: -6,
    borderWidth: 2,
    borderColor: 'rgba(0, 0, 0, 0.3)',
  },
  capeInfo: {
    flex: 1,
  },
  capeName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  capeDescription: {
    fontSize: 14,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 2,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(90, 200, 250, 0.15)',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  createButtonPressed: {
    backgroundColor: 'rgba(90, 200, 250, 0.25)',
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#5AC8FA',
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
  paletteColorDot: {
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
    backgroundColor: '#1C1C1E',
  },
  sheetContent: {
    flex: 1,
    paddingTop: 16,
    paddingHorizontal: 16,
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
  customCapeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 20,
    marginBottom: 8,
  },
  capeNameInput: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  customCapeLabelSmall: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 16,
    marginBottom: 6,
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
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  hexDisplayText: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'monospace',
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
  colorPickerGridSmall: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    justifyContent: 'center',
  },
  colorPickerItemSmall: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  colorPickerItemSmallSelected: {
    borderColor: '#FFFFFF',
    borderWidth: 2,
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

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Modal,
  PanResponder,
  Dimensions,
} from 'react-native';
import { X, Check } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const PICKER_SIZE = Dimensions.get('window').width - 64;
const HUE_BAR_HEIGHT = 28;

// Convert HSV to RGB
function hsvToRgb(h: number, s: number, v: number): [number, number, number] {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;

  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; b = 0; }
  else if (h < 120) { r = x; g = c; b = 0; }
  else if (h < 180) { r = 0; g = c; b = x; }
  else if (h < 240) { r = 0; g = x; b = c; }
  else if (h < 300) { r = x; g = 0; b = c; }
  else { r = c; g = 0; b = x; }

  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255),
  ];
}

// Convert RGB to Hex
function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('').toUpperCase();
}

// Convert Hex to RGB
function hexToRgb(hex: string): [number, number, number] | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    // Try 3-digit hex
    const short = /^#?([a-f\d])([a-f\d])([a-f\d])$/i.exec(hex);
    if (short) {
      return [
        parseInt(short[1] + short[1], 16),
        parseInt(short[2] + short[2], 16),
        parseInt(short[3] + short[3], 16),
      ];
    }
    return null;
  }
  return [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16),
  ];
}

// Convert RGB to HSV
function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;

  let h = 0;
  const s = max === 0 ? 0 : d / max;
  const v = max;

  if (max !== min) {
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) * 60; break;
      case g: h = ((b - r) / d + 2) * 60; break;
      case b: h = ((r - g) / d + 4) * 60; break;
    }
  }

  return [h, s, v];
}

type ColorPickerModalProps = {
  visible: boolean;
  initialColor: string;
  onClose: () => void;
  onSelect: (color: string) => void;
};

export default function ColorPickerModal({
  visible,
  initialColor,
  onClose,
  onSelect,
}: ColorPickerModalProps) {
  const [hue, setHue] = useState(0);
  const [saturation, setSaturation] = useState(1);
  const [value, setValue] = useState(1);

  useEffect(() => {
    if (visible && initialColor) {
      const rgb = hexToRgb(initialColor);
      if (rgb) {
        const [h, s, v] = rgbToHsv(...rgb);
        setHue(h);
        setSaturation(s);
        setValue(v);
      }
    }
  }, [visible, initialColor]);

  const currentRgb = hsvToRgb(hue, saturation, value);
  const currentHex = rgbToHex(...currentRgb);
  const pureHueRgb = hsvToRgb(hue, 1, 1);
  const pureHueHex = rgbToHex(...pureHueRgb);

  const svPanResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (evt) => {
      handleSVChange(evt.nativeEvent.locationX, evt.nativeEvent.locationY);
    },
    onPanResponderMove: (evt) => {
      handleSVChange(evt.nativeEvent.locationX, evt.nativeEvent.locationY);
    },
  });

  const huePanResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (evt) => {
      handleHueChange(evt.nativeEvent.locationX);
    },
    onPanResponderMove: (evt) => {
      handleHueChange(evt.nativeEvent.locationX);
    },
  });

  const handleSVChange = (x: number, y: number) => {
    const s = Math.max(0, Math.min(1, x / PICKER_SIZE));
    const v = Math.max(0, Math.min(1, 1 - y / PICKER_SIZE));
    setSaturation(s);
    setValue(v);
  };

  const handleHueChange = (x: number) => {
    const h = Math.max(0, Math.min(360, (x / PICKER_SIZE) * 360));
    setHue(h);
  };

  const handleConfirm = () => {
    onSelect(currentHex);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Pick a Color</Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#FFFFFF" />
            </Pressable>
          </View>

          {/* Saturation/Value Picker */}
          <View
            style={[styles.svPicker, { backgroundColor: pureHueHex }]}
            {...svPanResponder.panHandlers}
          >
            <LinearGradient
              colors={['#FFFFFF', 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
            <LinearGradient
              colors={['transparent', '#000000']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            {/* Picker cursor */}
            <View
              style={[
                styles.svCursor,
                {
                  left: saturation * PICKER_SIZE - 12,
                  top: (1 - value) * PICKER_SIZE - 12,
                },
              ]}
            />
          </View>

          {/* Hue Bar */}
          <View style={styles.hueBar} {...huePanResponder.panHandlers}>
            <LinearGradient
              colors={[
                '#FF0000',
                '#FFFF00',
                '#00FF00',
                '#00FFFF',
                '#0000FF',
                '#FF00FF',
                '#FF0000',
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.hueGradient}
            />
            {/* Hue cursor */}
            <View
              style={[
                styles.hueCursor,
                { left: (hue / 360) * PICKER_SIZE - 3 },
              ]}
            />
          </View>

          {/* Preview and Hex */}
          <View style={styles.previewRow}>
            <View style={[styles.preview, { backgroundColor: currentHex }]} />
            <Text style={styles.hexText}>{currentHex}</Text>
          </View>

          {/* Actions */}
          <Pressable style={styles.confirmButton} onPress={handleConfirm}>
            <Check size={20} color="#000000" strokeWidth={2} />
            <Text style={styles.confirmText}>Select Color</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  container: {
    backgroundColor: '#1C1C1E',
    borderRadius: 20,
    padding: 20,
    width: PICKER_SIZE + 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  closeButton: {
    padding: 4,
  },
  svPicker: {
    width: PICKER_SIZE,
    height: PICKER_SIZE,
    borderRadius: 12,
    overflow: 'hidden',
  },
  svCursor: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    backgroundColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 3,
  },
  hueBar: {
    width: PICKER_SIZE,
    height: HUE_BAR_HEIGHT,
    borderRadius: 14,
    marginTop: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  hueGradient: {
    flex: 1,
  },
  hueCursor: {
    position: 'absolute',
    top: -2,
    width: 6,
    height: HUE_BAR_HEIGHT + 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 3,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 12,
  },
  preview: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  hexText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'monospace',
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 16,
    gap: 8,
  },
  confirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
});

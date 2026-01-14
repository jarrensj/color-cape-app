import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useState, useRef } from 'react';
import { StyleSheet, TouchableOpacity, View, Text, Dimensions, ScrollView, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RotateCw } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Svg, { Polygon } from 'react-native-svg';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const colorPalettes = {
  lightSpring: {
    name: 'Light Spring',
    description: 'Light, warm, and fresh',
    colors: [
      { name: 'Peach', hex: '#FFCC99' },
      { name: 'Light Coral', hex: '#F08080' },
      { name: 'Buttercup', hex: '#F9E547' },
      { name: 'Mint', hex: '#98FB98' },
      { name: 'Sky Blue', hex: '#87CEEB' },
      { name: 'Lavender', hex: '#E6E6FA' },
      { name: 'Warm Pink', hex: '#FFB6C1' },
      { name: 'Ivory', hex: '#FFFFF0' },
    ],
  },
  warmSpring: {
    name: 'Warm Spring',
    description: 'Golden, vibrant, and sunny',
    colors: [
      { name: 'Coral', hex: '#FF7F50' },
      { name: 'Tangerine', hex: '#FF9966' },
      { name: 'Golden Yellow', hex: '#FFD700' },
      { name: 'Grass Green', hex: '#7CFC00' },
      { name: 'Turquoise', hex: '#40E0D0' },
      { name: 'Salmon', hex: '#FA8072' },
      { name: 'Apricot', hex: '#FBCEB1' },
      { name: 'Warm White', hex: '#FFF8F0' },
    ],
  },
  brightSpring: {
    name: 'Bright Spring',
    description: 'Clear, warm, and vivid',
    colors: [
      { name: 'Bright Coral', hex: '#FF6B6B' },
      { name: 'Orange Red', hex: '#FF4500' },
      { name: 'Bright Yellow', hex: '#FFEF00' },
      { name: 'Kelly Green', hex: '#4CBB17' },
      { name: 'Aqua', hex: '#00FFFF' },
      { name: 'Hot Pink', hex: '#FF69B4' },
      { name: 'Electric Blue', hex: '#7DF9FF' },
      { name: 'Pure White', hex: '#FFFFFF' },
    ],
  },
  lightSummer: {
    name: 'Light Summer',
    description: 'Soft, cool, and delicate',
    colors: [
      { name: 'Powder Pink', hex: '#FFB6C1' },
      { name: 'Rose', hex: '#E8ADAA' },
      { name: 'Lavender', hex: '#B4A7D6' },
      { name: 'Periwinkle', hex: '#CCCCFF' },
      { name: 'Powder Blue', hex: '#B0E0E6' },
      { name: 'Sage', hex: '#B2AC88' },
      { name: 'Mauve', hex: '#E0B0FF' },
      { name: 'Soft White', hex: '#F5F5F5' },
    ],
  },
  coolSummer: {
    name: 'Cool Summer',
    description: 'Cool, soft, and elegant',
    colors: [
      { name: 'Dusty Rose', hex: '#D8B0B0' },
      { name: 'Raspberry', hex: '#E30B5C' },
      { name: 'Soft Plum', hex: '#8E4585' },
      { name: 'Blue Gray', hex: '#6699CC' },
      { name: 'Teal', hex: '#367588' },
      { name: 'Cool Pink', hex: '#E75480' },
      { name: 'Slate Blue', hex: '#6A5ACD' },
      { name: 'Cocoa', hex: '#875F5F' },
    ],
  },
  softSummer: {
    name: 'Soft Summer',
    description: 'Muted, cool, and gentle',
    colors: [
      { name: 'Dusty Pink', hex: '#D4A5A5' },
      { name: 'Soft Red', hex: '#CD5C5C' },
      { name: 'Mauve', hex: '#AF8EDA' },
      { name: 'Soft Blue', hex: '#6B8CAE' },
      { name: 'Gray Green', hex: '#7BA99F' },
      { name: 'Taupe', hex: '#8B8589' },
      { name: 'Plum', hex: '#8E4585' },
      { name: 'Off White', hex: '#FAF0E6' },
    ],
  },
  softAutumn: {
    name: 'Soft Autumn',
    description: 'Muted, warm, and earthy',
    colors: [
      { name: 'Camel', hex: '#C19A6B' },
      { name: 'Terracotta', hex: '#E2725B' },
      { name: 'Soft Olive', hex: '#808000' },
      { name: 'Dusty Teal', hex: '#5F9EA0' },
      { name: 'Warm Gray', hex: '#A89F91' },
      { name: 'Soft Coral', hex: '#F88379' },
      { name: 'Mushroom', hex: '#9F8170' },
      { name: 'Cream', hex: '#F5E6D3' },
    ],
  },
  warmAutumn: {
    name: 'Warm Autumn',
    description: 'Rich, warm, and spicy',
    colors: [
      { name: 'Rust', hex: '#B7410E' },
      { name: 'Pumpkin', hex: '#FF7518' },
      { name: 'Gold', hex: '#D4AF37' },
      { name: 'Olive', hex: '#556B2F' },
      { name: 'Teal', hex: '#008080' },
      { name: 'Warm Brown', hex: '#704214' },
      { name: 'Burnt Orange', hex: '#CC5500' },
      { name: 'Buff', hex: '#F0DC82' },
    ],
  },
  deepAutumn: {
    name: 'Deep Autumn',
    description: 'Deep, warm, and intense',
    colors: [
      { name: 'Burgundy', hex: '#800020' },
      { name: 'Deep Orange', hex: '#CC5500' },
      { name: 'Bronze', hex: '#CD7F32' },
      { name: 'Forest Green', hex: '#228B22' },
      { name: 'Deep Teal', hex: '#004953' },
      { name: 'Chocolate', hex: '#7B3F00' },
      { name: 'Deep Plum', hex: '#662D4E' },
      { name: 'Mahogany', hex: '#C04000' },
    ],
  },
  deepWinter: {
    name: 'Deep Winter',
    description: 'Deep, cool, and striking',
    colors: [
      { name: 'Burgundy', hex: '#722F37' },
      { name: 'Ruby', hex: '#E0115F' },
      { name: 'Emerald', hex: '#50C878' },
      { name: 'Sapphire', hex: '#0F52BA' },
      { name: 'Deep Purple', hex: '#301934' },
      { name: 'Black', hex: '#0A0A0A' },
      { name: 'Pine', hex: '#01796F' },
      { name: 'Charcoal', hex: '#36454F' },
    ],
  },
  coolWinter: {
    name: 'Cool Winter',
    description: 'Cool, icy, and dramatic',
    colors: [
      { name: 'Icy Pink', hex: '#FF1493' },
      { name: 'Fuchsia', hex: '#FF00FF' },
      { name: 'Royal Blue', hex: '#4169E1' },
      { name: 'Emerald', hex: '#00A86B' },
      { name: 'Purple', hex: '#800080' },
      { name: 'Navy', hex: '#001F3F' },
      { name: 'Pure Black', hex: '#000000' },
      { name: 'Pure White', hex: '#FFFFFF' },
    ],
  },
  brightWinter: {
    name: 'Bright Winter',
    description: 'Vivid, cool, and bold',
    colors: [
      { name: 'Hot Pink', hex: '#FF69B4' },
      { name: 'True Red', hex: '#FF0000' },
      { name: 'Electric Blue', hex: '#0000FF' },
      { name: 'Bright Green', hex: '#00FF00' },
      { name: 'Violet', hex: '#8B00FF' },
      { name: 'Lemon Yellow', hex: '#FFF44F' },
      { name: 'Cyan', hex: '#00FFFF' },
      { name: 'Pure White', hex: '#FFFFFF' },
    ],
  },
  // 4-color palettes
  warmNeutrals: {
    name: 'Warm Neutrals',
    description: 'Earthy and natural',
    colors: [
      { name: 'Cream', hex: '#F5E6D3' },
      { name: 'Camel', hex: '#C19A6B' },
      { name: 'Chocolate', hex: '#7B3F00' },
      { name: 'Terracotta', hex: '#E2725B' },
    ],
  },
  coolNeutrals: {
    name: 'Cool Neutrals',
    description: 'Soft and sophisticated',
    colors: [
      { name: 'Off White', hex: '#FAF0E6' },
      { name: 'Gray', hex: '#808080' },
      { name: 'Charcoal', hex: '#36454F' },
      { name: 'Navy', hex: '#001F3F' },
    ],
  },
  jewel: {
    name: 'Jewel Tones',
    description: 'Rich and luxurious',
    colors: [
      { name: 'Emerald', hex: '#50C878' },
      { name: 'Sapphire', hex: '#0F52BA' },
      { name: 'Ruby', hex: '#E0115F' },
      { name: 'Amethyst', hex: '#9966CC' },
    ],
  },
  pastel: {
    name: 'Pastels',
    description: 'Light and airy',
    colors: [
      { name: 'Blush', hex: '#FFB6C1' },
      { name: 'Mint', hex: '#98FB98' },
      { name: 'Lavender', hex: '#E6E6FA' },
      { name: 'Sky', hex: '#87CEEB' },
    ],
  },
  earth: {
    name: 'Earth Tones',
    description: 'Grounded and warm',
    colors: [
      { name: 'Olive', hex: '#556B2F' },
      { name: 'Rust', hex: '#B7410E' },
      { name: 'Mustard', hex: '#FFDB58' },
      { name: 'Forest', hex: '#228B22' },
    ],
  },
  monochrome: {
    name: 'Black & White',
    description: 'Classic contrast',
    colors: [
      { name: 'White', hex: '#FFFFFF' },
      { name: 'Light Gray', hex: '#D3D3D3' },
      { name: 'Dark Gray', hex: '#404040' },
      { name: 'Black', hex: '#000000' },
    ],
  },
  sunset: {
    name: 'Sunset',
    description: 'Warm and glowing',
    colors: [
      { name: 'Golden', hex: '#FFD700' },
      { name: 'Orange', hex: '#FF8C00' },
      { name: 'Coral', hex: '#FF6B6B' },
      { name: 'Magenta', hex: '#FF0080' },
    ],
  },
  ocean: {
    name: 'Ocean',
    description: 'Cool and calming',
    colors: [
      { name: 'Seafoam', hex: '#98D7C2' },
      { name: 'Aqua', hex: '#00CED1' },
      { name: 'Teal', hex: '#008080' },
      { name: 'Deep Blue', hex: '#00008B' },
    ],
  },
};

type ColorPaletteKey = keyof typeof colorPalettes;

// Component to create the draping cape with vertical color strips
function ColorCape({ colors }: { colors: { name: string; hex: string }[] }) {
  const centerX = screenWidth / 2;
  const centerY = screenHeight * 0.50;
  const neckRadius = 120;
  const capeRadius = Math.max(screenWidth, screenHeight) * 2; // Made longer
  const segmentCount = colors.length;
  const anglePerSegment = Math.PI / segmentCount;

  return (
    <View style={styles.capeContainer} pointerEvents="none">
      <Svg
        width={screenWidth}
        height={screenHeight}
        style={StyleSheet.absoluteFill}
      >
        {colors.map((color, index) => {
          const startAngle = index * anglePerSegment;
          const endAngle = (index + 1) * anglePerSegment;

          const x1 = centerX + Math.cos(startAngle) * neckRadius;
          const y1 = centerY + Math.sin(startAngle) * neckRadius;
          const x2 = centerX + Math.cos(endAngle) * neckRadius;
          const y2 = centerY + Math.sin(endAngle) * neckRadius;
          const x3 = centerX + Math.cos(endAngle) * capeRadius;
          const y3 = centerY + Math.sin(endAngle) * capeRadius;
          const x4 = centerX + Math.cos(startAngle) * capeRadius;
          const y4 = centerY + Math.sin(startAngle) * capeRadius;

          const points = `${x1},${y1} ${x2},${y2} ${x3},${y3} ${x4},${y4}`;

          return (
            <Polygon
              key={index}
              points={points}
              fill={color.hex}
              opacity={0.85}
              stroke="#FFFFFF"
              strokeWidth={2}
            />
          );
        })}
      </Svg>
    </View>
  );
}

export default function CameraScreen() {
  const [facing, setFacing] = useState<CameraType>('front');
  const [permission, requestPermission] = useCameraPermissions();
  const [photo, setPhoto] = useState<string | null>(null);
  const [paletteKey, setPaletteKey] = useState<ColorPaletteKey>('lightSpring');
  const cameraRef = useRef<CameraView>(null);
  const insets = useSafeAreaInsets();

  if (!permission) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading camera...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <StatusBar style="light" />
        <Text style={styles.permissionTitle}>Camera Access Required</Text>
        <Text style={styles.permissionText}>
          We need your permission to access the camera.
        </Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentPalette = colorPalettes[paletteKey];
  const paletteKeys = Object.keys(colorPalettes) as ColorPaletteKey[];

  function toggleCameraFacing() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
  }

  function changePalette(newKey: ColorPaletteKey) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPaletteKey(newKey);
  }

  async function takePicture() {
    if (cameraRef.current) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const result = await cameraRef.current.takePictureAsync();
      if (result) {
        setPhoto(result.uri);
      }
    }
  }

  function retake() {
    setPhoto(null);
  }

  if (photo) {
    return (
      <View style={styles.fullScreen}>
        <StatusBar style="light" />
        <Image source={{ uri: photo }} style={styles.preview} contentFit="cover" />
        {/* Keep the color cape overlay on the photo */}
        <ColorCape colors={currentPalette.colors} />
        <View style={[styles.photoButtonContainer, { paddingBottom: insets.bottom + 20 }]}>
          <TouchableOpacity style={styles.retakeButton} onPress={retake}>
            <Text style={styles.retakeButtonText}>Retake</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.fullScreen}>
      <StatusBar style="light" />
      <CameraView style={styles.camera} facing={facing} ref={cameraRef} mirror={facing === 'front'}>
        {/* Color cape overlay */}
        <ColorCape colors={currentPalette.colors} />

        {/* Top controls */}
        <View style={[styles.topControls, { paddingTop: insets.top + 12 }]}>
          <View>
            <Text style={styles.paletteLabel}>{currentPalette.name}</Text>
            <Text style={styles.paletteDescription}>{currentPalette.description}</Text>
          </View>
          <Pressable style={styles.flipButton} onPress={toggleCameraFacing}>
            <RotateCw size={24} color="#FFFFFF" strokeWidth={2} />
          </Pressable>
        </View>

        {/* Palette selector */}
        <View style={[styles.paletteSelector, { bottom: insets.bottom + 120 }]}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.paletteSelectorContent}
          >
            {paletteKeys.map((key) => (
              <Pressable
                key={key}
                style={[
                  styles.paletteButton,
                  paletteKey === key && styles.paletteButtonActive,
                ]}
                onPress={() => changePalette(key)}
              >
                <Text
                  style={[
                    styles.paletteButtonText,
                    paletteKey === key && styles.paletteButtonTextActive,
                  ]}
                >
                  {colorPalettes[key].name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Bottom controls */}
        <View style={[styles.bottomControls, { paddingBottom: insets.bottom + 20 }]}>
          <View style={styles.placeholder} />
          <Pressable style={styles.captureButton} onPress={takePicture}>
            <View style={styles.captureButtonInner} />
          </Pressable>
          <View style={styles.placeholder} />
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
  },
  fullScreen: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
    width: '100%',
  },
  preview: {
    ...StyleSheet.absoluteFillObject,
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  permissionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#CCCCCC',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
  },
  permissionButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 24,
  },
  permissionButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
  },
  capeContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'none',
  },
  topControls: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
  },
  paletteLabel: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  paletteDescription: {
    fontSize: 13,
    fontWeight: '500',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
    marginTop: 2,
  },
  flipButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paletteSelector: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 50,
  },
  paletteSelectorContent: {
    paddingHorizontal: 16,
    gap: 8,
    justifyContent: 'center',
  },
  paletteButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  paletteButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  paletteButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  paletteButtonTextActive: {
    fontWeight: '700',
  },
  bottomControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  placeholder: {
    width: 50,
    height: 50,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  captureButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
  },
  photoButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  retakeButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 24,
  },
  retakeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
});

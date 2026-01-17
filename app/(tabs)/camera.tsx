import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useState, useRef } from 'react';
import { StyleSheet, TouchableOpacity, View, Text, Dimensions, ScrollView, Pressable, Alert } from 'react-native';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RotateCw, Home, Download, ChevronLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as MediaLibrary from 'expo-media-library';
import { captureRef } from 'react-native-view-shot';
import Svg, { Polygon, Path } from 'react-native-svg';
import { colorPalettes, ColorPaletteKey } from '@/constants/palettes';
import { usePalettePreferences } from '@/context/palette-preferences-context';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Component to create the draping cape with vertical color strips
function ColorCape({ colors }: { colors: { name: string; hex: string }[] }) {
  const [selectedColor, setSelectedColor] = useState<{ name: string; hex: string } | null>(null);
  const centerX = screenWidth / 2;
  const centerY = screenHeight * 0.50;
  const neckRadius = 120;
  const capeRadius = Math.max(screenWidth, screenHeight) * 2;
  const segmentCount = colors.length;
  const anglePerSegment = Math.PI / segmentCount;

  const handleLongPress = (color: { name: string; hex: string }) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedColor(color);
  };

  const handlePressOut = () => {
    setSelectedColor(null);
  };

  // For single color, render a semicircle using Path
  const isSingleColor = colors.length === 1;

  return (
    <View style={styles.capeContainer} pointerEvents="box-none">
      <Svg
        width={screenWidth}
        height={screenHeight}
        style={StyleSheet.absoluteFill}
      >
        {isSingleColor ? (
          // Single color: draw a semicircle from the neck down
          <Path
            d={`
              M ${centerX + neckRadius} ${centerY}
              A ${neckRadius} ${neckRadius} 0 0 1 ${centerX - neckRadius} ${centerY}
              L ${centerX - capeRadius} ${centerY}
              L ${centerX - capeRadius} ${screenHeight + capeRadius}
              L ${centerX + capeRadius} ${screenHeight + capeRadius}
              L ${centerX + capeRadius} ${centerY}
              Z
            `}
            fill={colors[0].hex}
            opacity={0.85}
            onLongPress={() => handleLongPress(colors[0])}
            onPressOut={handlePressOut}
            delayLongPress={300}
          />
        ) : (
          // Multiple colors: draw polygon segments
          colors.map((color, index) => {
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
                onLongPress={() => handleLongPress(color)}
                onPressOut={handlePressOut}
                delayLongPress={300}
              />
            );
          })
        )}
      </Svg>

      {/* Color info tooltip */}
      {selectedColor && (
        <View style={styles.colorTooltip}>
          <View style={[styles.colorSwatch, { backgroundColor: selectedColor.hex }]} />
          <Text style={styles.colorName}>{selectedColor.name}</Text>
          <Text style={styles.colorHex}>{selectedColor.hex}</Text>
        </View>
      )}
    </View>
  );
}

export default function CameraScreen() {
  const [facing, setFacing] = useState<CameraType>('front');
  const [permission, requestPermission] = useCameraPermissions();
  const [photo, setPhoto] = useState<string | null>(null);
  const [paletteKey, setPaletteKey] = useState<ColorPaletteKey | null>(null);
  const cameraRef = useRef<CameraView>(null);
  const viewShotRef = useRef<View>(null);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { getEnabledPalettes } = usePalettePreferences();

  const enabledPalettes = getEnabledPalettes();
  const currentPaletteKey = paletteKey && enabledPalettes.includes(paletteKey) ? paletteKey : enabledPalettes[0];

  function goHome() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/');
  }

  async function savePhoto() {
    if (!photo || !viewShotRef.current) return;

    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant permission to save photos to your gallery.');
        return;
      }

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Capture the view with the overlay
      const uri = await captureRef(viewShotRef, {
        format: 'jpg',
        quality: 1,
      });

      await MediaLibrary.saveToLibraryAsync(uri);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Saved!', 'Photo with color overlay saved to your gallery.');
    } catch (error) {
      console.error('Error saving photo:', error);
      Alert.alert('Error', 'Failed to save photo.');
    }
  }

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

  const currentPalette = currentPaletteKey ? colorPalettes[currentPaletteKey] : null;

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
        {/* Capturable view with photo and overlay */}
        <View ref={viewShotRef} style={styles.captureView} collapsable={false}>
          <Image source={{ uri: photo }} style={styles.preview} contentFit="cover" />
          <ColorCape colors={currentPalette.colors} />
        </View>
        {/* Bottom controls */}
        <View style={[styles.photoButtonContainer, { paddingBottom: insets.bottom + 20 }]}>
          <Pressable style={styles.backButton} onPress={goHome}>
            <ChevronLeft size={28} color="#FFFFFF" strokeWidth={2} />
          </Pressable>
          <TouchableOpacity style={styles.retakeButton} onPress={retake}>
            <Text style={styles.retakeButtonText}>Retake</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveButton} onPress={savePhoto}>
            <Download size={20} color="#000000" strokeWidth={2} />
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!currentPalette || enabledPalettes.length === 0) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <Text style={styles.loadingText}>No palettes enabled. Enable some in Settings.</Text>
        <Pressable style={styles.permissionButton} onPress={goHome}>
          <Text style={styles.permissionButtonText}>Go to Settings</Text>
        </Pressable>
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
          <Pressable style={styles.homeButton} onPress={goHome}>
            <Home size={24} color="#FFFFFF" strokeWidth={2} />
          </Pressable>
          <View style={styles.paletteLabelContainer}>
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
            {enabledPalettes.map((key) => (
              <Pressable
                key={key}
                style={[
                  styles.paletteButton,
                  currentPaletteKey === key && styles.paletteButtonActive,
                ]}
                onPress={() => changePalette(key)}
              >
                <Text
                  style={[
                    styles.paletteButtonText,
                    currentPaletteKey === key && styles.paletteButtonTextActive,
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
          <Pressable style={styles.backButton} onPress={goHome}>
            <ChevronLeft size={28} color="#FFFFFF" strokeWidth={2} />
          </Pressable>
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
  captureView: {
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
  },
  colorTooltip: {
    position: 'absolute',
    top: screenHeight * 0.35,
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
    minWidth: 150,
  },
  colorSwatch: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    marginBottom: 12,
  },
  colorName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  colorHex: {
    fontSize: 14,
    fontWeight: '500',
    color: '#CCCCCC',
    fontFamily: 'monospace',
  },
  topControls: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  homeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paletteLabelContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 8,
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
  backButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
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
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 16,
  },
  retakeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  retakeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  saveButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
});

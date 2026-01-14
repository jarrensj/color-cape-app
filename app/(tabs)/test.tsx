import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useState, useRef } from 'react';
import { StyleSheet, View, Text, Dimensions, Pressable, ScrollView, Alert } from 'react-native';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RotateCw, RefreshCw, ChevronLeft, Camera, Home } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Svg, { Polygon } from 'react-native-svg';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Test overlays for each step
const testOverlays = {
  cool: {
    name: 'Cool',
    description: 'Silver undertones',
    colors: [
      { name: 'Silver', hex: '#C0C0C0' },
      { name: 'Icy Blue', hex: '#B0E0E6' },
      { name: 'Cool Pink', hex: '#E75480' },
      { name: 'Blue Gray', hex: '#6699CC' },
    ],
  },
  warm: {
    name: 'Warm',
    description: 'Gold undertones',
    colors: [
      { name: 'Gold', hex: '#FFD700' },
      { name: 'Peach', hex: '#FFCC99' },
      { name: 'Coral', hex: '#FF7F50' },
      { name: 'Warm Beige', hex: '#F5DEB3' },
    ],
  },
  bright: {
    name: 'Bright',
    description: 'Clear and vivid',
    colors: [
      { name: 'Bright Pink', hex: '#FF1493' },
      { name: 'Electric Blue', hex: '#0000FF' },
      { name: 'Bright Green', hex: '#00FF00' },
      { name: 'Pure White', hex: '#FFFFFF' },
    ],
  },
  muted: {
    name: 'Muted',
    description: 'Soft and dusty',
    colors: [
      { name: 'Dusty Rose', hex: '#D4A5A5' },
      { name: 'Slate Blue', hex: '#6A5ACD' },
      { name: 'Sage', hex: '#9DC183' },
      { name: 'Taupe', hex: '#8B8589' },
    ],
  },
  brightWarm: {
    name: 'Bright',
    description: 'Clear and warm',
    colors: [
      { name: 'Bright Coral', hex: '#FF6B6B' },
      { name: 'Golden Yellow', hex: '#FFD700' },
      { name: 'Turquoise', hex: '#40E0D0' },
      { name: 'Hot Pink', hex: '#FF69B4' },
    ],
  },
  mutedWarm: {
    name: 'Muted',
    description: 'Earthy and soft',
    colors: [
      { name: 'Camel', hex: '#C19A6B' },
      { name: 'Terracotta', hex: '#E2725B' },
      { name: 'Olive', hex: '#808000' },
      { name: 'Mustard', hex: '#FFDB58' },
    ],
  },
};

// Season results with their palettes
const seasonResults = {
  winter: {
    name: 'Winter',
    description: 'Cool, bright, and dramatic',
    subSeasons: ['Deep Winter', 'Cool Winter', 'Bright Winter'],
    colors: [
      { name: 'Icy Pink', hex: '#FF1493' },
      { name: 'Ruby', hex: '#E0115F' },
      { name: 'Royal Blue', hex: '#4169E1' },
      { name: 'Emerald', hex: '#00A86B' },
      { name: 'Purple', hex: '#800080' },
      { name: 'Navy', hex: '#001F3F' },
      { name: 'Pure Black', hex: '#000000' },
      { name: 'Pure White', hex: '#FFFFFF' },
    ],
  },
  summer: {
    name: 'Summer',
    description: 'Cool, soft, and elegant',
    subSeasons: ['Light Summer', 'Cool Summer', 'Soft Summer'],
    colors: [
      { name: 'Dusty Rose', hex: '#D8B0B0' },
      { name: 'Raspberry', hex: '#E30B5C' },
      { name: 'Lavender', hex: '#B4A7D6' },
      { name: 'Periwinkle', hex: '#CCCCFF' },
      { name: 'Powder Blue', hex: '#B0E0E6' },
      { name: 'Sage', hex: '#B2AC88' },
      { name: 'Mauve', hex: '#E0B0FF' },
      { name: 'Soft White', hex: '#F5F5F5' },
    ],
  },
  spring: {
    name: 'Spring',
    description: 'Warm, bright, and fresh',
    subSeasons: ['Light Spring', 'Warm Spring', 'Bright Spring'],
    colors: [
      { name: 'Coral', hex: '#FF7F50' },
      { name: 'Peach', hex: '#FFCC99' },
      { name: 'Golden Yellow', hex: '#FFD700' },
      { name: 'Grass Green', hex: '#7CFC00' },
      { name: 'Turquoise', hex: '#40E0D0' },
      { name: 'Salmon', hex: '#FA8072' },
      { name: 'Aqua', hex: '#00FFFF' },
      { name: 'Warm White', hex: '#FFF8F0' },
    ],
  },
  autumn: {
    name: 'Autumn',
    description: 'Warm, muted, and earthy',
    subSeasons: ['Soft Autumn', 'Warm Autumn', 'Deep Autumn'],
    colors: [
      { name: 'Rust', hex: '#B7410E' },
      { name: 'Pumpkin', hex: '#FF7518' },
      { name: 'Gold', hex: '#D4AF37' },
      { name: 'Olive', hex: '#556B2F' },
      { name: 'Teal', hex: '#008080' },
      { name: 'Warm Brown', hex: '#704214' },
      { name: 'Burgundy', hex: '#800020' },
      { name: 'Cream', hex: '#F5E6D3' },
    ],
  },
};

type TestStep = 'intro' | 'capture1' | 'capture2' | 'compare' | 'result';
type TestPhase = 'undertone' | 'intensity';
type Undertone = 'cool' | 'warm' | null;
type Intensity = 'bright' | 'muted' | null;
type Season = 'winter' | 'summer' | 'spring' | 'autumn';

// Left half cape - draws full cape centered on screen, clips to left half
function LeftHalfCape({ colors }: { colors: { name: string; hex: string }[] }) {
  const halfWidth = screenWidth / 2;
  const centerX = screenWidth / 2;
  const centerY = screenHeight * 0.45;
  const neckRadius = 100;
  const capeRadius = Math.max(screenWidth, screenHeight) * 2;
  const segmentCount = colors.length;
  const anglePerSegment = Math.PI / segmentCount;

  return (
    <View style={styles.leftHalfCapeContainer} pointerEvents="none">
      <Svg width={screenWidth} height={screenHeight} style={StyleSheet.absoluteFill}>
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
              strokeWidth={1}
            />
          );
        })}
      </Svg>
    </View>
  );
}

// Right half cape - draws full cape centered on screen, offset to show right portion
function RightHalfCape({ colors }: { colors: { name: string; hex: string }[] }) {
  const halfWidth = screenWidth / 2;
  const centerX = screenWidth / 2;
  const centerY = screenHeight * 0.45;
  const neckRadius = 100;
  const capeRadius = Math.max(screenWidth, screenHeight) * 2;
  const segmentCount = colors.length;
  const anglePerSegment = Math.PI / segmentCount;

  return (
    <View style={styles.rightHalfCapeContainer} pointerEvents="none">
      <Svg width={screenWidth} height={screenHeight} style={[StyleSheet.absoluteFill, { left: -halfWidth }]}>
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
              strokeWidth={1}
            />
          );
        })}
      </Svg>
    </View>
  );
}

// Cape for compare screen (half-width photos)
function CompareCape({ colors }: { colors: { name: string; hex: string }[] }) {
  const halfWidth = screenWidth / 2;
  const centerX = halfWidth / 2;
  const centerY = screenHeight * 0.45;
  const neckRadius = 60;
  const capeRadius = Math.max(halfWidth, screenHeight) * 2;
  const segmentCount = colors.length;
  const anglePerSegment = Math.PI / segmentCount;

  return (
    <View style={styles.compareCapeContainer} pointerEvents="none">
      <Svg width={halfWidth} height={screenHeight} style={StyleSheet.absoluteFill}>
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
              strokeWidth={1}
            />
          );
        })}
      </Svg>
    </View>
  );
}

// Full cape for result
function FullCape({ colors }: { colors: { name: string; hex: string }[] }) {
  const centerX = screenWidth / 2;
  const centerY = screenHeight * 0.50;
  const neckRadius = 120;
  const capeRadius = Math.max(screenWidth, screenHeight) * 2;
  const segmentCount = colors.length;
  const anglePerSegment = Math.PI / segmentCount;

  return (
    <View style={styles.fullCapeContainer} pointerEvents="none">
      <Svg width={screenWidth} height={screenHeight} style={StyleSheet.absoluteFill}>
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

export default function TestScreen() {
  const [facing, setFacing] = useState<CameraType>('front');
  const [permission, requestPermission] = useCameraPermissions();
  const [step, setStep] = useState<TestStep>('intro');
  const [phase, setPhase] = useState<TestPhase>('undertone');
  const [undertone, setUndertone] = useState<Undertone>(null);
  const [intensity, setIntensity] = useState<Intensity>(null);
  const [photo1, setPhoto1] = useState<string | null>(null);
  const [photo2, setPhoto2] = useState<string | null>(null);
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<CameraView>(null);
  const router = useRouter();

  const goHome = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/');
  };

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
          We need your permission to access the camera for the color test.
        </Text>
        <Pressable style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </Pressable>
      </View>
    );
  }

  const toggleCameraFacing = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
  };

  const resetTest = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setStep('intro');
    setPhase('undertone');
    setUndertone(null);
    setIntensity(null);
    setPhoto1(null);
    setPhoto2(null);
  };

  const goBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step === 'capture1') {
      if (phase === 'undertone') {
        setStep('intro');
      } else {
        // Can't go back to undertone compare (photos cleared), restart test
        setStep('intro');
        setPhase('undertone');
        setUndertone(null);
      }
    } else if (step === 'capture2') {
      setStep('capture1');
      setPhoto1(null);
    } else if (step === 'compare') {
      setStep('capture2');
      setPhoto2(null);
    } else if (step === 'result') {
      // Go back to intensity capture1, not compare (photos cleared)
      setStep('capture1');
      setIntensity(null);
      setPhoto1(null);
      setPhoto2(null);
    }
  };

  const startTest = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setStep('capture1');
    setPhase('undertone');
  };

  const takePhoto = async () => {
    if (!cameraRef.current) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const result = await cameraRef.current.takePictureAsync();

    if (result) {
      if (step === 'capture1') {
        setPhoto1(result.uri);
        setStep('capture2');
      } else if (step === 'capture2') {
        setPhoto2(result.uri);
        setStep('compare');
      }
    }
  };

  const selectOption = (option: 'left' | 'right') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const labels = getLabels();
    const selectedLabel = option === 'left' ? labels.left : labels.right;

    Alert.alert(
      'Confirm Selection',
      `You selected "${selectedLabel}". Continue?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Continue',
          onPress: () => {
            if (phase === 'undertone') {
              setUndertone(option === 'left' ? 'cool' : 'warm');
              // Move to intensity phase
              setPhase('intensity');
              setStep('capture1');
              setPhoto1(null);
              setPhoto2(null);
            } else {
              setIntensity(option === 'left' ? 'bright' : 'muted');
              setStep('result');
            }
          },
        },
      ]
    );
  };

  const getSeason = (): Season => {
    if (undertone === 'cool' && intensity === 'bright') return 'winter';
    if (undertone === 'cool' && intensity === 'muted') return 'summer';
    if (undertone === 'warm' && intensity === 'bright') return 'spring';
    return 'autumn';
  };

  // Get current overlay colors based on phase and which photo we're taking
  const getCurrentOverlay = () => {
    if (phase === 'undertone') {
      return step === 'capture1' ? testOverlays.cool : testOverlays.warm;
    } else {
      return step === 'capture1'
        ? (undertone === 'cool' ? testOverlays.bright : testOverlays.brightWarm)
        : (undertone === 'cool' ? testOverlays.muted : testOverlays.mutedWarm);
    }
  };

  const getLabels = () => {
    if (phase === 'undertone') {
      return { left: 'Cool', right: 'Warm', leftDesc: 'Silver undertones', rightDesc: 'Gold undertones' };
    } else {
      return { left: 'Bright', right: 'Muted', leftDesc: 'Clear and vivid', rightDesc: 'Soft and dusty' };
    }
  };

  // Intro screen
  if (step === 'intro') {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />

        {/* Home button */}
        <View style={[styles.introHeader, { paddingTop: insets.top + 12 }]}>
          <Pressable style={styles.homeButton} onPress={goHome}>
            <Home size={24} color="#FFFFFF" strokeWidth={2} />
          </Pressable>
        </View>

        <View style={[styles.introContent, { paddingTop: insets.top + 80 }]}>
          <Text style={styles.introTitle}>Find Your Colors</Text>
          <Text style={styles.introSubtitle}>
            Discover your seasonal color palette in 2 simple steps
          </Text>

          <View style={styles.stepsContainer}>
            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <Text style={styles.stepText}>Choose your undertone (cool or warm)</Text>
            </View>
            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <Text style={styles.stepText}>Choose your intensity (bright or muted)</Text>
            </View>
          </View>

          <Pressable style={styles.startButton} onPress={startTest}>
            <Text style={styles.startButtonText}>Start Test</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // Result screen
  if (step === 'result') {
    const season = getSeason();
    const result = seasonResults[season];

    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <CameraView style={styles.camera} facing={facing} ref={cameraRef} mirror={facing === 'front'}>
          <FullCape colors={result.colors} />

          <View style={[styles.resultHeader, { paddingTop: insets.top + 12 }]}>
            <Pressable style={styles.backButton} onPress={goBack}>
              <ChevronLeft size={28} color="#FFFFFF" strokeWidth={2} />
            </Pressable>
            <View style={styles.resultTitleContainer}>
              <Text style={styles.resultTitle}>You are a {result.name}!</Text>
              <Text style={styles.resultDescription}>{result.description}</Text>
            </View>
            <Pressable style={styles.flipButton} onPress={toggleCameraFacing}>
              <RotateCw size={24} color="#FFFFFF" strokeWidth={2} />
            </Pressable>
          </View>

          <View style={[styles.resultFooter, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.subSeasonsContainer}>
              <Text style={styles.subSeasonsLabel}>Your best palettes:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {result.subSeasons.map((sub, index) => (
                  <View key={index} style={styles.subSeasonBadge}>
                    <Text style={styles.subSeasonText}>{sub}</Text>
                  </View>
                ))}
              </ScrollView>
            </View>

            <Pressable style={styles.retakeButton} onPress={resetTest}>
              <RefreshCw size={20} color="#000000" strokeWidth={2} />
              <Text style={styles.retakeButtonText}>Retake Test</Text>
            </Pressable>
          </View>
        </CameraView>
      </View>
    );
  }

  // Capture screens (capture1 and capture2)
  if (step === 'capture1' || step === 'capture2') {
    const currentOverlay = getCurrentOverlay();
    const labels = getLabels();
    const isFirst = step === 'capture1';
    const captureLabel = isFirst ? labels.left : labels.right;
    const captureDesc = isFirst ? labels.leftDesc : labels.rightDesc;
    const instruction = isFirst
      ? `Take a photo with ${captureLabel} colors`
      : `Now take a photo with ${captureLabel} colors`;

    return (
      <View style={styles.container}>
        <StatusBar style="light" />

        <CameraView
          style={StyleSheet.absoluteFill}
          facing={facing}
          ref={cameraRef}
          mirror={facing === 'front'}
        >
          <FullCape colors={currentOverlay.colors} />
        </CameraView>

        {/* Header */}
        <View style={[styles.captureHeader, { paddingTop: insets.top + 12 }]}>
          <Pressable style={styles.backButton} onPress={goBack}>
            <ChevronLeft size={28} color="#FFFFFF" strokeWidth={2} />
          </Pressable>
          <View style={styles.captureHeaderText}>
            <Text style={styles.captureTitle}>{captureLabel}</Text>
            <Text style={styles.captureSubtitle}>{captureDesc}</Text>
          </View>
          <Pressable style={styles.flipButton} onPress={toggleCameraFacing}>
            <RotateCw size={24} color="#FFFFFF" strokeWidth={2} />
          </Pressable>
        </View>

        {/* Instruction */}
        <View style={styles.instructionBanner}>
          <Text style={styles.instructionText}>{instruction}</Text>
        </View>

        {/* Capture button */}
        <View style={[styles.captureControls, { paddingBottom: insets.bottom + 20 }]}>
          <View style={styles.progressDots}>
            <View style={[styles.progressDot, styles.progressDotActive]} />
            <View style={[styles.progressDot, !isFirst && styles.progressDotActive]} />
          </View>
          <Pressable style={styles.captureButton} onPress={takePhoto}>
            <Camera size={32} color="#000000" strokeWidth={2} />
          </Pressable>
          <Text style={styles.captureTip}>Tap to capture</Text>
        </View>
      </View>
    );
  }

  // Compare screen
  if (step === 'compare' && photo1 && photo2) {
    const labels = getLabels();
    const questionText = phase === 'undertone'
      ? 'Which colors make your skin glow?'
      : 'Which colors suit you better?';

    const leftOverlay = phase === 'undertone' ? testOverlays.cool :
      (undertone === 'cool' ? testOverlays.bright : testOverlays.brightWarm);
    const rightOverlay = phase === 'undertone' ? testOverlays.warm :
      (undertone === 'cool' ? testOverlays.muted : testOverlays.mutedWarm);

    return (
      <View style={styles.container}>
        <StatusBar style="light" />

        {/* Header */}
        <View style={[styles.compareHeader, { paddingTop: insets.top + 12 }]}>
          <Pressable style={styles.backButton} onPress={goBack}>
            <ChevronLeft size={28} color="#FFFFFF" strokeWidth={2} />
          </Pressable>
          <Text style={styles.compareQuestion}>{questionText}</Text>
          <View style={{ width: 44 }} />
        </View>

        {/* Side by side photos */}
        <View style={styles.compareContainer}>
          {/* Left photo */}
          <Pressable style={styles.compareOption} onPress={() => selectOption('left')}>
            <Image source={{ uri: photo1 }} style={styles.compareImage} contentFit="cover" />
            <CompareCape colors={leftOverlay.colors} />
            <View style={styles.compareLabel}>
              <Text style={styles.compareLabelText}>{labels.left}</Text>
              <Text style={styles.compareLabelSubtext}>{labels.leftDesc}</Text>
            </View>
          </Pressable>

          {/* Divider */}
          <View style={styles.compareDivider} />

          {/* Right photo */}
          <Pressable style={styles.compareOption} onPress={() => selectOption('right')}>
            <Image source={{ uri: photo2 }} style={styles.compareImage} contentFit="cover" />
            <CompareCape colors={rightOverlay.colors} />
            <View style={styles.compareLabel}>
              <Text style={styles.compareLabelText}>{labels.right}</Text>
              <Text style={styles.compareLabelSubtext}>{labels.rightDesc}</Text>
            </View>
          </Pressable>
        </View>

        {/* Footer */}
        <View style={[styles.compareFooter, { paddingBottom: insets.bottom + 20 }]}>
          <Text style={styles.compareTip}>Tap the photo that looks best on you</Text>
          <View style={styles.progressDots}>
            <View style={[styles.progressDot, styles.progressDotActive]} />
            <View style={[styles.progressDot, phase === 'intensity' && styles.progressDotActive]} />
          </View>
        </View>
      </View>
    );
  }

  // Fallback
  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
  },
  camera: {
    flex: 1,
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
  // Intro styles
  introHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    zIndex: 10,
  },
  homeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  introContent: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  introTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
  },
  introSubtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#CCCCCC',
    textAlign: 'center',
    marginBottom: 48,
  },
  stepsContainer: {
    marginBottom: 48,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  stepNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  stepNumberText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
  },
  stepText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    flex: 1,
  },
  startButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderRadius: 28,
    alignItems: 'center',
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
  },
  // Test screen styles
  testHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingBottom: 12,
  },
  questionText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 8,
  },
  flipButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  splitOverlayWrapper: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
  },
  overlayHalf: {
    flex: 1,
    overflow: 'hidden',
  },
  centerDivider: {
    width: 3,
    backgroundColor: '#FFFFFF',
    zIndex: 10,
  },
  leftHalfCapeContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  rightHalfCapeContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  // Capture screen styles
  captureHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    zIndex: 20,
  },
  captureHeaderText: {
    flex: 1,
    alignItems: 'center',
  },
  captureTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  captureSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
    marginTop: 4,
  },
  instructionBanner: {
    position: 'absolute',
    top: screenHeight * 0.35,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  instructionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  captureControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 16,
  },
  captureTip: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  // Compare screen styles
  compareHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  compareQuestion: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  compareContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  compareOption: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  compareImage: {
    ...StyleSheet.absoluteFillObject,
  },
  compareCapeContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  compareDivider: {
    width: 3,
    backgroundColor: '#FFFFFF',
  },
  compareLabel: {
    position: 'absolute',
    bottom: 100,
    left: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  compareLabelText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  compareLabelSubtext: {
    fontSize: 12,
    fontWeight: '500',
    color: '#CCCCCC',
    marginTop: 2,
  },
  compareFooter: {
    alignItems: 'center',
    paddingTop: 16,
  },
  compareTip: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 16,
  },
  splitContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  splitOption: {
    flex: 1,
    position: 'relative',
  },
  splitCamera: {
    flex: 1,
  },
  divider: {
    width: 2,
    backgroundColor: '#FFFFFF',
    zIndex: 10,
  },
  optionLabel: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingVertical: 12,
    marginHorizontal: 8,
    borderRadius: 12,
  },
  optionLabelText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  optionLabelSubtext: {
    fontSize: 12,
    fontWeight: '500',
    color: '#CCCCCC',
    marginTop: 2,
  },
  fullCamera: {
    ...StyleSheet.absoluteFillObject,
  },
  splitOverlayContainer: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
  },
  splitHalf: {
    flex: 1,
    overflow: 'hidden',
  },
  halfOverlay: {
    flex: 1,
    overflow: 'hidden',
  },
  halfCapeContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  progressContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingTop: 12,
  },
  progressDots: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  progressDotActive: {
    backgroundColor: '#FFFFFF',
  },
  resetButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  resetButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  // Result styles
  resultHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    zIndex: 10,
  },
  resultTitleContainer: {
    flex: 1,
    marginHorizontal: 12,
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  resultDescription: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
    marginTop: 4,
  },
  resultFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
  },
  subSeasonsContainer: {
    marginBottom: 16,
  },
  subSeasonsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  subSeasonBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  subSeasonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  retakeButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  retakeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  fullCapeContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'none',
  },
});

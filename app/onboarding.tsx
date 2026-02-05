import { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, Pressable, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useOnboarding } from '@/context/onboarding-context';
import { useLanguage } from '@/context/language-context';
import { LanguageToggle } from '@/components/LanguageToggle';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  withRepeat,
  useSharedValue,
  interpolateColor,
  Easing,
  runOnJS,
} from 'react-native-reanimated';

// Onboarding images for each slide
const slideImages = [
  require('@/assets/images/unicorn.png'),
  require('@/assets/images/dressing-room-unicorn.png'),
  require('@/assets/images/unicorn-test-taking.png'),
  require('@/assets/images/selfie-unicorn.png'),
];

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Soft pastel rainbow colors
const rainbowColors = [
  '#FF6B6B', // Soft red
  '#FFA06B', // Soft orange
  '#FFD93D', // Soft yellow
  '#6BCB77', // Soft green
  '#4D96FF', // Soft blue
  '#9B59B6', // Soft purple
  '#FF6BD6', // Soft pink
  '#45B7D1', // Soft cyan
];

type Question = {
  id: string;
  questionKey: string;
  optionKeys: string[];
  optionValues: string[];
};

// Color swatch card configurations - positioned around edges to avoid content area
const swatchCards = [
  { colors: ['#FF6B6B', '#FF8E8E'], rotation: -15, x: -30, y: screenHeight * 0.12 },
  { colors: ['#4D96FF', '#7AB3FF'], rotation: 12, x: screenWidth - 50, y: screenHeight * 0.08 },
  { colors: ['#9B59B6', '#B57EDC'], rotation: -8, x: -25, y: screenHeight * 0.82 },
  { colors: ['#6BCB77', '#8ED99A'], rotation: 20, x: screenWidth - 55, y: screenHeight * 0.78 },
  { colors: ['#FFD93D', '#FFE566'], rotation: -25, x: -20, y: screenHeight * 0.45 },
  { colors: ['#FF6BD6', '#FF9DE5'], rotation: 18, x: screenWidth - 45, y: screenHeight * 0.42 },
];

// Animated color swatch card component
function SwatchCard({
  colors,
  rotation,
  x,
  y,
  visible,
  index,
}: {
  colors: string[];
  rotation: number;
  x: number;
  y: number;
  visible: boolean;
  index: number;
}) {
  const scale = useSharedValue(0);
  const rotate = useSharedValue(rotation - 30);
  const translateX = useSharedValue(index % 2 === 0 ? -100 : 100);
  const translateY = useSharedValue(50);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      const delay = index * 150;
      const timeout = setTimeout(() => {
        scale.value = withSpring(1, { damping: 12, stiffness: 100 });
        rotate.value = withSpring(rotation, { damping: 15, stiffness: 80 });
        translateX.value = withSpring(0, { damping: 14, stiffness: 90 });
        translateY.value = withSpring(0, { damping: 14, stiffness: 90 });
        opacity.value = withTiming(1, { duration: 400 });
      }, delay);
      return () => clearTimeout(timeout);
    } else {
      scale.value = withTiming(0, { duration: 300, easing: Easing.in(Easing.cubic) });
      opacity.value = withTiming(0, { duration: 300 });
      rotate.value = withTiming(rotation - 30, { duration: 300 });
      translateX.value = withTiming(index % 2 === 0 ? -100 : 100, { duration: 300 });
    }
  }, [visible, index, rotation]);

  // Gentle floating animation
  useEffect(() => {
    const animateFloat = () => {
      translateY.value = withSequence(
        withTiming(-8, { duration: 2000 + index * 200, easing: Easing.inOut(Easing.sin) }),
        withTiming(8, { duration: 2000 + index * 200, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 2000 + index * 200, easing: Easing.inOut(Easing.sin) })
      );
    };

    if (visible) {
      const timeout = setTimeout(animateFloat, 1000 + index * 150);
      const interval = setInterval(animateFloat, 6000 + index * 300);
      return () => {
        clearTimeout(timeout);
        clearInterval(interval);
      };
    }
  }, [visible, index]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: x,
          top: y,
          width: 70,
          height: 90,
          borderRadius: 8,
          backgroundColor: '#fff',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8,
          padding: 6,
        },
        animatedStyle,
      ]}
    >
      {/* Color portion */}
      <View
        style={{
          flex: 1,
          borderRadius: 4,
          backgroundColor: colors[0],
        }}
      />
      {/* White label area at bottom */}
      <View style={{ height: 18, justifyContent: 'center', alignItems: 'center' }}>
        <View style={{ width: 30, height: 4, backgroundColor: '#ddd', borderRadius: 2 }} />
      </View>
    </Animated.View>
  );
}


// Small confetti dots scattered around the screen
const confettiDots = [
  { x: 30, y: 120, size: 8 },
  { x: screenWidth - 50, y: 180, size: 10 },
  { x: 60, y: screenHeight - 200, size: 6 },
  { x: screenWidth - 40, y: screenHeight - 280, size: 8 },
  { x: screenWidth / 2 + 60, y: 100, size: 7 },
  { x: 25, y: screenHeight / 2 - 50, size: 9 },
  { x: screenWidth - 70, y: 280, size: 6 },
  { x: 80, y: 220, size: 7 },
  { x: screenWidth - 30, y: screenHeight / 2 + 80, size: 8 },
  { x: 45, y: screenHeight - 320, size: 6 },
  { x: screenWidth / 2 - 40, y: screenHeight - 180, size: 9 },
  { x: screenWidth - 60, y: screenHeight - 150, size: 7 },
  { x: 70, y: 350, size: 5 },
  { x: screenWidth - 45, y: 400, size: 6 },
  { x: 35, y: screenHeight / 2 + 120, size: 8 },
  { x: screenWidth / 2 + 80, y: 250, size: 5 },
];

// Confetti dot component
function ConfettiDot({
  color,
  x,
  y,
  size,
  visible,
}: {
  color: string;
  x: number;
  y: number;
  size: number;
  visible: boolean;
}) {
  const scale = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      scale.value = withTiming(1, {
        duration: 400,
        easing: Easing.out(Easing.back(2)),
      });
    } else {
      scale.value = withTiming(0, {
        duration: 300,
        easing: Easing.in(Easing.cubic),
      });
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: scale.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: x,
          top: y,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        },
        animatedStyle,
      ]}
    />
  );
}

const questions: Question[] = [
  {
    id: 'color_preference',
    questionKey: 'onboarding.q1.question',
    optionKeys: ['onboarding.q1.opt1', 'onboarding.q1.opt2', 'onboarding.q1.opt3', 'onboarding.q1.opt4'],
    optionValues: ['neutrals', 'color', 'mostly_neutrals', 'experimenting'],
  },
  {
    id: 'overwhelmed',
    questionKey: 'onboarding.q2.question',
    optionKeys: ['onboarding.q2.opt1', 'onboarding.q2.opt2', 'onboarding.q2.opt3', 'onboarding.q2.opt4'],
    optionValues: ['always', 'sometimes', 'not_really', 'grab_and_go'],
  },
  {
    id: 'taken_test',
    questionKey: 'onboarding.q3.question',
    optionKeys: ['onboarding.q3.opt1', 'onboarding.q3.opt2', 'onboarding.q3.opt3', 'onboarding.q3.opt4'],
    optionValues: ['yes_know', 'yes_forgot', 'no_want_to', 'no_whats_that'],
  },
  {
    id: 'preview_colors',
    questionKey: 'onboarding.q4.question',
    optionKeys: ['onboarding.q4.opt1', 'onboarding.q4.opt2', 'onboarding.q4.opt3', 'onboarding.q4.opt4'],
    optionValues: ['yes_amazing', 'curious', 'maybe', 'maybe_later'],
  },
];

export default function OnboardingScreen() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { setHasOnboarded } = useOnboarding();
  const { t } = useLanguage();

  // Animation values for slide transitions
  const slideOpacity = useSharedValue(1);
  const slideTranslateY = useSharedValue(0);

  // Rainbow glow animation
  const glowProgress = useSharedValue(0);
  const pulseProgress = useSharedValue(0);

  useEffect(() => {
    // Slowly cycle through colors (10 seconds per full cycle)
    glowProgress.value = withRepeat(
      withTiming(1, { duration: 10000, easing: Easing.linear }),
      -1, // infinite
      false // don't reverse
    );
    // Pulse animation (3 seconds per pulse)
    pulseProgress.value = withRepeat(
      withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.sin) }),
      -1, // infinite
      true // reverse for smooth pulse
    );
  }, []);

  // Pulse intensity increases with progress (Q1=0, Q6=5)
  const pulseIntensity = currentQuestion;

  const glowAnimatedStyle = useAnimatedStyle(() => {
    const glowColor = interpolateColor(
      glowProgress.value,
      [0, 0.16, 0.33, 0.5, 0.66, 0.83, 1],
      ['#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF', '#9B59B6', '#FF6BD6', '#FF6B6B']
    );
    // Pulse shadow radius - gets bigger as user progresses
    const baseRadius = 20 + (pulseIntensity * 3);
    const pulseAmount = 10 + (pulseIntensity * 4);
    const shadowRadius = baseRadius + (pulseProgress.value * pulseAmount);
    return {
      shadowColor: glowColor,
      shadowRadius: shadowRadius,
    };
  });

  const question = questions[currentQuestion];
  const isLastQuestion = currentQuestion === questions.length - 1;

  const animateSlideTransition = useCallback((direction: 'forward' | 'back', callback: () => void) => {
    // Instant transition - no animation
    callback();
  }, []);

  const selectOption = async (value: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const newAnswers = { ...answers, [question.id]: value };
    setAnswers(newAnswers);

    if (isLastQuestion) {
      await AsyncStorage.setItem('onboarding_complete', 'true');
      await AsyncStorage.setItem('onboarding_answers', JSON.stringify(newAnswers));
      setHasOnboarded(true);
      router.replace('/paywall');
    } else {
      animateSlideTransition('forward', () => {
        setCurrentQuestion(currentQuestion + 1);
      });
    }
  };

  const goBack = () => {
    if (currentQuestion > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      animateSlideTransition('back', () => {
        setCurrentQuestion(currentQuestion - 1);
      });
    }
  };

  // Determine which dots are visible based on current slide
  const isDotVisible = (dotIndex: number) => {
    if (currentQuestion === 0) return false;
    if (currentQuestion === 1) return dotIndex < 5;
    if (currentQuestion === 2) return dotIndex < 10;
    return true; // Q4: all dots
  };

  // Determine which swatch cards are visible based on current slide
  const isSwatchVisible = (swatchIndex: number) => {
    if (currentQuestion === 0) return false; // Q1: no swatches
    if (currentQuestion === 1) return swatchIndex < 2; // Q2: 2 swatches
    if (currentQuestion === 2) return swatchIndex < 4; // Q3: 4 swatches
    return true; // Q4: all 6 swatches
  };

  // Animated styles for slide content
  const slideAnimatedStyle = useAnimatedStyle(() => ({
    opacity: slideOpacity.value,
    transform: [{ translateY: slideTranslateY.value }],
  }));

  // Get gradient colors based on progress - starts dark, ends with colorful tints
  const getGradientColors = (): [string, string, string] => {
    if (currentQuestion === 0) return ['#000000', '#000000', '#050505'];
    if (currentQuestion === 1) return ['#0d0510', '#050510', '#0a0515'];
    if (currentQuestion === 2) return ['#180d1c', '#0d0d1c', '#120d22'];
    return ['#281a3a', '#1a1a38', '#201a40']; // Final: rich purple/blue tones
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Progressive gradient background */}
      <LinearGradient
        colors={getGradientColors()}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Color swatch cards */}
      <View style={styles.swatchesContainer}>
        {swatchCards.map((swatch, index) => (
          <SwatchCard
            key={index}
            colors={swatch.colors}
            rotation={swatch.rotation}
            x={swatch.x}
            y={swatch.y}
            visible={isSwatchVisible(index)}
            index={index}
          />
        ))}
      </View>

      {/* Confetti dots */}
      <View style={styles.dotsContainer}>
        {confettiDots.map((dot, index) => (
          <ConfettiDot
            key={index}
            color={rainbowColors[index % rainbowColors.length]}
            x={dot.x}
            y={dot.y}
            size={dot.size}
            visible={isDotVisible(index)}
          />
        ))}
      </View>

      {/* Header with progress and language toggle */}
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <View style={styles.headerRow}>
          <View style={styles.backButtonContainer}>
            {currentQuestion > 0 && (
              <Pressable style={styles.backButton} onPress={goBack}>
                <Text style={styles.backButtonText}>{t('onboarding.back')}</Text>
              </Pressable>
            )}
          </View>
          <View style={styles.progressContainer}>
            {[0, 1, 2, 3, 4].map((index) => (
              <View
                key={index}
                style={[
                  styles.progressDot,
                  index <= currentQuestion && styles.progressDotActive,
                ]}
              />
            ))}
          </View>
          <View style={styles.languageToggleContainer}>
            <LanguageToggle />
          </View>
        </View>
      </View>

      {/* Question with slide animation */}
      <Animated.View style={[styles.content, slideAnimatedStyle]}>
        <Animated.View style={[styles.imageContainer, glowAnimatedStyle]}>
          <Image
            source={slideImages[currentQuestion]}
            style={styles.slideImage}
            contentFit="contain"
          />
        </Animated.View>

        <Text style={styles.questionText}>{t(question.questionKey)}</Text>

        <View style={styles.optionsContainer}>
          {question.optionKeys.map((optionKey, index) => (
            <Pressable
              key={question.optionValues[index]}
              style={({ pressed }) => [
                styles.optionButton,
                pressed && styles.optionButtonPressed,
              ]}
              onPress={() => selectOption(question.optionValues[index])}
            >
              <Text style={styles.optionText}>{t(optionKey)}</Text>
            </Pressable>
          ))}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  swatchesContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  dotsContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  header: {
    paddingHorizontal: 24,
    zIndex: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backButtonContainer: {
    width: 60,
    alignItems: 'flex-start',
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    flex: 1,
  },
  languageToggleContainer: {
    width: 60,
    alignItems: 'flex-end',
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
  backButton: {
    alignSelf: 'flex-start',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    zIndex: 10,
  },
  imageContainer: {
    alignSelf: 'center',
    marginBottom: 24,
    width: 170,
    height: 170,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF6BD6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 25,
    elevation: 10,
  },
  slideImage: {
    width: 150,
    height: 150,
    borderRadius: 16,
  },
  questionText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 40,
    height: 100,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  optionButtonPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  optionText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});

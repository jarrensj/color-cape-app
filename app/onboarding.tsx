import { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Pressable, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useOnboarding } from '@/context/onboarding-context';
import { useRevenueCat } from '@/context/revenuecat-context';
import Animated, {
  useAnimatedStyle,
  withTiming,
  useSharedValue,
  Easing,
} from 'react-native-reanimated';

// Onboarding images for each slide
const slideImages = [
  require('@/assets/images/unicorn.png'),
  require('@/assets/images/unicorn-suit.png'),
  require('@/assets/images/unicorn-cape.png'),
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
  question: string;
  options: { label: string; value: string }[];
};

// Small confetti dots scattered around the screen
const confettiDots = [
  // Slide 2 dots (first wave)
  { x: 30, y: 120, size: 8 },
  { x: screenWidth - 50, y: 180, size: 10 },
  { x: 60, y: screenHeight - 200, size: 6 },
  { x: screenWidth - 40, y: screenHeight - 280, size: 8 },
  { x: screenWidth / 2 + 60, y: 100, size: 7 },
  { x: 25, y: screenHeight / 2 - 50, size: 9 },
  // Slide 3 dots (second wave)
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
    question: 'Do you prefer...',
    options: [
      { label: 'Neutrals', value: 'neutrals' },
      { label: 'Color', value: 'color' },
      { label: 'Mostly neutrals with some color', value: 'mostly_neutrals' },
      { label: "I'm trying to experiment more", value: 'experimenting' },
    ],
  },
  {
    id: 'confidence',
    question: 'How confident are you in choosing colors right now?',
    options: [
      { label: 'Not confident at all', value: 'not_confident' },
      { label: 'A little unsure', value: 'unsure' },
      { label: 'Somewhat confident', value: 'somewhat' },
      { label: 'Very confident', value: 'confident' },
    ],
  },
  {
    id: 'curiosity',
    question: 'Do you wonder what colors could look good on you?',
    options: [
      { label: 'Yes, all the time!', value: 'all_the_time' },
      { label: 'Sometimes I do', value: 'sometimes' },
      { label: 'Not really, but I\'m curious', value: 'curious' },
      { label: 'I already know my colors', value: 'know_already' },
    ],
  },
];

export default function OnboardingScreen() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { setHasOnboarded } = useOnboarding();

  const question = questions[currentQuestion];
  const isLastQuestion = currentQuestion === questions.length - 1;

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
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const goBack = () => {
    if (currentQuestion > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  // Determine which dots are visible based on current slide
  const isDotVisible = (dotIndex: number) => {
    if (currentQuestion === 0) return false; // Slide 1: no dots
    if (currentQuestion === 1) return dotIndex < 6; // Slide 2: first 6 dots
    return true; // Slide 3: all dots
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

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

      {/* Progress indicator */}
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <View style={styles.progressContainer}>
          {questions.map((_, index) => (
            <View
              key={index}
              style={[
                styles.progressDot,
                index <= currentQuestion && styles.progressDotActive,
              ]}
            />
          ))}
        </View>
        {currentQuestion > 0 && (
          <Pressable style={styles.backButton} onPress={goBack}>
            <Text style={styles.backButtonText}>Back</Text>
          </Pressable>
        )}
      </View>

      {/* Question */}
      <View style={styles.content}>
        <Image
          source={slideImages[currentQuestion]}
          style={styles.slideImage}
          contentFit="contain"
        />
        <Text style={styles.questionText}>{question.question}</Text>

        <View style={styles.optionsContainer}>
          {question.options.map((option) => (
            <Pressable
              key={option.value}
              style={({ pressed }) => [
                styles.optionButton,
                pressed && styles.optionButtonPressed,
              ]}
              onPress={() => selectOption(option.value)}
            >
              <Text style={styles.optionText}>{option.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        <Text style={styles.footerText}>
          {currentQuestion + 1} of {questions.length}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  dotsContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  header: {
    paddingHorizontal: 24,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
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
  },
  slideImage: {
    width: 150,
    height: 150,
    alignSelf: 'center',
    marginBottom: 24,
  },
  questionText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 40,
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
  },
  footer: {
    alignItems: 'center',
    paddingTop: 20,
  },
  footerText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.5)',
  },
});

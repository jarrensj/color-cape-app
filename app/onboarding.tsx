import { useState } from 'react';
import { StyleSheet, View, Text, Pressable, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useOnboarding } from '@/context/onboarding-context';

const { width: screenWidth } = Dimensions.get('window');

type Question = {
  id: string;
  question: string;
  options: { label: string; value: string }[];
};

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
      // Save answers and mark onboarding complete
      await AsyncStorage.setItem('onboarding_complete', 'true');
      await AsyncStorage.setItem('onboarding_answers', JSON.stringify(newAnswers));
      setHasOnboarded(true);
      router.replace('/(tabs)');
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

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

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

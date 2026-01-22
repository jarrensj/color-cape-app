import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useState, useRef, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, Dimensions, Pressable, ScrollView, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SwitchCamera, RefreshCw, ChevronLeft, Camera, Home, Save } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useIsFocused, useFocusEffect } from '@react-navigation/native';
import { useTabBar } from '@/contexts/tab-bar-context';
import * as Haptics from 'expo-haptics';
import Svg, { Polygon } from 'react-native-svg';
import { captureRef } from 'react-native-view-shot';
import Animated, {
  useAnimatedStyle,
  withTiming,
  withRepeat,
  useSharedValue,
  interpolateColor,
  Easing,
} from 'react-native-reanimated';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const SAVED_TEST_RESULT_KEY = 'saved_test_result';

// Diagnostic test comparisons - 6 steps total with weights
const diagnosticTests = [
  // UNDERTONE TEST 1: Silver vs Gold (weight 1.5 - most diagnostic)
  {
    id: 'undertone1',
    category: 'undertone',
    weight: 1.5,
    question: 'Which metallic looks better against your skin?',
    optionA: {
      name: 'Silver',
      description: 'Cool metallic',
      colors: [
        { name: 'Silver', hex: '#C0C0C0' },
        { name: 'Platinum', hex: '#E5E4E2' },
        { name: 'Pewter', hex: '#8F8F8F' },
        { name: 'White Gold', hex: '#EBEBEB' },
      ],
    },
    optionB: {
      name: 'Gold',
      description: 'Warm metallic',
      colors: [
        { name: 'Gold', hex: '#FFD700' },
        { name: 'Brass', hex: '#B5A642' },
        { name: 'Bronze', hex: '#CD7F32' },
        { name: 'Champagne', hex: '#F7E7CE' },
      ],
    },
  },
  // UNDERTONE TEST 2: Cool White vs Warm Cream (weight 1.0)
  {
    id: 'undertone2',
    category: 'undertone',
    weight: 1.0,
    question: 'Which neutral white flatters you more?',
    optionA: {
      name: 'Pure White',
      description: 'Crisp and cool',
      colors: [
        { name: 'Pure White', hex: '#FFFFFF' },
        { name: 'Cool Gray', hex: '#E8E8E8' },
        { name: 'Icy Blue', hex: '#F0F8FF' },
        { name: 'Snow', hex: '#FFFAFA' },
      ],
    },
    optionB: {
      name: 'Ivory/Cream',
      description: 'Soft and warm',
      colors: [
        { name: 'Ivory', hex: '#FFFFF0' },
        { name: 'Cream', hex: '#FFFDD0' },
        { name: 'Warm White', hex: '#FFF8F0' },
        { name: 'Eggshell', hex: '#F0EAD6' },
      ],
    },
  },
  // VALUE TEST 1: Light vs Deep (weight 1.2)
  {
    id: 'value1',
    category: 'value',
    weight: 1.2,
    question: 'Which color depth suits you better?',
    optionA: {
      name: 'Light',
      description: 'Soft pastels',
      colors: [
        { name: 'Powder Pink', hex: '#FFB6C1' },
        { name: 'Sky Blue', hex: '#87CEEB' },
        { name: 'Mint', hex: '#98FB98' },
        { name: 'Lavender', hex: '#E6E6FA' },
      ],
    },
    optionB: {
      name: 'Deep',
      description: 'Rich and dark',
      colors: [
        { name: 'Burgundy', hex: '#800020' },
        { name: 'Navy', hex: '#001F3F' },
        { name: 'Forest', hex: '#228B22' },
        { name: 'Plum', hex: '#8E4585' },
      ],
    },
  },
  // VALUE TEST 2: Delicate vs Bold (weight 1.0)
  {
    id: 'value2',
    category: 'value',
    weight: 1.0,
    question: 'Which intensity range looks better on you?',
    optionA: {
      name: 'Delicate',
      description: 'Airy and light',
      colors: [
        { name: 'Blush', hex: '#FFC0CB' },
        { name: 'Periwinkle', hex: '#CCCCFF' },
        { name: 'Seafoam', hex: '#98D7C2' },
        { name: 'Buttercup', hex: '#FFF9C4' },
      ],
    },
    optionB: {
      name: 'Bold',
      description: 'Strong and deep',
      colors: [
        { name: 'Black', hex: '#000000' },
        { name: 'Charcoal', hex: '#36454F' },
        { name: 'Espresso', hex: '#3C2415' },
        { name: 'Midnight', hex: '#191970' },
      ],
    },
  },
  // CHROMA TEST 1: Bright/Clear vs Soft/Muted (weight 1.2)
  {
    id: 'chroma1',
    category: 'chroma',
    weight: 1.2,
    question: 'Which color clarity suits you?',
    optionA: {
      name: 'Bright',
      description: 'Clear and vivid',
      colors: [
        { name: 'True Red', hex: '#FF0000' },
        { name: 'Cobalt', hex: '#0047AB' },
        { name: 'Emerald', hex: '#50C878' },
        { name: 'Fuchsia', hex: '#FF00FF' },
      ],
    },
    optionB: {
      name: 'Soft',
      description: 'Muted and gentle',
      colors: [
        { name: 'Dusty Rose', hex: '#D4A5A5' },
        { name: 'Slate Blue', hex: '#6A8EAE' },
        { name: 'Sage', hex: '#A2B5AC' },
        { name: 'Mauve', hex: '#E0B0FF' },
      ],
    },
  },
  // CHROMA TEST 2: Saturated vs Toned (weight 1.0)
  {
    id: 'chroma2',
    category: 'chroma',
    weight: 1.0,
    question: 'Which saturation level flatters you?',
    optionA: {
      name: 'Saturated',
      description: 'Punchy and electric',
      colors: [
        { name: 'Hot Pink', hex: '#FF69B4' },
        { name: 'Electric Blue', hex: '#7DF9FF' },
        { name: 'Lime', hex: '#32CD32' },
        { name: 'Orange', hex: '#FF8C00' },
      ],
    },
    optionB: {
      name: 'Toned',
      description: 'Greyed and subtle',
      colors: [
        { name: 'Taupe', hex: '#8B8589' },
        { name: 'Steel Blue', hex: '#4682B4' },
        { name: 'Olive', hex: '#808000' },
        { name: 'Mushroom', hex: '#9F8170' },
      ],
    },
  },
];

// 12 Sub-season results with their palettes
const subSeasonResults: Record<string, {
  name: string;
  season: string;
  description: string;
  characteristics: string[];
  colors: { name: string; hex: string }[];
  tips: string[];
  celebrities?: string[];
}> = {
  // SPRING SUB-SEASONS (Warm base)
  lightSpring: {
    name: 'Light Spring',
    season: 'Spring',
    description: 'Light, warm, and fresh like early spring sunshine',
    characteristics: ['Warm undertone', 'Light coloring', 'Clear but gentle'],
    colors: [
      { name: 'Peach', hex: '#FFCC99' },
      { name: 'Light Coral', hex: '#F08080' },
      { name: 'Buttercup', hex: '#F9E547' },
      { name: 'Mint', hex: '#98FB98' },
      { name: 'Warm Aqua', hex: '#7FDBDA' },
      { name: 'Warm Lilac', hex: '#DCD0FF' },
      { name: 'Warm Pink', hex: '#FFB6C1' },
      { name: 'Ivory', hex: '#FFFFF0' },
    ],
    tips: [
      'Stick to light, warm colors that have a golden undertone',
      'Avoid dark, heavy colors that can overwhelm your delicate coloring',
      'Gold jewelry will complement your warm undertone beautifully',
      'Your best neutrals are ivory, camel, and warm beige',
    ],
  },
  warmSpring: {
    name: 'Warm Spring',
    season: 'Spring',
    description: 'Golden, vibrant, and sunny like peak spring',
    characteristics: ['Very warm undertone', 'Medium coloring', 'Clear and warm'],
    colors: [
      { name: 'Coral', hex: '#FF7F50' },
      { name: 'Tangerine', hex: '#FF9966' },
      { name: 'Golden Yellow', hex: '#FFD700' },
      { name: 'Yellow Green', hex: '#9ACD32' },
      { name: 'Turquoise', hex: '#40E0D0' },
      { name: 'Salmon', hex: '#FA8072' },
      { name: 'Apricot', hex: '#FBCEB1' },
      { name: 'Warm White', hex: '#FFF8F0' },
    ],
    tips: [
      'Embrace golden, sunny colors that match your warm glow',
      'Avoid cool colors like icy pink, blue-based red, or silver',
      'Gold and brass jewelry will enhance your natural warmth',
      'Your best neutrals are cream, camel, and warm brown',
    ],
  },
  brightSpring: {
    name: 'Bright Spring',
    season: 'Spring',
    description: 'Clear, warm, and vivid like a tropical paradise',
    characteristics: ['Warm undertone', 'High contrast', 'Very clear and bright'],
    colors: [
      { name: 'Bright Coral', hex: '#FF6B6B' },
      { name: 'Orange Red', hex: '#FF4500' },
      { name: 'Bright Yellow', hex: '#FFEF00' },
      { name: 'Kelly Green', hex: '#4CBB17' },
      { name: 'Warm Turquoise', hex: '#48D1CC' },
      { name: 'Hot Pink', hex: '#FF69B4' },
      { name: 'Bright Aqua', hex: '#20B2AA' },
      { name: 'Pure White', hex: '#FFFFFF' },
    ],
    tips: [
      'Go for clear, vivid colors that make a statement',
      'Avoid muted, dusty, or muddy colors that dull your sparkle',
      'Both gold and warm-toned silver work well for you',
      'Your best neutrals are bright white, warm navy, and camel',
    ],
  },
  // SUMMER SUB-SEASONS (Cool base)
  lightSummer: {
    name: 'Light Summer',
    season: 'Summer',
    description: 'Soft, cool, and delicate like a misty morning',
    characteristics: ['Cool undertone', 'Light coloring', 'Soft and gentle'],
    colors: [
      { name: 'Powder Pink', hex: '#E8C4C4' },
      { name: 'Rose', hex: '#E8ADAA' },
      { name: 'Lavender', hex: '#B4A7D6' },
      { name: 'Periwinkle', hex: '#CCCCFF' },
      { name: 'Powder Blue', hex: '#B0E0E6' },
      { name: 'Blue Sage', hex: '#A2B5AC' },
      { name: 'Mauve', hex: '#E0B0FF' },
      { name: 'Soft White', hex: '#F5F5F5' },
    ],
    tips: [
      'Choose soft, cool, muted colors with a gentle quality',
      'Avoid harsh, bright, or overly warm colors',
      'Silver and rose gold jewelry suit your cool, soft coloring',
      'Your best neutrals are soft white, dove gray, and cocoa',
    ],
  },
  coolSummer: {
    name: 'Cool Summer',
    season: 'Summer',
    description: 'Cool, soft, and elegant like twilight',
    characteristics: ['Very cool undertone', 'Medium coloring', 'Soft but noticeable'],
    colors: [
      { name: 'Dusty Rose', hex: '#D8B0B0' },
      { name: 'Soft Raspberry', hex: '#B56576' },
      { name: 'Soft Plum', hex: '#8E4585' },
      { name: 'Blue Gray', hex: '#6699CC' },
      { name: 'Teal', hex: '#367588' },
      { name: 'Cool Pink', hex: '#D4869C' },
      { name: 'Slate Blue', hex: '#6A5ACD' },
      { name: 'Cocoa', hex: '#875F5F' },
    ],
    tips: [
      'Choose cool, slightly muted colors with blue undertones',
      'Avoid warm, golden colors and anything too bright or harsh',
      'Silver and white gold jewelry complement your cool tones',
      'Your best neutrals are charcoal, navy, and cool brown',
    ],
  },
  softSummer: {
    name: 'Soft Summer',
    season: 'Summer',
    description: 'Muted, cool, and gentle like an overcast day',
    characteristics: ['Cool-neutral undertone', 'Medium coloring', 'Very soft and muted'],
    colors: [
      { name: 'Dusty Pink', hex: '#D4A5A5' },
      { name: 'Soft Red', hex: '#CD5C5C' },
      { name: 'Mauve', hex: '#AF8EDA' },
      { name: 'Soft Blue', hex: '#6B8CAE' },
      { name: 'Gray Green', hex: '#7BA99F' },
      { name: 'Taupe', hex: '#8B8589' },
      { name: 'Plum', hex: '#8E4585' },
      { name: 'Cool White', hex: '#F0F0F0' },
    ],
    tips: [
      'Embrace dusty, muted, soft colors that blend harmoniously',
      'Avoid high contrast, neon brights, or pure black and white',
      'Silver and rose gold with a matte finish work beautifully',
      'Your best neutrals are taupe, soft gray, and muted cocoa',
    ],
  },
  // AUTUMN SUB-SEASONS (Warm base)
  softAutumn: {
    name: 'Soft Autumn',
    season: 'Autumn',
    description: 'Muted, warm, and earthy like early fall',
    characteristics: ['Warm-neutral undertone', 'Medium coloring', 'Very soft and muted'],
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
    tips: [
      'Choose soft, muted, earthy colors with a warm base',
      'Avoid bright, clear colors and cool-toned shades',
      'Matte gold and bronze jewelry enhance your natural warmth',
      'Your best neutrals are cream, camel, and warm taupe',
    ],
  },
  warmAutumn: {
    name: 'Warm Autumn',
    season: 'Autumn',
    description: 'Rich, warm, and spicy like peak fall foliage',
    characteristics: ['Very warm undertone', 'Medium-deep coloring', 'Warm and earthy'],
    colors: [
      { name: 'Rust', hex: '#B7410E' },
      { name: 'Pumpkin', hex: '#FF7518' },
      { name: 'Gold', hex: '#D4AF37' },
      { name: 'Olive', hex: '#556B2F' },
      { name: 'Warm Teal', hex: '#2E8B7B' },
      { name: 'Warm Brown', hex: '#704214' },
      { name: 'Burnt Orange', hex: '#CC5500' },
      { name: 'Buff', hex: '#F0DC82' },
    ],
    tips: [
      'Go for rich, warm, earthy colors with golden undertones',
      'Avoid cool pastels, icy colors, and blue-based shades',
      'Gold, brass, and copper jewelry will make you glow',
      'Your best neutrals are chocolate, olive, and warm cream',
    ],
  },
  deepAutumn: {
    name: 'Deep Autumn',
    season: 'Autumn',
    description: 'Deep, warm, and intense like late autumn',
    characteristics: ['Warm undertone', 'Deep coloring', 'Rich and intense'],
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
    tips: [
      'Embrace deep, rich, warm colors with intensity',
      'Avoid light pastels and cool, icy shades',
      'Antique gold and bronze jewelry suits your depth',
      'Your best neutrals are chocolate, forest green, and burgundy',
    ],
  },
  // WINTER SUB-SEASONS (Cool base)
  deepWinter: {
    name: 'Deep Winter',
    season: 'Winter',
    description: 'Deep, cool, and striking like midnight',
    characteristics: ['Cool undertone', 'Deep coloring', 'High contrast'],
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
    tips: [
      'Choose deep, cool colors with clear undertones',
      'Avoid warm, muted, or earthy tones',
      'Silver, platinum, and white gold jewelry enhance your drama',
      'Your best neutrals are black, charcoal, and navy',
    ],
  },
  coolWinter: {
    name: 'Cool Winter',
    season: 'Winter',
    description: 'Cool, icy, and dramatic like a winter wonderland',
    characteristics: ['Very cool undertone', 'Medium-deep coloring', 'Clear and icy'],
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
    tips: [
      'Choose icy, cool colors with blue undertones',
      'Avoid warm, earthy, or muted tones',
      'Silver and platinum jewelry will complement your cool coloring',
      'Your best neutrals are pure black, pure white, and navy',
    ],
  },
  brightWinter: {
    name: 'Bright Winter',
    season: 'Winter',
    description: 'Vivid, cool, and bold like fresh snow in sunlight',
    characteristics: ['Cool undertone', 'High contrast', 'Very clear and bright'],
    colors: [
      { name: 'Hot Pink', hex: '#FF69B4' },
      { name: 'True Red', hex: '#FF0000' },
      { name: 'Electric Blue', hex: '#0000FF' },
      { name: 'Bright Green', hex: '#00C957' },
      { name: 'Violet', hex: '#8B00FF' },
      { name: 'Lemon Yellow', hex: '#FFF44F' },
      { name: 'Cyan', hex: '#00FFFF' },
      { name: 'Pure White', hex: '#FFFFFF' },
    ],
    tips: [
      'Go for vivid, clear, cool colors that pop',
      'Avoid muted, dusty, or warm earth tones',
      'Silver and cool-toned jewelry matches your brightness',
      'Your best neutrals are pure white, black, and bright navy',
    ],
  },
};

// Function to determine sub-season based on scores
function determineSubSeason(
  undertoneScore: number, // negative = cool, positive = warm
  valueScore: number,     // negative = light, positive = deep
  chromaScore: number     // negative = bright, positive = soft/muted
): string {
  const isCool = undertoneScore < 0;
  const isWarm = undertoneScore > 0;
  const isLight = valueScore < 0;
  const isDeep = valueScore > 0;
  const isBright = chromaScore < 0;
  const isSoft = chromaScore > 0;

  // Determine base season and sub-season
  if (isWarm) {
    // SPRING or AUTUMN
    if (isBright || isLight) {
      // SPRING
      if (Math.abs(valueScore) > Math.abs(chromaScore) && isLight) {
        return 'lightSpring';
      } else if (Math.abs(chromaScore) > Math.abs(valueScore) && isBright) {
        return 'brightSpring';
      } else {
        return 'warmSpring';
      }
    } else {
      // AUTUMN
      if (Math.abs(valueScore) > Math.abs(chromaScore) && isDeep) {
        return 'deepAutumn';
      } else if (Math.abs(chromaScore) > Math.abs(valueScore) && isSoft) {
        return 'softAutumn';
      } else {
        return 'warmAutumn';
      }
    }
  } else {
    // WINTER or SUMMER (cool)
    if (isBright || isDeep) {
      // WINTER
      if (Math.abs(valueScore) > Math.abs(chromaScore) && isDeep) {
        return 'deepWinter';
      } else if (Math.abs(chromaScore) > Math.abs(valueScore) && isBright) {
        return 'brightWinter';
      } else {
        return 'coolWinter';
      }
    } else {
      // SUMMER
      if (Math.abs(valueScore) > Math.abs(chromaScore) && isLight) {
        return 'lightSummer';
      } else if (Math.abs(chromaScore) > Math.abs(valueScore) && isSoft) {
        return 'softSummer';
      } else {
        return 'coolSummer';
      }
    }
  }
}

type TestStep = 'intro' | 'capture1' | 'capture2' | 'compare' | 'result';
type TestScores = {
  undertone: number; // negative = cool, positive = warm
  value: number;     // negative = light, positive = deep
  chroma: number;    // negative = bright, positive = soft
};

type SubSeasonMatch = {
  key: string;
  name: string;
  score: number;
  percentage: number;
};

// Calculate how well scores match each sub-season
// Returns sorted array of matches with percentages
function calculateTopMatches(scores: TestScores): SubSeasonMatch[] {
  const { undertone, value, chroma } = scores;

  // Define ideal score profiles for each sub-season
  // [undertone, value, chroma] where negative = cool/light/bright, positive = warm/deep/soft
  const profiles: Record<string, [number, number, number]> = {
    // Springs (warm)
    lightSpring: [2.5, -2.2, -1.2],    // warm, light, bright-ish
    warmSpring: [2.5, 0, -1.2],         // warm, medium, clear
    brightSpring: [1.5, -1.2, -2.2],    // warm, light-ish, very bright
    // Summers (cool)
    lightSummer: [-2.5, -2.2, 1.2],     // cool, light, soft
    coolSummer: [-2.5, 0, 1.2],         // cool, medium, soft
    softSummer: [-1.5, 0, 2.2],         // neutral-cool, medium, very soft
    // Autumns (warm)
    softAutumn: [1.5, 0, 2.2],          // neutral-warm, medium, very soft
    warmAutumn: [2.5, 1.2, 1.2],        // warm, medium-deep, warm
    deepAutumn: [1.5, 2.2, 1.2],        // warm, deep, muted
    // Winters (cool)
    deepWinter: [-1.5, 2.2, -1.2],      // cool, deep, bright-ish
    coolWinter: [-2.5, 1.2, -1.2],      // very cool, medium-deep, clear
    brightWinter: [-1.5, -1.2, -2.2],   // cool, light-ish, very bright
  };

  // Calculate distance from each profile (lower = better match)
  const matches: SubSeasonMatch[] = Object.entries(profiles).map(([key, [u, v, c]]) => {
    // Euclidean distance weighted
    const distance = Math.sqrt(
      Math.pow(undertone - u, 2) * 1.5 +  // undertone is most important
      Math.pow(value - v, 2) +
      Math.pow(chroma - c, 2)
    );

    // Convert distance to a score (0-100, higher is better match)
    // Max possible distance is about 10, so we scale accordingly
    const maxDistance = 10;
    const score = Math.max(0, 100 - (distance / maxDistance) * 100);

    return {
      key,
      name: subSeasonResults[key].name,
      score: distance,
      percentage: Math.round(score),
    };
  });

  // Sort by percentage (highest first)
  matches.sort((a, b) => b.percentage - a.percentage);

  return matches;
}

// Check if scores are neutral (close to 0)
function getScoreLabel(score: number, category: 'undertone' | 'value' | 'chroma'): string {
  const threshold = 0.8; // Close to 0 means neutral

  if (category === 'undertone') {
    if (Math.abs(score) < threshold) return 'Neutral';
    return score < 0 ? 'Cool' : 'Warm';
  } else if (category === 'value') {
    if (Math.abs(score) < threshold) return 'Medium';
    return score < 0 ? 'Light' : 'Deep';
  } else {
    if (Math.abs(score) < threshold) return 'Moderate';
    return score < 0 ? 'Bright' : 'Soft';
  }
}

const TOTAL_TESTS = diagnosticTests.length;

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

// Full cape for result
function FullCape({ colors, opacity = 0.85 }: { colors: { name: string; hex: string }[]; opacity?: number }) {
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
              opacity={opacity}
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
  const [currentTestIndex, setCurrentTestIndex] = useState(0);
  const [scores, setScores] = useState<TestScores>({ undertone: 0, value: 0, chroma: 0 });
  const [testPhotos, setTestPhotos] = useState<{ photo1: string | null; photo2: string | null }[]>(
    diagnosticTests.map(() => ({ photo1: null, photo2: null }))
  );
  const [resultSubSeason, setResultSubSeason] = useState<string | null>(null);
  const [topMatches, setTopMatches] = useState<SubSeasonMatch[]>([]);
  const [previewSeason, setPreviewSeason] = useState<string | null>(null);
  const [resultSaved, setResultSaved] = useState(false);
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<CameraView>(null);
  const compositeRef = useRef<View>(null);
  const [pendingCapture, setPendingCapture] = useState<{ uri: string; forStep: 'capture1' | 'capture2' } | null>(null);
  const [compareIndex, setCompareIndex] = useState(0);
  const [capeOpacity, setCapeOpacity] = useState(0.85);
  const router = useRouter();
  const isFocused = useIsFocused();
  const { setTabBarVisible } = useTabBar();

  // Rainbow glow animation for intro image
  const glowProgress = useSharedValue(0);
  const pulseProgress = useSharedValue(0);

  useEffect(() => {
    // Slowly cycle through colors (10 seconds per full cycle)
    glowProgress.value = withRepeat(
      withTiming(1, { duration: 10000, easing: Easing.linear }),
      -1,
      false
    );
    // Pulse animation (3 seconds per pulse)
    pulseProgress.value = withRepeat(
      withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
  }, []);

  const introGlowStyle = useAnimatedStyle(() => {
    const glowColor = interpolateColor(
      glowProgress.value,
      [0, 0.16, 0.33, 0.5, 0.66, 0.83, 1],
      ['#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF', '#9B59B6', '#FF6BD6', '#FF6B6B']
    );
    const shadowRadius = 25 + (pulseProgress.value * 20);
    return {
      shadowColor: glowColor,
      shadowRadius: shadowRadius,
    };
  });

  // Load cape opacity setting when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem('cape_opacity').then((value) => {
        if (value !== null) {
          setCapeOpacity(parseFloat(value));
        }
      });
    }, [])
  );

  // Hide tab bar during test-taking (all steps except intro)
  useEffect(() => {
    setTabBarVisible(step === 'intro');
  }, [step, setTabBarVisible]);

  // Restore tab bar when leaving the screen entirely
  useEffect(() => {
    return () => {
      setTabBarVisible(true);
    };
  }, [setTabBarVisible]);

  // Effect to capture the composite (photo + overlay) when pendingCapture is set
  useEffect(() => {
    if (!pendingCapture || !compositeRef.current) return;

    const captureComposite = async () => {
      try {
        // Small delay to ensure the Image is rendered
        await new Promise(resolve => setTimeout(resolve, 100));

        const compositeUri = await captureRef(compositeRef, {
          format: 'jpg',
          quality: 0.9,
        });

        if (pendingCapture.forStep === 'capture1') {
          setPhoto1(compositeUri);
          setStep('capture2');
        } else if (pendingCapture.forStep === 'capture2') {
          setPhoto2(compositeUri);
          setStep('compare');
        }
      } catch (error) {
        console.error('Failed to capture composite:', error);
      } finally {
        setPendingCapture(null);
      }
    };

    captureComposite();
  }, [pendingCapture]);

  const currentTest = diagnosticTests[currentTestIndex];
  const photo1 = testPhotos[currentTestIndex]?.photo1 ?? null;
  const photo2 = testPhotos[currentTestIndex]?.photo2 ?? null;

  const setPhoto1 = (uri: string | null) => {
    setTestPhotos(prev => {
      const updated = [...prev];
      updated[currentTestIndex] = { ...updated[currentTestIndex], photo1: uri };
      return updated;
    });
  };

  const setPhoto2 = (uri: string | null) => {
    setTestPhotos(prev => {
      const updated = [...prev];
      updated[currentTestIndex] = { ...updated[currentTestIndex], photo2: uri };
      return updated;
    });
  };

  const goHome = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/');
  };

  const exitTest = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(
      'Exit Test?',
      'Your test progress will be lost.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Exit',
          style: 'destructive',
          onPress: () => {
            resetTest();
            router.push('/');
          },
        },
      ]
    );
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
    setCurrentTestIndex(0);
    setScores({ undertone: 0, value: 0, chroma: 0 });
    setTestPhotos(diagnosticTests.map(() => ({ photo1: null, photo2: null })));
    setResultSubSeason(null);
    setTopMatches([]);
    setPreviewSeason(null);
    setPendingCapture(null);
    setCompareIndex(0);
    setResultSaved(false);
  };

  const saveTestResult = async () => {
    if (!resultSubSeason || resultSaved) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const seasonData = subSeasonResults[resultSubSeason];
    const resultData = {
      subSeason: resultSubSeason,
      name: seasonData.name,
      colors: seasonData.colors.slice(0, 4),
      scores: scores,
      topMatches: topMatches.slice(0, 3),
      savedAt: Date.now(),
    };

    await AsyncStorage.setItem(SAVED_TEST_RESULT_KEY, JSON.stringify(resultData));
    setResultSaved(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const goBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step === 'capture1') {
      if (currentTestIndex === 0) {
        // First test - go to intro
        setStep('intro');
      } else {
        // Go back to previous test's compare
        setCurrentTestIndex(currentTestIndex - 1);
        setStep('compare');
      }
    } else if (step === 'capture2') {
      setStep('capture1');
    } else if (step === 'compare') {
      setStep('capture2');
    } else if (step === 'result') {
      // Go back to last test's compare
      setStep('compare');
    }
  };

  const startTest = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setStep('capture1');
    setCurrentTestIndex(0);
    setScores({ undertone: 0, value: 0, chroma: 0 });
    setTestPhotos(diagnosticTests.map(() => ({ photo1: null, photo2: null })));
  };

  const takePhoto = async () => {
    if (!cameraRef.current) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const result = await cameraRef.current.takePictureAsync();

    if (result && (step === 'capture1' || step === 'capture2')) {
      // Set pending capture - this triggers the composite capture via useEffect
      setPendingCapture({ uri: result.uri, forStep: step });
    }
  };

  const selectOption = (option: 'A' | 'B') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const selectedOption = option === 'A' ? currentTest.optionA : currentTest.optionB;
    // Apply weighted scoring: A = cool/light/bright (-), B = warm/deep/soft (+)
    const scoreChange = (option === 'A' ? -1 : 1) * currentTest.weight;

    Alert.alert(
      'Confirm Selection',
      `You selected "${selectedOption.name}". Continue?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Continue',
          onPress: () => {
            // Update score based on category
            const newScores = { ...scores };
            if (currentTest.category === 'undertone') {
              newScores.undertone += scoreChange;
            } else if (currentTest.category === 'value') {
              newScores.value += scoreChange;
            } else if (currentTest.category === 'chroma') {
              newScores.chroma += scoreChange;
            }
            setScores(newScores);

            // Move to next test or show result
            if (currentTestIndex < TOTAL_TESTS - 1) {
              setCurrentTestIndex(currentTestIndex + 1);
              setCompareIndex(0);
              setStep('capture1');
            } else {
              // Calculate result and top matches
              const subSeason = determineSubSeason(newScores.undertone, newScores.value, newScores.chroma);
              const matches = calculateTopMatches(newScores);
              setResultSubSeason(subSeason);
              setTopMatches(matches);
              setStep('result');
            }
          },
        },
      ]
    );
  };

  // Get current overlay colors based on which photo we're taking
  const getCurrentOverlay = () => {
    return step === 'capture1' ? currentTest.optionA : currentTest.optionB;
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
          <Animated.View style={[styles.introImageContainer, introGlowStyle]}>
            <Image
              source={require('@/assets/images/unicorn-cape.png')}
              style={styles.introImage}
              contentFit="contain"
            />
          </Animated.View>
          <Text style={styles.introTitle}>Find Your Colors</Text>
          <Text style={styles.introSubtitle}>
            Discover your perfect color sub-season
          </Text>

          <View style={styles.stepsContainer}>
            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <Text style={styles.stepText}>Undertone: Cool vs Warm</Text>
            </View>
            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <Text style={styles.stepText}>Value: Light vs Deep</Text>
            </View>
            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <Text style={styles.stepText}>Chroma: Bright vs Soft</Text>
            </View>
          </View>

          <Pressable style={styles.startButton} onPress={startTest}>
            <Text style={styles.startButtonText}>Start Test</Text>
          </Pressable>

          <Pressable style={styles.goHomeButton} onPress={goHome}>
            <Text style={styles.goHomeButtonText}>Go back home</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // Result screen
  if (step === 'result' && resultSubSeason) {
    const displayedSeasonKey = previewSeason || resultSubSeason;
    const displayedSeason = subSeasonResults[displayedSeasonKey];
    const originalResult = subSeasonResults[resultSubSeason];
    const top3Matches = topMatches.slice(0, 3);
    const isPreview = previewSeason && previewSeason !== resultSubSeason;

    const selectPreview = (seasonKey: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setPreviewSeason(seasonKey);
    };

    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        {isFocused ? (
          <CameraView style={styles.camera} facing={facing} ref={cameraRef} mirror={facing === 'front'}>
            <FullCape colors={displayedSeason.colors} opacity={capeOpacity} />

            <View style={[styles.resultHeader, { paddingTop: insets.top + 12 }]}>
            <Pressable style={styles.backButton} onPress={goBack}>
              <ChevronLeft size={28} color="#FFFFFF" strokeWidth={2} />
            </Pressable>
            <View style={styles.resultTitleContainer}>
              <Text style={styles.resultTitle}>
                {isPreview ? `Previewing ${displayedSeason.name}` : `You are a ${originalResult.name}!`}
              </Text>
              <Text style={styles.resultDescription}>{displayedSeason.description}</Text>
            </View>
            <Pressable style={styles.flipButton} onPress={toggleCameraFacing}>
              <SwitchCamera size={24} color="#FFFFFF" strokeWidth={2} />
            </Pressable>
          </View>

          <ScrollView
            style={[styles.resultScrollView, { paddingBottom: insets.bottom + 20 }]}
            contentContainerStyle={styles.resultScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Score Breakdown */}
            <View style={styles.scoreBreakdownContainer}>
              <Text style={styles.sectionTitle}>Your Color Profile</Text>
              <View style={styles.scoreRow}>
                <Text style={styles.scoreLabel}>Undertone:</Text>
                <View style={[styles.scoreBadge, scores.undertone < 0 ? styles.scoreBadgeCool : styles.scoreBadgeWarm]}>
                  <Text style={styles.scoreBadgeText}>{getScoreLabel(scores.undertone, 'undertone')}</Text>
                </View>
              </View>
              <View style={styles.scoreRow}>
                <Text style={styles.scoreLabel}>Value:</Text>
                <View style={[styles.scoreBadge, scores.value < 0 ? styles.scoreBadgeLight : styles.scoreBadgeDeep]}>
                  <Text style={styles.scoreBadgeText}>{getScoreLabel(scores.value, 'value')}</Text>
                </View>
              </View>
              <View style={styles.scoreRow}>
                <Text style={styles.scoreLabel}>Chroma:</Text>
                <View style={[styles.scoreBadge, scores.chroma < 0 ? styles.scoreBadgeBright : styles.scoreBadgeSoft]}>
                  <Text style={styles.scoreBadgeText}>{getScoreLabel(scores.chroma, 'chroma')}</Text>
                </View>
              </View>
            </View>

            {/* Top Matches - All Tappable */}
            <View style={styles.topMatchesContainer}>
              <Text style={styles.sectionTitle}>Your Matches</Text>
              <Text style={styles.matchesHint}>Tap to preview colors</Text>
              <View style={styles.matchesRow}>
                {top3Matches.map((match, index) => (
                  <Pressable
                    key={match.key}
                    style={[
                      styles.matchOption,
                      displayedSeasonKey === match.key && styles.matchOptionSelected,
                      index !== 0 && styles.matchOptionAlt,
                    ]}
                    onPress={() => selectPreview(match.key)}
                  >
                    {index === 0 && <Text style={styles.bestMatchLabel}>Best</Text>}
                    <Text style={[
                      styles.matchOptionName,
                      displayedSeasonKey === match.key && styles.matchOptionNameSelected,
                    ]}>{match.name}</Text>
                    <Text style={[
                      styles.matchOptionPercent,
                      displayedSeasonKey === match.key && styles.matchOptionPercentSelected,
                    ]}>{match.percentage}%</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Styling Tips */}
            <View style={styles.tipsContainer}>
              <Text style={styles.sectionTitle}>Styling Tips for {displayedSeason.name}</Text>
              {displayedSeason.tips.map((tip, index) => (
                <View key={index} style={styles.tipItem}>
                  <Text style={styles.tipBullet}>•</Text>
                  <Text style={styles.tipText}>{tip}</Text>
                </View>
              ))}
            </View>

            {/* Action Buttons */}
            <View style={styles.resultButtons}>
              <Pressable
                style={[styles.saveResultButton, resultSaved && styles.saveResultButtonSaved]}
                onPress={saveTestResult}
                disabled={resultSaved}
              >
                <Save size={20} color={resultSaved ? '#34C759' : '#FFFFFF'} strokeWidth={2} />
                <Text style={[styles.saveResultButtonText, resultSaved && styles.saveResultButtonTextSaved]}>
                  {resultSaved ? 'Saved!' : 'Save Result'}
                </Text>
              </Pressable>

              <Pressable style={styles.retakeButton} onPress={resetTest}>
                <RefreshCw size={20} color="#000000" strokeWidth={2} />
                <Text style={styles.retakeButtonText}>Retake Test</Text>
              </Pressable>

              <Pressable style={styles.homeButtonResult} onPress={goHome}>
                <Home size={20} color="#FFFFFF" strokeWidth={2} />
                <Text style={styles.homeButtonResultText}>Go Home</Text>
              </Pressable>
            </View>
          </ScrollView>
          </CameraView>
        ) : (
          <View style={styles.camera} />
        )}
      </View>
    );
  }

  // Capture screens (capture1 and capture2)
  if (step === 'capture1' || step === 'capture2') {
    const overlay = getCurrentOverlay();
    const isFirst = step === 'capture1';
    const instruction = isFirst
      ? `Take a photo with ${overlay.name} colors`
      : `Now take a photo with ${overlay.name} colors`;

    return (
      <View style={styles.container}>
        <StatusBar style="light" />

        {isFocused ? (
          <CameraView
            style={StyleSheet.absoluteFill}
            facing={facing}
            ref={cameraRef}
            mirror={facing === 'front'}
          >
            <FullCape colors={overlay.colors} opacity={capeOpacity} />
          </CameraView>
        ) : (
          <View style={StyleSheet.absoluteFill} />
        )}

        {/* Hidden composite view for capturing photo + overlay */}
        {pendingCapture && (
          <View
            ref={compositeRef}
            style={styles.compositeView}
            collapsable={false}
          >
            <Image source={{ uri: pendingCapture.uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
            <FullCape colors={overlay.colors} opacity={capeOpacity} />
          </View>
        )}

        {/* Header */}
        <View style={[styles.captureHeader, { paddingTop: insets.top + 12 }]}>
          <Pressable style={styles.backButton} onPress={goBack}>
            <ChevronLeft size={28} color="#FFFFFF" strokeWidth={2} />
          </Pressable>
          <View style={styles.captureHeaderText}>
            <Text style={styles.captureTitle}>{overlay.name}</Text>
            <Text style={styles.captureSubtitle}>{overlay.description}</Text>
          </View>
          <View style={{ width: 44 }} />
        </View>

        {/* Instruction */}
        <View style={styles.instructionBanner}>
          <Text style={styles.instructionText}>{instruction}</Text>
        </View>

        {/* Capture button */}
        <View style={[styles.captureControls, { paddingBottom: insets.bottom + 20 }]}>
          <Pressable style={styles.exitTestButton} onPress={exitTest}>
            <Home size={20} color="#FFFFFF" strokeWidth={2} />
          </Pressable>
          <Pressable style={styles.captureButton} onPress={takePhoto}>
            <Camera size={32} color="#000000" strokeWidth={2} />
          </Pressable>
          <Pressable style={styles.flipButtonSmall} onPress={toggleCameraFacing}>
            <SwitchCamera size={20} color="#FFFFFF" strokeWidth={2} />
          </Pressable>
        </View>
      </View>
    );
  }

  // Compare screen
  if (step === 'compare' && photo1 && photo2) {
    const currentOption = compareIndex === 0 ? currentTest.optionA : currentTest.optionB;
    const currentPhoto = compareIndex === 0 ? photo1 : photo2;

    const handleScroll = (event: any) => {
      const offsetX = event.nativeEvent.contentOffset.x;
      const newIndex = Math.round(offsetX / screenWidth);
      if (newIndex !== compareIndex) {
        setCompareIndex(newIndex);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    };

    return (
      <View style={styles.container}>
        <StatusBar style="light" />

        {/* Full-screen swipeable photos */}
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleScroll}
          style={StyleSheet.absoluteFill}
        >
          {/* Option A */}
          <View style={styles.compareFullPage}>
            <Image source={{ uri: photo1 }} style={StyleSheet.absoluteFill} contentFit="cover" />
          </View>
          {/* Option B */}
          <View style={styles.compareFullPage}>
            <Image source={{ uri: photo2 }} style={StyleSheet.absoluteFill} contentFit="cover" />
          </View>
        </ScrollView>

        {/* Header */}
        <View style={[styles.compareHeader, { paddingTop: insets.top + 12 }]}>
          <Pressable style={styles.backButton} onPress={goBack}>
            <ChevronLeft size={28} color="#FFFFFF" strokeWidth={2} />
          </Pressable>
          <View style={styles.compareHeaderCenter}>
            <Text style={styles.compareOptionTitle}>{currentOption.name}</Text>
            <Text style={styles.compareOptionSubtitle}>{currentOption.description}</Text>
          </View>
          <Pressable style={styles.exitTestButtonHeader} onPress={exitTest}>
            <Home size={22} color="#FFFFFF" strokeWidth={2} />
          </Pressable>
        </View>

        {/* Footer */}
        <View style={[styles.compareFooterNew, { paddingBottom: insets.bottom + 20 }]}>
          <Text style={styles.compareQuestion}>{currentTest.question}</Text>

          {/* Page indicators */}
          <View style={styles.pageIndicators}>
            <View style={[styles.pageIndicator, compareIndex === 0 && styles.pageIndicatorActive]} />
            <View style={[styles.pageIndicator, compareIndex === 1 && styles.pageIndicatorActive]} />
          </View>

          <Text style={styles.swipeHint}>Swipe to compare</Text>

          {/* Selection buttons */}
          <View style={styles.selectionButtons}>
            <Pressable
              style={[styles.selectButton, compareIndex === 0 && styles.selectButtonHighlight]}
              onPress={() => selectOption('A')}
            >
              <Text style={styles.selectButtonText}>Choose {currentTest.optionA.name}</Text>
            </Pressable>
            <Pressable
              style={[styles.selectButton, compareIndex === 1 && styles.selectButtonHighlight]}
              onPress={() => selectOption('B')}
            >
              <Text style={styles.selectButtonText}>Choose {currentTest.optionB.name}</Text>
            </Pressable>
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
  compositeView: {
    position: 'absolute',
    top: -screenHeight * 2,
    left: 0,
    width: screenWidth,
    height: screenHeight,
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
  introImageContainer: {
    alignSelf: 'center',
    marginBottom: 24,
    width: 170,
    height: 170,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    elevation: 10,
  },
  introImage: {
    width: 150,
    height: 150,
    borderRadius: 16,
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
  goHomeButton: {
    marginTop: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  goHomeButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.7)',
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
    top: screenHeight * 0.19,
    alignSelf: 'center',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  instructionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 12,
    overflow: 'hidden',
  },
  captureControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 32,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  exitTestButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  exitTestButtonHeader: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  flipButtonSmall: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
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
  compareFullPage: {
    width: screenWidth,
    height: screenHeight,
  },
  compareHeaderCenter: {
    flex: 1,
    alignItems: 'center',
  },
  compareOptionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  compareOptionSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
    marginTop: 4,
  },
  compareFooterNew: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingTop: 16,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  pageIndicators: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    marginBottom: 8,
  },
  pageIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  pageIndicatorActive: {
    backgroundColor: '#FFFFFF',
    width: 24,
  },
  swipeHint: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 16,
  },
  selectionButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  selectButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectButtonHighlight: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },
  selectButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
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
  resultScrollView: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: '55%',
  },
  resultScrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  scoreBreakdownContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  scoreLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  scoreBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
  },
  scoreBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  scoreBadgeCool: {
    backgroundColor: '#4A90D9',
  },
  scoreBadgeWarm: {
    backgroundColor: '#D97B4A',
  },
  scoreBadgeLight: {
    backgroundColor: '#E8E4DF',
  },
  scoreBadgeDeep: {
    backgroundColor: '#4A4A4A',
  },
  scoreBadgeBright: {
    backgroundColor: '#9C4AD9',
  },
  scoreBadgeSoft: {
    backgroundColor: '#8B8589',
  },
  topMatchContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 8,
  },
  matchPercentage: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
  },
  matchPercentageText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  alternativeMatchesContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  alternativeMatchesRow: {
    flexDirection: 'row',
    gap: 12,
  },
  alternativeMatch: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  alternativeMatchName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
    textAlign: 'center',
  },
  alternativeMatchPercent: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  tipsContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  topMatchesContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  matchesHint: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 12,
    marginTop: -8,
  },
  matchesRow: {
    flexDirection: 'row',
    gap: 10,
  },
  matchOption: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  matchOptionSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderColor: '#FFFFFF',
  },
  matchOptionAlt: {
    paddingTop: 28,
  },
  bestMatchLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFD700',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  matchOptionName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
    textAlign: 'center',
  },
  matchOptionNameSelected: {
    fontWeight: '700',
  },
  matchOptionPercent: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  matchOptionPercentSelected: {
    color: '#FFFFFF',
  },
  tipItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  tipBullet: {
    fontSize: 14,
    color: '#FFFFFF',
    marginRight: 8,
    lineHeight: 20,
  },
  tipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
    flex: 1,
    lineHeight: 20,
  },
  resultButtons: {
    marginTop: 8,
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
  seasonBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  seasonBadgeText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  saveResultButton: {
    paddingVertical: 14,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  saveResultButtonSaved: {
    borderColor: '#34C759',
    backgroundColor: 'rgba(52, 199, 89, 0.15)',
  },
  saveResultButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  saveResultButtonTextSaved: {
    color: '#34C759',
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
  homeButtonResult: {
    paddingVertical: 14,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  homeButtonResultText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
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

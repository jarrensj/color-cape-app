import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { OnboardingProvider, useOnboarding } from '@/context/onboarding-context';
import { RevenueCatProvider, useRevenueCat } from '@/context/revenuecat-context';

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { hasOnboarded, isLoading: onboardingLoading } = useOnboarding();
  const { hasSeenPaywall, isProUser, isLoading: revenueCatLoading } = useRevenueCat();
  const router = useRouter();
  const segments = useSegments();

  const isLoading = onboardingLoading || revenueCatLoading;

  useEffect(() => {
    if (isLoading) return;

    const inOnboarding = segments[0] === 'onboarding';
    const inPaywall = segments[0] === 'paywall';
    const inTabs = segments[0] === '(tabs)';

    if (!hasOnboarded && !inOnboarding) {
      // User hasn't completed onboarding, show onboarding
      router.replace('/onboarding');
    } else if (hasOnboarded && !hasSeenPaywall && !isProUser && !inPaywall) {
      // User completed onboarding but hasn't seen paywall and isn't pro
      router.replace('/paywall');
    } else if (hasOnboarded && (hasSeenPaywall || isProUser) && (inOnboarding || inPaywall)) {
      // User is done with onboarding and paywall, go to main app
      router.replace('/(tabs)');
    }
  }, [isLoading, hasOnboarded, hasSeenPaywall, isProUser, segments]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000' }} />
    );
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen
          name="onboarding"
          options={{
            headerShown: false,
            gestureEnabled: false,
          }}
        />
        <Stack.Screen
          name="paywall"
          options={{
            headerShown: false,
            gestureEnabled: false,
          }}
        />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <RevenueCatProvider>
      <OnboardingProvider>
        <RootLayoutNav />
      </OnboardingProvider>
    </RevenueCatProvider>
  );
}

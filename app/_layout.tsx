import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { OnboardingProvider, useOnboarding } from '@/context/onboarding-context';
import { RevenueCatProvider, useRevenueCat } from '@/context/revenuecat-context';
import { PalettePreferencesProvider } from '@/context/palette-preferences-context';
import { TabBarProvider } from '@/contexts/tab-bar-context';

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { hasOnboarded, isLoading: onboardingLoading } = useOnboarding();
  const { isProUser, isLoading: revenueCatLoading } = useRevenueCat();
  const router = useRouter();
  const segments = useSegments();

  const isLoading = onboardingLoading || revenueCatLoading;

  useEffect(() => {
    if (isLoading) return;

    const inOnboarding = segments[0] === 'onboarding';
    const inPaywall = segments[0] === 'paywall';
    const inTabs = segments[0] === '(tabs)';

    if (!hasOnboarded && !inOnboarding) {
      router.replace('/onboarding');
    } else if (hasOnboarded && !isProUser && !inPaywall) {
      router.replace('/paywall');
    } else if (hasOnboarded && isProUser && (inOnboarding || inPaywall)) {
      router.replace('/(tabs)');
    }
  }, [isLoading, hasOnboarded, isProUser, segments]);

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
        <PalettePreferencesProvider>
          <TabBarProvider>
            <RootLayoutNav />
          </TabBarProvider>
        </PalettePreferencesProvider>
      </OnboardingProvider>
    </RevenueCatProvider>
  );
}

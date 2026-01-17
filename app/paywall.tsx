import { StyleSheet, View, Pressable, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import RevenueCatUI from 'react-native-purchases-ui';
import { useRevenueCat } from '@/context/revenuecat-context';
import { useOnboarding } from '@/context/onboarding-context';

export default function PaywallScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { checkSubscriptionStatus, currentOffering, setDevBypass } = useRevenueCat();
  const { setHasOnboarded } = useOnboarding();

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setHasOnboarded(false);
    router.replace('/onboarding');
  };

  const handleDismiss = () => {
    // Do nothing - paywall is mandatory
  };

  const handleDevSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setDevBypass(true);
    router.replace('/(tabs)');
  };

  const handlePurchaseCompleted = async () => {
    await checkSubscriptionStatus();
    router.replace('/(tabs)');
  };

  const handleRestoreCompleted = async () => {
    await checkSubscriptionStatus();
    router.replace('/(tabs)');
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <Pressable
        style={[styles.backButton, { top: insets.top + 12 }]}
        onPress={handleBack}
      >
        <ChevronLeft size={28} color="#FFFFFF" strokeWidth={2} />
      </Pressable>
      {__DEV__ && (
        <Pressable
          style={[styles.skipButton, { top: insets.top + 12 }]}
          onPress={handleDevSkip}
        >
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      )}
      <RevenueCatUI.Paywall
        options={{
          offering: currentOffering ?? undefined,
          displayCloseButton: false,
        }}
        onDismiss={handleDismiss}
        onPurchaseCompleted={handlePurchaseCompleted}
        onRestoreCompleted={handleRestoreCompleted}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  backButton: {
    position: 'absolute',
    left: 16,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  skipButton: {
    position: 'absolute',
    right: 16,
    zIndex: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  skipText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

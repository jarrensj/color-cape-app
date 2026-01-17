import { StyleSheet, View, Pressable } from 'react-native';
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
  const { checkSubscriptionStatus, currentOffering } = useRevenueCat();
  const { setHasOnboarded } = useOnboarding();

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setHasOnboarded(false);
    router.replace('/onboarding');
  };

  const handleDismiss = () => {
    // Do nothing - paywall is mandatory
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
});

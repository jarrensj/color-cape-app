import { StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import RevenueCatUI from 'react-native-purchases-ui';
import { useRevenueCat } from '@/context/revenuecat-context';

export default function PaywallScreen() {
  const router = useRouter();
  const { checkSubscriptionStatus, currentOffering } = useRevenueCat();

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
});

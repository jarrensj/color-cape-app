import { useState } from 'react';
import { StyleSheet, View, Text, Pressable, Alert, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RotateCcw, Crown, RefreshCw } from 'lucide-react-native';
import RevenueCatUI from 'react-native-purchases-ui';
import { useOnboarding } from '@/context/onboarding-context';
import { useRevenueCat } from '@/context/revenuecat-context';

export default function SettingsScreen() {
  const [showCustomerCenter, setShowCustomerCenter] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { setHasOnboarded } = useOnboarding();
  const { restorePurchases } = useRevenueCat();

  const resetApp = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    Alert.alert(
      'Reset App',
      'This will clear all your data and show the onboarding again. Are you sure?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.clear();
            setHasOnboarded(false);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            router.replace('/onboarding');
          },
        },
      ]
    );
  };

  const handleManageSubscription = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowCustomerCenter(true);
  };

  const handleRestorePurchases = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsRestoring(true);
    const restored = await restorePurchases();
    setIsRestoring(false);
    if (restored) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Restored!', 'Your purchases have been restored.');
    } else {
      Alert.alert('No Purchases Found', 'We could not find any previous purchases to restore.');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Customer Center Modal */}
      {showCustomerCenter && (
        <RevenueCatUI.CustomerCenter
          onDismiss={() => setShowCustomerCenter(false)}
        />
      )}

      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <Text style={styles.title}>Settings</Text>
      </View>

      <View style={styles.content}>
        {/* Subscription Status */}
        <View style={styles.statusCard}>
          <View style={styles.statusIconContainer}>
            <Crown size={28} color="#FFD700" strokeWidth={2} />
          </View>
          <View style={styles.statusTextContainer}>
            <Text style={styles.statusTitle}>Color Cape Pro</Text>
            <Text style={styles.statusDescription}>
              You have access to all features
            </Text>
          </View>
        </View>

        {/* Subscription Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Subscription</Text>

          <Pressable
            style={({ pressed }) => [
              styles.settingButton,
              pressed && styles.settingButtonPressed,
            ]}
            onPress={handleManageSubscription}
          >
            <View style={[styles.settingIcon, styles.settingIconGold]}>
              <Crown size={22} color="#FFD700" strokeWidth={2} />
            </View>
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingLabel}>Manage Subscription</Text>
              <Text style={styles.settingDescription}>
                View or cancel your subscription
              </Text>
            </View>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.settingButton,
              pressed && styles.settingButtonPressed,
              styles.settingButtonMarginTop,
            ]}
            onPress={handleRestorePurchases}
            disabled={isRestoring}
          >
            <View style={[styles.settingIcon, styles.settingIconBlue]}>
              {isRestoring ? (
                <ActivityIndicator color="#007AFF" />
              ) : (
                <RefreshCw size={22} color="#007AFF" strokeWidth={2} />
              )}
            </View>
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingLabel}>Restore Purchases</Text>
              <Text style={styles.settingDescription}>
                Restore previous purchases
              </Text>
            </View>
          </Pressable>
        </View>

        {/* App Data Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Data</Text>

          <Pressable
            style={({ pressed }) => [
              styles.settingButton,
              pressed && styles.settingButtonPressed,
            ]}
            onPress={resetApp}
          >
            <View style={styles.settingIcon}>
              <RotateCcw size={22} color="#FF3B30" strokeWidth={2} />
            </View>
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingLabel}>Reset App</Text>
              <Text style={styles.settingDescription}>
                Clear all data and restart onboarding
              </Text>
            </View>
          </Pressable>
        </View>
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
    paddingBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginBottom: 24,
  },
  statusIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  statusTextContainer: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  statusDescription: {
    fontSize: 14,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  upgradeButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 20,
  },
  upgradeButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.5)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  settingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  settingButtonPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  settingButtonMarginTop: {
    marginTop: 8,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 59, 48, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  settingIconGold: {
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
  },
  settingIconBlue: {
    backgroundColor: 'rgba(0, 122, 255, 0.15)',
  },
  settingTextContainer: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.5)',
  },
});

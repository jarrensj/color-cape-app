import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import Purchases, { CustomerInfo, PurchasesOffering } from 'react-native-purchases';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const API_KEY = Constants.expoConfig?.extra?.revenueCatApiKey ?? '';
const ENTITLEMENT_ID = 'Color Cape Pro';

type RevenueCatContextType = {
  isProUser: boolean;
  customerInfo: CustomerInfo | null;
  currentOffering: PurchasesOffering | null;
  isLoading: boolean;
  hasSeenPaywall: boolean;
  setHasSeenPaywall: (value: boolean) => void;
  restorePurchases: () => Promise<boolean>;
  checkSubscriptionStatus: () => Promise<void>;
};

const RevenueCatContext = createContext<RevenueCatContextType | undefined>(undefined);

export function RevenueCatProvider({ children }: { children: ReactNode }) {
  const [isProUser, setIsProUser] = useState(false);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [currentOffering, setCurrentOffering] = useState<PurchasesOffering | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasSeenPaywall, setHasSeenPaywallState] = useState(false);

  useEffect(() => {
    initializeRevenueCat();
  }, []);

  const initializeRevenueCat = async () => {
    try {
      // Check if user has seen paywall before
      const seenPaywall = await AsyncStorage.getItem('has_seen_paywall');
      setHasSeenPaywallState(seenPaywall === 'true');

      // Configure RevenueCat
      Purchases.configure({ apiKey: API_KEY });

      // Set up customer info listener
      Purchases.addCustomerInfoUpdateListener((info) => {
        updateCustomerInfo(info);
      });

      // Get initial customer info
      const info = await Purchases.getCustomerInfo();
      updateCustomerInfo(info);

      // Get offerings
      const offerings = await Purchases.getOfferings();
      if (offerings.current) {
        setCurrentOffering(offerings.current);
      }
    } catch (error) {
      console.error('Error initializing RevenueCat:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateCustomerInfo = (info: CustomerInfo) => {
    setCustomerInfo(info);
    // Check if user has the "Color Cape Pro" entitlement
    const isPro = typeof info.entitlements.active[ENTITLEMENT_ID] !== 'undefined';
    setIsProUser(isPro);
  };

  const checkSubscriptionStatus = async () => {
    try {
      const info = await Purchases.getCustomerInfo();
      updateCustomerInfo(info);
    } catch (error) {
      console.error('Error checking subscription status:', error);
    }
  };

  const restorePurchases = async (): Promise<boolean> => {
    try {
      const info = await Purchases.restorePurchases();
      updateCustomerInfo(info);
      return typeof info.entitlements.active[ENTITLEMENT_ID] !== 'undefined';
    } catch (error) {
      console.error('Error restoring purchases:', error);
      return false;
    }
  };

  const setHasSeenPaywall = async (value: boolean) => {
    setHasSeenPaywallState(value);
    await AsyncStorage.setItem('has_seen_paywall', value.toString());
  };

  return (
    <RevenueCatContext.Provider
      value={{
        isProUser,
        customerInfo,
        currentOffering,
        isLoading,
        hasSeenPaywall,
        setHasSeenPaywall,
        restorePurchases,
        checkSubscriptionStatus,
      }}
    >
      {children}
    </RevenueCatContext.Provider>
  );
}

export function useRevenueCat() {
  const context = useContext(RevenueCatContext);
  if (context === undefined) {
    throw new Error('useRevenueCat must be used within a RevenueCatProvider');
  }
  return context;
}

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import Purchases, { CustomerInfo, PurchasesOffering } from 'react-native-purchases';
import Constants from 'expo-constants';

const API_KEY = Constants.expoConfig?.extra?.revenueCatApiKey ?? '';
const ENTITLEMENT_ID = 'Color Cape Pro';

type RevenueCatContextType = {
  isProUser: boolean;
  customerInfo: CustomerInfo | null;
  currentOffering: PurchasesOffering | null;
  isLoading: boolean;
  restorePurchases: () => Promise<boolean>;
  checkSubscriptionStatus: () => Promise<void>;
  setDevBypass: (bypass: boolean) => void;
};

const RevenueCatContext = createContext<RevenueCatContextType | undefined>(undefined);

export function RevenueCatProvider({ children }: { children: ReactNode }) {
  const [isProUser, setIsProUser] = useState(false);
  const [devBypass, setDevBypass] = useState(false);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [currentOffering, setCurrentOffering] = useState<PurchasesOffering | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeRevenueCat();
  }, []);

  const initializeRevenueCat = async () => {
    try {
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

  return (
    <RevenueCatContext.Provider
      value={{
        isProUser: isProUser || (__DEV__ && devBypass),
        customerInfo,
        currentOffering,
        isLoading,
        restorePurchases,
        checkSubscriptionStatus,
        setDevBypass,
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

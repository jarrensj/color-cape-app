import 'dotenv/config';

export default {
  expo: {
    name: 'Color Cape',
    slug: 'my-app',
    version: '1.0.2',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: 'myapp',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'app.colorcape.colorcape',
      buildNumber: '29',
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        NSCameraUsageDescription: 'Allow $(PRODUCT_NAME) to access your camera to show color capes over you for color comparison.',
      },
    },
    android: {
      adaptiveIcon: {
        backgroundColor: '#E6F4FE',
        foregroundImage: './assets/images/android-icon-foreground.png',
        backgroundImage: './assets/images/android-icon-background.png',
        monochromeImage: './assets/images/android-icon-monochrome.png',
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
    },
    web: {
      output: 'static',
      favicon: './assets/images/favicon.png',
    },
    plugins: [
      'expo-router',
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
    extra: {
      revenueCatApiKey: process.env.REVENUECAT_API_KEY,
      eas: {
        projectId: '07afac34-c9d8-40e2-a1cf-2a80b8c4f520',
      },
    },
  },
};

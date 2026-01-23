# Color Cape

A personal color analysis app that helps you discover which colors look best on you using virtual color caping.

## Features

### Virtual Color Caping
- Real-time camera overlay with color "capes" to see how different colors complement your complexion
- Long press on any color segment to view the color name and hex code
- Capture and save photos with your favorite color overlays

### 30+ Color Palettes
- **Seasonal Palettes**: Light Spring, Warm Spring, Bright Spring, Light Summer, Cool Summer, Soft Summer, Soft Autumn, Warm Autumn, Deep Autumn, Deep Winter, Cool Winter, Bright Winter
- **Themed Palettes**: Jewel Tones, Pastels, Earth Tones, Ocean, Sunset, Warm Neutrals, Cool Neutrals, Black & White
- **Single Colors**: White, Black, Navy, Burgundy, Forest Green, Coral, Lavender, Mustard, Blush, Teal, Camel, Ruby

### Custom Capes
- Create up to 3 custom color palettes
- Choose 1, 2, 4, or 8 colors per cape
- Pick colors from a preset grid or enter custom hex codes
- Toggle and reorder custom capes alongside built-in palettes

### Palette Management
- Enable/disable individual palettes
- Reorder palettes to your preference
- Quick "Enable All" / "Disable All" toggle
- Reset to default order anytime

### Camera Settings
- Choose default front or back camera
- Mirror mode for front camera
- Adjustable cape opacity (Light, Medium, Strong, Full)

### Additional Features
- Save caped photos to your gallery
- Share the app with friends
- Privacy-focused design
- Subscription management

## Tech Stack

- React Native / Expo
- TypeScript
- expo-camera
- react-native-view-shot
- AsyncStorage for persistence
- RevenueCat for subscriptions

## Getting Started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

3. Run on iOS

   ```bash
   npx expo run:ios
   ```

## Build & Submit

Build for production:

```bash
eas build --platform ios --profile production
```

Submit to App Store:

```bash
eas submit --platform ios
```

## Links

- [Privacy Policy](https://colorcape.app/privacy-policy)
- [Terms of Service](https://colorcape.app/terms-of-service)

## Version

1.0.0-beta

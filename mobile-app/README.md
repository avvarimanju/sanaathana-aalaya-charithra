# AvvarI Mobile App - Demo Prototype

A React Native mobile app prototype for the AvvarI for Bharat heritage platform.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager
- Expo Go app on your phone (iOS/Android)

### Installation

1. **Navigate to mobile app directory:**
   ```bash
   cd mobile-app
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm start
   ```

4. **Run on your device:**
   - Install "Expo Go" app from App Store (iOS) or Play Store (Android)
   - Scan the QR code shown in terminal with your phone camera
   - The app will open in Expo Go

### Alternative: Run on Emulator

**Android:**
```bash
npm run android
```

**iOS (Mac only):**
```bash
npm run ios
```

**Web Browser:**
```bash
npm run web
```

## 📱 App Features

### Implemented Screens

1. **Welcome Screen** 🏛️
   - App introduction
   - Feature highlights
   - Get started button

2. **Language Selection** 🗣️
   - 10 Indian languages
   - English support
   - Native script display

3. **QR Scanner** 📷
   - Demo mode with 3 sample artifacts
   - Simulated QR scanning
   - Mock heritage sites

4. **Content Loading** ⏳
   - AI generation simulation
   - Progress indicator
   - AWS services display

5. **Audio Guide** 🎵
   - Audio player interface
   - Transcript display
   - Quick facts
   - Navigation to other content

6. **Video Player** 🎬
   - Video playback interface
   - Quality selector
   - Subtitle support

7. **Infographic Viewer** 📊
   - Timeline view
   - Map view
   - Architecture details
   - Cultural context

8. **Q&A Chat** 💬
   - AI chatbot interface
   - Suggested questions
   - Mock responses

## 🎨 Demo Data

The app includes mock data for 3 heritage sites:

1. **Qutub Minar** (Delhi)
   - 73m tall monument
   - Built in 1193 CE
   - UNESCO World Heritage Site

2. **Taj Mahal** (Agra)
   - Iconic marble mausoleum
   - Built 1632-1653
   - Seven Wonders of the World

3. **Hampi Ruins** (Karnataka)
   - Ancient Vijayanagara capital
   - 1,600+ monuments
   - UNESCO World Heritage Site

## 🛠️ Technology Stack

- **React Native** - Cross-platform mobile framework
- **Expo** - Development platform
- **React Navigation** - Screen navigation
- **React Native Paper** - Material Design components
- **TypeScript** - Type-safe development

## 📂 Project Structure

```
mobile-app/
├── App.tsx                 # Main app component
├── src/
│   └── screens/           # All screen components
│       ├── WelcomeScreen.tsx
│       ├── LanguageSelectionScreen.tsx
│       ├── QRScannerScreen.tsx
│       ├── ContentLoadingScreen.tsx
│       ├── AudioGuideScreen.tsx
│       ├── VideoPlayerScreen.tsx
│       ├── InfographicScreen.tsx
│       └── QAChatScreen.tsx
├── package.json           # Dependencies
├── app.json              # Expo configuration
└── tsconfig.json         # TypeScript config
```

## 🎯 Current Limitations

### Demo Mode Only
- Uses mock data (no real AWS backend)
- Simulated AI responses
- No actual QR scanning (camera not implemented)
- No real audio/video playback

### Not Implemented
- Real AWS API integration
- Actual camera QR scanning
- Real audio playback
- Real video streaming
- Offline storage
- User authentication
- Analytics tracking

## 🔄 Next Steps to Make It Production-Ready

### 1. Backend Integration
```typescript
// Add API service
import axios from 'axios';

const API_URL = 'https://your-api-gateway-url.amazonaws.com';

export const scanQRCode = async (qrData: string) => {
  const response = await axios.post(`${API_URL}/qr/scan`, { qrData });
  return response.data;
};
```

### 2. Real QR Scanning
```bash
# Install camera library
expo install expo-camera expo-barcode-scanner

# Implement in QRScannerScreen
import { Camera } from 'expo-camera';
```

### 3. Audio Playback
```bash
# Install audio library
expo install expo-av

# Implement in AudioGuideScreen
import { Audio } from 'expo-av';
```

### 4. Video Playback
```bash
# Install video library
expo install expo-av

# Implement in VideoPlayerScreen
import { Video } from 'expo-av';
```

### 5. Offline Storage
```bash
# Install storage library
expo install @react-native-async-storage/async-storage

# Implement caching
import AsyncStorage from '@react-native-async-storage/async-storage';
```

## 🧪 Testing

Currently, the app is a visual prototype. To test:

1. **Visual Testing:**
   - Navigate through all screens
   - Check UI/UX flow
   - Verify language selection
   - Test navigation buttons

2. **Demo Flow:**
   - Start app → Select language → Scan QR (demo) → View content
   - Try all 3 demo artifacts
   - Navigate between audio/video/infographic/chat

## 🎨 Customization

### Change Theme Colors

Edit the color scheme in each screen's StyleSheet:

```typescript
const styles = StyleSheet.create({
  // Change primary color from #FF6B35 to your color
  button: {
    backgroundColor: '#YOUR_COLOR',
  },
});
```

### Add More Demo Artifacts

Edit `QRScannerScreen.tsx`:

```typescript
const MOCK_QR_CODES = [
  // Add your artifacts here
  {
    id: 'qr-004',
    name: 'Your Monument',
    type: 'Type',
    location: 'Location',
  },
];
```

## 📱 Building for Production

### Android APK
```bash
expo build:android
```

### iOS IPA
```bash
expo build:ios
```

### Standalone Apps
```bash
# Configure app.json first
expo build:android -t apk
expo build:ios -t archive
```

## 🐛 Troubleshooting

### "Module not found" errors
```bash
rm -rf node_modules
npm install
```

### Expo Go not connecting
- Ensure phone and computer are on same WiFi
- Try tunnel mode: `expo start --tunnel`

### TypeScript errors
```bash
npm install --save-dev @types/react @types/react-native
```

## 📚 Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Docs](https://reactnative.dev/)
- [React Navigation](https://reactnavigation.org/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## 🤝 Contributing

This is a demo prototype. To contribute:

1. Add real AWS backend integration
2. Implement camera QR scanning
3. Add audio/video playback
4. Implement offline storage
5. Add user authentication
6. Improve UI/UX

## 📄 License

MIT License - See main project LICENSE file

## 👨‍💻 Author

Manjunath Venkata Avvari
- GitHub: [@avvarimanju](https://github.com/avvarimanju)
- Email: avvarimanju@gmail.com

---

**Note:** This is a demo prototype for the AWS AI for Bharat Hackathon 2026. It demonstrates the UI/UX flow but uses mock data instead of real AWS services.

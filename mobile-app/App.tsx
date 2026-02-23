import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Screens
import WelcomeScreen from './src/screens/WelcomeScreen';
import LanguageSelectionScreen from './src/screens/LanguageSelectionScreen';
import QRScannerScreen from './src/screens/QRScannerScreen';
import ContentLoadingScreen from './src/screens/ContentLoadingScreen';
import AudioGuideScreen from './src/screens/AudioGuideScreen';
import VideoPlayerScreen from './src/screens/VideoPlayerScreen';
import InfographicScreen from './src/screens/InfographicScreen';
import QAChatScreen from './src/screens/QAChatScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <PaperProvider>
        <NavigationContainer>
          <Stack.Navigator
            initialRouteName="Welcome"
            screenOptions={{
              headerStyle: {
                backgroundColor: '#FF6B35',
              },
              headerTintColor: '#fff',
              headerTitleStyle: {
                fontWeight: 'bold',
              },
            }}
          >
            <Stack.Screen 
              name="Welcome" 
              component={WelcomeScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="LanguageSelection" 
              component={LanguageSelectionScreen}
              options={{ title: 'Select Language' }}
            />
            <Stack.Screen 
              name="QRScanner" 
              component={QRScannerScreen}
              options={{ title: 'Scan QR Code' }}
            />
            <Stack.Screen 
              name="ContentLoading" 
              component={ContentLoadingScreen}
              options={{ title: 'Loading Content' }}
            />
            <Stack.Screen 
              name="AudioGuide" 
              component={AudioGuideScreen}
              options={{ title: 'Audio Guide' }}
            />
            <Stack.Screen 
              name="VideoPlayer" 
              component={VideoPlayerScreen}
              options={{ title: 'Video' }}
            />
            <Stack.Screen 
              name="Infographic" 
              component={InfographicScreen}
              options={{ title: 'Infographic' }}
            />
            <Stack.Screen 
              name="QAChat" 
              component={QAChatScreen}
              options={{ title: 'Ask Questions' }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </PaperProvider>
    </SafeAreaProvider>
  );
}

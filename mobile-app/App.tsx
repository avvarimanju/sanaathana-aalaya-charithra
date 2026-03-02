import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Screens
import SplashScreen from './src/screens/SplashScreen';
import WelcomeScreen from './src/screens/WelcomeScreen';
import LoginScreen from './src/screens/LoginScreen';
import LanguageSelectionScreen from './src/screens/LanguageSelectionScreen';
import IndiaMapScreen from './src/screens/IndiaMapScreen';
import ExploreScreen from './src/screens/ExploreScreen';
import TempleDetailsScreen from './src/screens/TempleDetailsScreen';
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
            initialRouteName="Splash"
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
              name="Splash" 
              component={SplashScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="Welcome" 
              component={WelcomeScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="Login" 
              component={LoginScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="LanguageSelection" 
              component={LanguageSelectionScreen}
              options={{ title: 'Select Language' }}
            />
            <Stack.Screen 
              name="IndiaMap" 
              component={IndiaMapScreen}
              options={{ title: 'Select State', headerShown: false }}
            />
            <Stack.Screen 
              name="Explore" 
              component={ExploreScreen}
              options={{ title: 'Explore Temples' }}
            />
            <Stack.Screen 
              name="TempleDetails" 
              component={TempleDetailsScreen}
              options={{ title: 'Temple Details', headerShown: false }}
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

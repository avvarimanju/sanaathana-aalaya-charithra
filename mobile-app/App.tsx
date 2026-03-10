import React, { useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import * as Linking from 'expo-linking';

// Screens
import SplashScreen from './src/screens/SplashScreen';
import WelcomeScreen from './src/screens/WelcomeScreen';
import LoginScreen from './src/screens/LoginScreen';
import LanguageSelectionScreen from './src/screens/LanguageSelectionScreen';
import IndiaMapScreen from './src/screens/IndiaMapScreen';
import ExploreScreen from './src/screens/ExploreScreen';
import TempleDetailsScreen from './src/screens/TempleDetailsScreen';
import MyDefectsScreen from './src/screens/MyDefectsScreen';
import DefectDetailsScreen from './src/screens/DefectDetailsScreen';
import DefectReportScreen from './src/screens/DefectReportScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import QRScannerScreen from './src/screens/QRScannerScreen';
import AudioGuideScreen from './src/screens/AudioGuideScreen';
import VideoPlayerScreen from './src/screens/VideoPlayerScreen';
import InfographicScreen from './src/screens/InfographicScreen';
import QAChatScreen from './src/screens/QAChatScreen';
import ContentLoadingScreen from './src/screens/ContentLoadingScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Main Tab Navigator
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#FF6B35',
        tabBarInactiveTintColor: '#999',
      }}
    >
      <Tab.Screen 
        name="Explore" 
        component={ExploreScreen}
        options={{
          tabBarLabel: 'Explore',
        }}
      />
      <Tab.Screen 
        name="MyDefects" 
        component={MyDefectsScreen}
        options={{
          tabBarLabel: 'My Reports',
        }}
      />
      <Tab.Screen 
        name="Notifications" 
        component={NotificationsScreen}
        options={{
          tabBarLabel: 'Alerts',
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const navigationRef = useRef<any>(null);

  useEffect(() => {
    // Handle initial URL if app was opened from a link
    const handleInitialURL = async () => {
      try {
        const url = await Linking.getInitialURL();
        if (url) {
          handleDeepLink(url);
        }
      } catch (error) {
        console.error('Error getting initial URL:', error);
      }
    };

    handleInitialURL();

    // Subscribe to deep link events while app is running
    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleDeepLink(url);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const handleDeepLink = (url: string) => {
    console.log('Deep link received:', url);
    
    try {
      const { path } = Linking.parse(url);
      
      if (!path) return;

      // Wait for navigation to be ready
      setTimeout(() => {
        if (!navigationRef.current) return;

        // Handle temple links: /temple/:id
        if (path.startsWith('temple/')) {
          const id = path.replace('temple/', '');
          navigationRef.current.navigate('TempleDetails', { templeId: id });
        }
        
        // Handle artifact links: /artifact/:id
        else if (path.startsWith('artifact/')) {
          const id = path.replace('artifact/', '');
          navigationRef.current.navigate('DefectDetails', { defectId: id });
        }
      }, 100);
    } catch (error) {
      console.error('Error parsing deep link:', error);
    }
  };

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator 
        initialRouteName="Splash"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="LanguageSelection" component={LanguageSelectionScreen} />
        <Stack.Screen name="IndiaMap" component={IndiaMapScreen} />
        <Stack.Screen name="Main" component={MainTabs} />
        <Stack.Screen name="TempleDetails" component={TempleDetailsScreen} />
        <Stack.Screen name="DefectDetails" component={DefectDetailsScreen} />
        <Stack.Screen name="DefectReport" component={DefectReportScreen} />
        <Stack.Screen name="QRScanner" component={QRScannerScreen} />
        <Stack.Screen name="AudioGuide" component={AudioGuideScreen} />
        <Stack.Screen name="VideoPlayer" component={VideoPlayerScreen} />
        <Stack.Screen name="Infographic" component={InfographicScreen} />
        <Stack.Screen name="QAChat" component={QAChatScreen} />
        <Stack.Screen name="ContentLoading" component={ContentLoadingScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

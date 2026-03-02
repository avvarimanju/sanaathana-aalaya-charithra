/**
 * Example App.tsx showing how to integrate state management providers
 * 
 * Copy this pattern to your actual App.tsx file
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';

// Import state management providers
import { DefectProvider, NotificationProvider, useNotifications } from './state/defects';

// Import screens
import MyDefectsScreen from './screens/MyDefectsScreen';
import DefectDetailsScreen from './screens/DefectDetailsScreen';
import DefectReportScreen from './screens/DefectReportScreen';
import NotificationsScreen from './screens/NotificationsScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

/**
 * Defect Stack Navigator
 */
function DefectStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="MyDefects"
        component={MyDefectsScreen}
        options={{ title: 'My Defects' }}
      />
      <Stack.Screen
        name="DefectDetails"
        component={DefectDetailsScreen}
        options={{ title: 'Defect Details' }}
      />
      <Stack.Screen
        name="DefectReport"
        component={DefectReportScreen}
        options={{ title: 'Report Defect' }}
      />
    </Stack.Navigator>
  );
}

/**
 * Main Tab Navigator with notification badge
 */
function MainTabs() {
  const { unreadCount } = useNotifications();

  return (
    <Tab.Navigator>
      <Tab.Screen
        name="DefectStack"
        component={DefectStack}
        options={{
          title: 'Defects',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size, color }}>📋</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          title: 'Notifications',
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size, color }}>🔔</Text>
          ),
        }}
      />
      {/* Add other tabs here */}
    </Tab.Navigator>
  );
}

/**
 * Root App Component
 */
export default function App() {
  return (
    <DefectProvider>
      <NotificationProvider>
        <NavigationContainer>
          <MainTabs />
        </NavigationContainer>
      </NotificationProvider>
    </DefectProvider>
  );
}

/**
 * Alternative: If you have authentication
 */
export function AppWithAuth() {
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [userId, setUserId] = React.useState<string | null>(null);

  return (
    <NavigationContainer>
      {isAuthenticated && userId ? (
        <DefectProvider>
          <NotificationProvider>
            <MainTabs />
          </NotificationProvider>
        </DefectProvider>
      ) : (
        <LoginScreen onLogin={(id) => {
          setUserId(id);
          setIsAuthenticated(true);
        }} />
      )}
    </NavigationContainer>
  );
}

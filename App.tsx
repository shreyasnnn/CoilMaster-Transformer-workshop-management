// App.tsx
import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { supabase } from './src/services/supabase';
import { theme } from './src/theme/colors';

// Screens
import DashboardScreen from './src/screens/DashboardScreen';
import CalculatorScreen from './src/screens/CalculatorScreen';
import JobDetailsScreen from './src/screens/JobDetailsScreen';
import LoginScreen from './src/screens/LoginScreen';
import ManageWorkersScreen from './src/screens/ManageWorkersScreen';
import AddWorkerScreen from './src/screens/AddWorkerScreen';
import SetupScreen from './src/screens/SetupScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import PlaceholderScreen from './src/screens/PlaceholderScreen';
import OrdersScreen from './src/screens/OrdersScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// 🚀 THE NEW BOTTOM TAB NAVIGATOR
function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0F172A', // Dark solid color
          borderTopWidth: 0,
          elevation: 20,
          height: 70,
          paddingBottom: 10,
          paddingTop: 10,
        },
        tabBarActiveTintColor: theme.primaryGlow,
        tabBarInactiveTintColor: theme.textMuted,
        tabBarLabelStyle: { fontSize: 10, fontWeight: 'bold', letterSpacing: 1, marginTop: 4 },

        // Dynamic icons based on the tab name
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'grid-outline';

          if (route.name === 'DashboardTab') iconName = focused ? 'grid' : 'grid-outline';
          else if (route.name === 'InventoryTab') iconName = focused ? 'cube' : 'cube-outline';
          else if (route.name === 'WorkersTab') iconName = focused ? 'people' : 'people-outline';
          else if (route.name === 'OrdersTab') iconName = focused ? 'clipboard' : 'clipboard-outline';
          else if (route.name === 'BrandingTab') iconName = focused ? 'ribbon' : 'ribbon-outline';

          return <Ionicons name={iconName} size={24} color={color} />;
        },
      })}
    >
      <Tab.Screen name="DashboardTab" component={DashboardScreen} options={{ title: 'DASHBOARD' }} />
      <Tab.Screen name="InventoryTab" component={PlaceholderScreen} options={{ title: 'INVENTORY' }} />
      <Tab.Screen name="WorkersTab" component={ManageWorkersScreen} options={{ title: 'WORKERS' }} />
      <Tab.Screen name="OrdersTab" component={OrdersScreen} options={{ title: 'ORDERS' }} />
      <Tab.Screen name="BrandingTab" component={SettingsScreen} options={{ title: 'BRANDING' }} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
  }, []);

  return (
    <>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerStyle: { backgroundColor: theme.background },
            headerTintColor: theme.primaryGlow,
            headerShadowVisible: false,
          }}
        >
          {session && session.user ? (
            <>
              {/* 🚀 Main App is now the Tab Navigator */}
              <Stack.Screen name="MainTabs" component={MainTabNavigator} options={{ headerShown: false }} />

              {/* Screens that hide the bottom bar when opened */}
              <Stack.Screen name="Setup" component={SetupScreen} options={{ headerShown: false }} />
              <Stack.Screen name="Calculator" component={CalculatorScreen} options={{ title: 'Design Wizard' }} />
              <Stack.Screen name="JobDetails" component={JobDetailsScreen} options={{ title: 'Work Order' }} />
              <Stack.Screen name="AddWorker" component={AddWorkerScreen} options={{ title: 'Add Employee' }} />
            </>
          ) : (
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          )}
        </Stack.Navigator>
      </NavigationContainer>

      <Toast />
    </>
  );
}
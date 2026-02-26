import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';

import * as NavigationBar from 'expo-navigation-bar';
import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, Platform, View } from "react-native";
import { AuthProvider, useAuth } from "../contexts/AuthContext";
import { CartProvider } from "../contexts/CartContext";
import { NotificationProvider } from "../contexts/NotificationContext";

function RootLayoutNav() {
  const { session, isLoading, profile } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const colorScheme = useColorScheme();

  useEffect(() => {
    if (Platform.OS === 'android') {
      const bg = '#8B0000';
      NavigationBar.setBackgroundColorAsync(bg);
      NavigationBar.setButtonStyleAsync('light');
    }
  }, []);

  useEffect(() => {
    if (isLoading) return;

    // If we have a session but profile hasn't loaded yet, wait.
    // This prevents routing before we know the user's role.
    if (session && profile === null) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inDelivery = segments[0] === 'delivery';
    const inWelcome = segments[0] === 'welcome';
    const role = profile?.role;

    if (!session && !inAuthGroup && !inWelcome) {
      router.replace('/welcome');
    } else if (session && (inAuthGroup || inWelcome)) {
      // Profile is loaded — now route based on role
      if (role === 'delivery') {
        router.replace('/delivery/dashboard');
      } else {
        router.replace('/(tabs)');
      }
    } else if (session && role === 'delivery' && !inDelivery) {
      router.replace('/delivery/dashboard');
    }
  }, [session, isLoading, segments, profile]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="welcome" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        <Stack.Screen name="cart" options={{ presentation: 'modal', title: 'My Cart', headerShown: true, headerStyle: { backgroundColor: '#8B0000' }, headerTintColor: '#fff' }} />
        <Stack.Screen name="checkout" options={{ title: 'Checkout', headerShown: true, headerStyle: { backgroundColor: '#8B0000' }, headerTintColor: '#fff' }} />
        <Stack.Screen name="admin" options={{ headerShown: false }} />
        <Stack.Screen name="delivery" options={{ headerShown: false }} />
        <Stack.Screen name="order" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="light" backgroundColor="#8B0000" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <CartProvider>
          <RootLayoutNav />
        </CartProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}

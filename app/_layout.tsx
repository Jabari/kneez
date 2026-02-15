// app/_layout.tsx
import { AuthProvider } from '../src/contexts/AuthContext';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { View, Platform, SafeAreaView, StyleSheet } from 'react-native';
import 'react-native-reanimated';
import '../global.css';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: 'index',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return null;

  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}

function RootLayoutNav() {
  return (
    <View style={[styles.root, Platform.OS === 'web' && styles.webFrame]}>
      {/* Keep SafeAreaView for native. On web we typically skip it. */}
      {Platform.OS === 'web' ? (
        <Stack screenOptions={{ headerShown: false }} initialRouteName="index">
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(public)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="intake-chat" options={{ headerShown: false }} />
          <Stack.Screen
            name="login-modal"
            options={{ presentation: 'modal', headerShown: false }}
          />
        </Stack>
      ) : (
        <SafeAreaView style={styles.root}>
          <Stack screenOptions={{ headerShown: false }} initialRouteName="index">
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="(public)" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="intake-chat" options={{ headerShown: false }} />
            <Stack.Screen
              name="login-modal"
              options={{ presentation: 'modal', headerShown: false }}
            />
          </Stack>
        </SafeAreaView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },

  // Web-only "mobile frame"
  webFrame: {
    width: '100%',
    maxWidth: 430,
    alignSelf: 'center',      // centers the 430px frame
    backgroundColor: '#fff',
  },
});

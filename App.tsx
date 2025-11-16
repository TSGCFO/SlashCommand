import React from "react";
import { StyleSheet, View, ActivityIndicator } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import { Ionicons, Feather } from "@expo/vector-icons";
import * as SplashScreen from "expo-splash-screen";

import DrawerNavigator from "@/navigation/DrawerNavigator";
import { ErrorBoundary } from "@/components/ErrorBoundary";

// Keep the splash screen visible while we fetch fonts
SplashScreen.preventAutoHideAsync();

export default function App() {
  // Load the icon fonts that are used throughout the app
  const [fontsLoaded, fontError] = useFonts({
    ...Ionicons.font,
    ...Feather.font,
  });

  React.useEffect(() => {
    if (fontsLoaded || fontError) {
      // Hide the splash screen once fonts are loaded or if there's an error
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  // Show loading indicator while fonts are loading
  if (!fontsLoaded && !fontError) {
    return (
      <View style={[styles.root, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
  <ErrorBoundary>
    <SafeAreaProvider>
        <GestureHandlerRootView style={styles.root}>
          <KeyboardProvider>
            <NavigationContainer>
              <DrawerNavigator />
            </NavigationContainer>
            <StatusBar style="auto" />
          </KeyboardProvider>
        </GestureHandlerRootView>
      </SafeAreaProvider>
  </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
});

import React, { useCallback, useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import {
  PlayfairDisplay_600SemiBold,
  PlayfairDisplay_600SemiBold_Italic,
} from "@expo-google-fonts/playfair-display";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { RootNavigator } from "./src/navigation/RootNavigator";
import { authService } from "./src/services";
import { useAuthStore } from "./src/store/authStore";
import { colors } from "./src/theme";

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    "Geist-Thin": require("./assets/fonts/Geist-Thin.ttf"),
    "Geist-Light": require("./assets/fonts/Geist-Light.ttf"),
    "Geist-Regular": require("./assets/fonts/Geist-Regular.ttf"),
    "Geist-Medium": require("./assets/fonts/Geist-Medium.ttf"),
    "Geist-SemiBold": require("./assets/fonts/Geist-SemiBold.ttf"),
    "Geist-Bold": require("./assets/fonts/Geist-Bold.ttf"),
    "Geist-Black": require("./assets/fonts/Geist-Black.ttf"),
    PlayfairDisplay_600SemiBold,
    PlayfairDisplay_600SemiBold_Italic,
  });

  // Resume a previously-verified session (stored token → GET /me) once at
  // launch, before the first screen ever renders, so a returning driver
  // never sees a flash of the login screen.
  const [authReady, setAuthReady] = useState(false);
  useEffect(() => {
    let active = true;
    authService
      .restoreSession()
      .then((session) => {
        if (active && session) useAuthStore.getState().setSession(session);
      })
      .finally(() => {
        if (active) setAuthReady(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if ((fontsLoaded || fontError) && authReady) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError, authReady]);

  useEffect(() => {
    onLayoutRootView();
  }, [onLayoutRootView]);

  if ((!fontsLoaded && !fontError) || !authReady) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer
          theme={{
            dark: false,
            colors: {
              primary: colors.primary,
              background: colors.background,
              card: colors.background,
              text: colors.textPrimary,
              border: colors.borderMuted,
              notification: colors.error,
            },
            fonts: {
              regular: { fontFamily: "Geist-Regular", fontWeight: "400" },
              medium: { fontFamily: "Geist-Medium", fontWeight: "500" },
              bold: { fontFamily: "Geist-Bold", fontWeight: "700" },
              heavy: { fontFamily: "Geist-Black", fontWeight: "900" },
            },
          }}
        >
          <RootNavigator />
          <StatusBar style="dark" />
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

import React, { useCallback, useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import {
  PlayfairDisplay_600SemiBold,
  PlayfairDisplay_600SemiBold_Italic,
} from "@expo-google-fonts/playfair-display";
import * as Notifications from "expo-notifications";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { createNavigationContainerRef, NavigationContainer } from "@react-navigation/native";
import { RootNavigator } from "./src/navigation/RootNavigator";
import { authService, dutyService } from "./src/services";
import { permissionsStorage } from "./src/storage/permissionsStorage";
import { useAuthStore } from "./src/store/authStore";
import { useDutyStore } from "./src/store/dutyStore";
import { colors } from "./src/theme";
import {
  ensureAndroidNotificationChannel,
  registerPushTokenIfPermitted,
} from "./src/services/notifications/pushNotifications";
import {
  createNotificationReceivedHandler,
  createNotificationTapHandler,
} from "./src/services/notifications/dutyAssignmentNotificationHandler";
import type { RootStackParamList } from "./src/navigation/types";

SplashScreen.preventAutoHideAsync().catch(() => {});

const navigationRef = createNavigationContainerRef<RootStackParamList>();

// Wiring only -- the actual decision logic (refetch, then route off real
// backend state, never the payload) lives in dutyAssignmentNotificationHandler
// so it's unit-testable without rendering the whole app.
const handleNotificationReceived = createNotificationReceivedHandler({
  getTodayDuty: () => dutyService.getTodayDuty(),
  setTodayDuty: (duty) => useDutyStore.getState().setTodayDuty(duty),
});
const handleNotificationTap = createNotificationTapHandler({
  getTodayDuty: () => dutyService.getTodayDuty(),
  setTodayDuty: (duty) => useDutyStore.getState().setTodayDuty(duty),
  navigation: {
    isReady: () => navigationRef.isReady(),
    navigateToAcceptDuty: () => navigationRef.navigate("Duty", { screen: "AcceptDuty" }),
    navigateToHome: () => navigationRef.navigate("Main", { screen: "Home" }),
  },
});

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

  // Loads the persisted "permission wizard completed" flag once at launch,
  // purely locally (no network call), before RootNavigator ever mounts --
  // gating the splash exactly like authReady does below, so there is no
  // window where RootNavigator can decide "permissions" off the in-memory
  // default (false) before this read resolves. Only ever flips the store to
  // true here: the default is already false, and a storage read failure
  // resolves to false (see permissionsStorage), which is the correct fail-
  // safe outcome -- worst case the wizard shows again, never a false skip.
  const [permissionsReady, setPermissionsReady] = useState(false);
  useEffect(() => {
    let active = true;
    permissionsStorage
      .getPermissionsDone()
      .then((done) => {
        if (active && done) useAuthStore.getState().setPermissionsDone(true);
      })
      .finally(() => {
        if (active) setPermissionsReady(true);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    ensureAndroidNotificationChannel().catch(() => {});
  }, []);

  // Registers the push token whenever a session becomes established --
  // fresh login or a restored session on cold start -- and only if
  // permission was already granted (a no-op prompt-free check otherwise).
  // Re-registering an unchanged token is a cheap no-op (see
  // registerPushTokenIfPermitted), so this never needs its own dedup logic.
  const session = useAuthStore((s) => s.session);
  useEffect(() => {
    if (session) {
      registerPushTokenIfPermitted();
    }
  }, [session]);

  // Foreground receipt: authoritative refetch only, never navigate -- the OS
  // banner (see pushNotifications.ts's handler config) already surfaces it.
  // Tap (foreground or backgrounded-then-opened): always re-fetch and route
  // off real backend state, never the payload (see handleNotificationTap).
  useEffect(() => {
    const receivedSub = Notifications.addNotificationReceivedListener(handleNotificationReceived);
    const responseSub = Notifications.addNotificationResponseReceivedListener(() => {
      handleNotificationTap();
    });
    return () => {
      receivedSub.remove();
      responseSub.remove();
    };
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if ((fontsLoaded || fontError) && authReady && permissionsReady) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError, authReady, permissionsReady]);

  useEffect(() => {
    onLayoutRootView();
  }, [onLayoutRootView]);

  if ((!fontsLoaded && !fontError) || !authReady || !permissionsReady) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer
          ref={navigationRef}
          onReady={() => {
            // App launched by tapping a notification (killed-app case) --
            // handled once, exactly when navigation is actually ready to
            // accept a navigate() call.
            const response = Notifications.getLastNotificationResponse();
            if (response) {
              Notifications.clearLastNotificationResponse();
              handleNotificationTap();
            }
          }}
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

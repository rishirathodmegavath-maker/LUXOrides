import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { RootStackParamList } from "./types";
import { useAuthStore } from "../store/authStore";
import { AuthNavigator } from "./AuthNavigator";
import { PermissionsNavigator } from "./PermissionsNavigator";
import { OnboardingNavigator } from "./OnboardingNavigator";
import { MainDrawerNavigator } from "./MainDrawerNavigator";
import { DutyNavigator } from "./DutyNavigator";
import { HelpNavigator } from "./HelpNavigator";
import { TripDetailsScreen } from "../screens/home/TripDetailsScreen";
import { NetworkBanner } from "../components";
import { useNetworkReconnectSync } from "../hooks/useNetworkReconnectSync";

const Stack = createNativeStackNavigator<RootStackParamList>();

// Gates which stack is mounted off real app state (session / permissions /
// approval) rather than manual cross-stack navigate() calls — the standard
// React Navigation auth-flow pattern. See useAuthStore.
export function RootNavigator() {
  const session = useAuthStore((s) => s.session);
  const permissionsDone = useAuthStore((s) => s.permissionsDone);
  const approvalStatus = useAuthStore((s) => s.approvalStatus);
  useNetworkReconnectSync();

  let content: React.ReactElement;

  if (!session) {
    content = (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Auth" component={AuthNavigator} />
      </Stack.Navigator>
    );
  } else if (!permissionsDone) {
    content = (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Permissions" component={PermissionsNavigator} />
      </Stack.Navigator>
    );
  } else if (approvalStatus !== "approved") {
    content = (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Onboarding" component={OnboardingNavigator} />
      </Stack.Navigator>
    );
  } else {
    content = (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main" component={MainDrawerNavigator} />
        <Stack.Screen name="Duty" component={DutyNavigator} />
        <Stack.Screen name="HelpStack" component={HelpNavigator} />
        <Stack.Screen name="TripDetails" component={TripDetailsScreen} />
      </Stack.Navigator>
    );
  }

  return (
    <>
      {content}
      <NetworkBanner />
    </>
  );
}

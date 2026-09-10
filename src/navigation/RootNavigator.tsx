import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { RootStackParamList } from "./types";
import { resolveRootStack } from "./resolveRootStack";
import { useAuthStore } from "../store/authStore";
import { useVersionStore } from "../store/versionStore";
import { AuthNavigator } from "./AuthNavigator";
import { PermissionsNavigator } from "./PermissionsNavigator";
import { OnboardingNavigator } from "./OnboardingNavigator";
import { MainDrawerNavigator } from "./MainDrawerNavigator";
import { DutyNavigator } from "./DutyNavigator";
import { HelpNavigator } from "./HelpNavigator";
import { TripDetailsScreen } from "../screens/home/TripDetailsScreen";
import { UpdateRequiredScreen } from "../screens/UpdateRequiredScreen";
import { NetworkBanner } from "../components";
import { useNetworkReconnectSync } from "../hooks/useNetworkReconnectSync";

const Stack = createNativeStackNavigator<RootStackParamList>();

// Gates which stack is mounted off real app state (session / permissions /
// approval / force-update) rather than manual cross-stack navigate() calls
// — the standard React Navigation auth-flow pattern. See useAuthStore.
export function RootNavigator() {
  const session = useAuthStore((s) => s.session);
  const permissionsDone = useAuthStore((s) => s.permissionsDone);
  const approvalStatus = useAuthStore((s) => s.approvalStatus);
  const forceUpdateRequired = useVersionStore((s) => s.forceUpdateRequired);
  const latestVersion = useVersionStore((s) => s.latestVersion);
  const hadActiveDutyAtLaunch = useVersionStore((s) => s.hadActiveDutyAtLaunch);
  useNetworkReconnectSync();

  // Takes priority over every other gate, including login -- an
  // unsupported build shouldn't be trusted to even attempt auth. The one
  // exception: a driver already mid-duty at launch is never pulled out of
  // it over a version check (see App.tsx's launch-time snapshot via
  // dutyStorage) -- they simply see the gate on their next relaunch,
  // once nothing real is at risk of being interrupted. See
  // resolveRootStack for the (independently unit-tested) decision itself.
  const stack = resolveRootStack({ session, permissionsDone, approvalStatus, forceUpdateRequired, hadActiveDutyAtLaunch });

  let content: React.ReactElement;
  if (stack === "update-required") {
    content = (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="UpdateRequired">
          {() => <UpdateRequiredScreen latestVersion={latestVersion} />}
        </Stack.Screen>
      </Stack.Navigator>
    );
  } else if (stack === "auth") {
    content = (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Auth" component={AuthNavigator} />
      </Stack.Navigator>
    );
  } else if (stack === "permissions") {
    content = (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Permissions" component={PermissionsNavigator} />
      </Stack.Navigator>
    );
  } else if (stack === "onboarding") {
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

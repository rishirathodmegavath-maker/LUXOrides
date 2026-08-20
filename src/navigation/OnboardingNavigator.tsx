import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { OnboardingStackParamList } from "./types";
import { useAuthStore } from "../store/authStore";
import { ProfileBasicsScreen } from "../screens/onboarding/ProfileBasicsScreen";
import { OnboardingHubScreen } from "../screens/onboarding/OnboardingHubScreen";
import { DocEntryScreen } from "../screens/onboarding/DocEntryScreen";
import { DocUploadScreen } from "../screens/onboarding/DocUploadScreen";
import { GarageLocationScreen } from "../screens/onboarding/GarageLocationScreen";
import { PrivacyTermsScreen } from "../screens/onboarding/PrivacyTermsScreen";
import { ProfilePhotoScreen } from "../screens/onboarding/ProfilePhotoScreen";
import { AlmostReadyScreen } from "../screens/onboarding/AlmostReadyScreen";

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

export function OnboardingNavigator() {
  const isNewUser = useAuthStore((s) => s.session?.isNewUser);

  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName={isNewUser ? "PrivacyTerms" : "OnboardingHub"}
    >
      <Stack.Screen name="PrivacyTerms" component={PrivacyTermsScreen} />
      <Stack.Screen name="ProfileBasics" component={ProfileBasicsScreen} />
      <Stack.Screen name="OnboardingHub" component={OnboardingHubScreen} />
      <Stack.Screen name="DocEntry" component={DocEntryScreen} />
      <Stack.Screen name="DocUpload" component={DocUploadScreen} />
      <Stack.Screen name="GarageLocation" component={GarageLocationScreen} />
      <Stack.Screen name="ProfilePhoto" component={ProfilePhotoScreen} />
      <Stack.Screen name="AlmostReady" component={AlmostReadyScreen} />
    </Stack.Navigator>
  );
}

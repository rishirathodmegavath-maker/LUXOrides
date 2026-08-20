import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { HelpStackParamList } from "./types";
import { HelpScreen } from "../screens/help/HelpScreen";
import { FaqScreen } from "../screens/help/FaqScreen";
import { LiveChatScreen } from "../screens/help/LiveChatScreen";

const Stack = createNativeStackNavigator<HelpStackParamList>();

export function HelpNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Help" component={HelpScreen} />
      <Stack.Screen name="Faqs" component={FaqScreen} />
      <Stack.Screen name="LiveChat" component={LiveChatScreen} />
    </Stack.Navigator>
  );
}

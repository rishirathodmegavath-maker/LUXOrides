import React from "react";
import { View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import type { MainTabParamList } from "./types";
import { HomeScreen } from "../screens/home/HomeScreen";
import { TripsScreen } from "../screens/home/TripsScreen";
import { ActivityScreen } from "../screens/home/ActivityScreen";
import { ProfileScreen } from "../screens/home/ProfileScreen";
import { colors } from "../theme";

const Tab = createBottomTabNavigator<MainTabParamList>();

const ICONS: Record<keyof MainTabParamList, keyof typeof Feather.glyphMap> = {
  Home: "home",
  Trips: "calendar",
  Activity: "clock",
  Profile: "user",
};

// Mirrors the Figma bottom tab bar seen across Home/Trips/Payment screens
// (Home/Trips/Activity/Profile Nav Bar components, nodes 433:2665 /
// 435:2789 / 436:2891 / 435:2709).
export function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { height: 84, paddingTop: 8, paddingBottom: 24 },
        tabBarLabelStyle: { fontSize: 12 },
        tabBarIcon: ({ color, size }) => (
          <View>
            <Feather name={ICONS[route.name]} size={size} color={color} />
          </View>
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Trips" component={TripsScreen} />
      <Tab.Screen name="Activity" component={ActivityScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

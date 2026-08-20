import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { PermissionsStackParamList } from "./types";
import { PermissionScreen } from "../screens/permissions/PermissionScreen";

const Stack = createNativeStackNavigator<PermissionsStackParamList>();

export function PermissionsNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Permission">
      <Stack.Screen name="Permission" component={PermissionScreen} initialParams={{ kind: "location" }} />
    </Stack.Navigator>
  );
}

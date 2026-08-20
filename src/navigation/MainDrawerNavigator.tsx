import React from "react";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { MainTabNavigator } from "./MainTabNavigator";
import { SideDrawerContent } from "./SideDrawerContent";
import { colors } from "../theme";

const Drawer = createDrawerNavigator();

// Wraps the bottom-tab app in a drawer for the Figma side-menu ("Home
// Menu Bar" frames 671:10006 / 671:10174), opened via the hamburger icon
// on Home/duty headers.
export function MainDrawerNavigator() {
  return (
    <Drawer.Navigator
      screenOptions={{ headerShown: false, drawerStyle: { width: "84%" }, overlayColor: colors.overlay }}
      drawerContent={(props) => <SideDrawerContent {...props} />}
    >
      <Drawer.Screen name="MainTabs" component={MainTabNavigator} />
    </Drawer.Navigator>
  );
}

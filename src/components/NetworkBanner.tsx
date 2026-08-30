import React from "react";
import { SafeAreaView, StyleSheet, Text } from "react-native";
import { useNetworkStatus } from "../hooks/useNetworkStatus";
import { colors, spacing, type } from "../theme";

// Real device connectivity banner, mounted once at the root so it overlays
// every screen. Distinct from StatusToggle (the driver's own "accepting
// duties" toggle) -- this reflects whether the device actually has a network
// connection at all.
export function NetworkBanner() {
  const { isOffline } = useNetworkStatus();

  if (!isOffline) return null;

  return (
    <SafeAreaView style={styles.wrap} pointerEvents="none">
      <Text style={styles.label}>No internet connection</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    backgroundColor: colors.error,
    paddingVertical: spacing.xs,
  },
  label: { ...type.caption, color: colors.background, fontWeight: "600" },
});

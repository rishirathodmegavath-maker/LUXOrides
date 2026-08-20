import React from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import { Feather } from "@expo/vector-icons";
import { colors } from "../theme";

export interface MapPreviewProps {
  height?: number;
  style?: ViewStyle;
}

// Phase 1 explicitly excludes ORS/live-maps integration, so duty screens
// that showed a live Google Map in Figma (Duty Start Map, Pickup/Drop-off
// Map, Garage Map) render this static placeholder instead of a real map
// SDK. Flagged in the fidelity report.
export function MapPreview({ height = 320, style }: MapPreviewProps) {
  return (
    <View style={[styles.wrap, { height }, style]}>
      <View style={styles.grid} />
      <Feather name="navigation" size={28} color={colors.primary} style={styles.pin} />
      <View style={styles.route} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
    backgroundColor: colors.slate[100],
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  grid: {
    ...StyleSheet.absoluteFillObject,
    borderColor: colors.slate[200],
    borderWidth: 1,
    opacity: 0.6,
  },
  pin: { zIndex: 2 },
  route: {
    position: "absolute",
    width: "60%",
    height: 3,
    backgroundColor: colors.info,
    borderRadius: 2,
    transform: [{ rotate: "-18deg" }],
  },
});

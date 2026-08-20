import React from "react";
import { StyleSheet, View } from "react-native";
import { colors, radius, spacing } from "../theme";

export interface ProgressBarProps {
  steps: number;
  completedSteps: number;
}

// Mirrors the Figma "Progress Bar" component (node 256:1816): a row of
// pill segments, filled navy for completed, light grey for pending.
export function ProgressBar({ steps, completedSteps }: ProgressBarProps) {
  return (
    <View style={styles.row}>
      {Array.from({ length: steps }, (_, i) => (
        <View key={i} style={[styles.segment, i < completedSteps ? styles.done : styles.pending]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: spacing.xs },
  segment: { flex: 1, height: 6, borderRadius: radius.pill },
  done: { backgroundColor: colors.primary },
  pending: { backgroundColor: colors.borderMuted },
});

import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, type } from "../theme";

export interface StatusToggleProps {
  online: boolean;
  onToggle: (next: boolean) => void;
}

// Mirrors the Figma "Duty Toggle" component (node 461:2907) + the
// Home header pill: green "ONLINE" switch on a light-green bar, grey
// "OFFLINE" switch on a light-grey bar.
export function StatusToggle({ online, onToggle }: StatusToggleProps) {
  return (
    <View style={styles.row}>
      <Text style={[styles.label, { color: online ? colors.successStrong : colors.textPrimary }]}>
        {online ? "ONLINE" : "OFFLINE"}
      </Text>
      <Pressable
        onPress={() => onToggle(!online)}
        style={[styles.track, online ? styles.trackOn : styles.trackOff]}
      >
        <View style={[styles.thumb, online ? styles.thumbOn : styles.thumbOff]} />
      </Pressable>
    </View>
  );
}

const TRACK_W = 52;
const TRACK_H = 30;
const THUMB = 24;

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  label: { ...type.h4, letterSpacing: 0.5 },
  track: {
    width: TRACK_W,
    height: TRACK_H,
    borderRadius: radius.pill,
    justifyContent: "center",
    padding: 3,
  },
  trackOn: { backgroundColor: colors.primary, alignItems: "flex-end" },
  trackOff: { backgroundColor: colors.slate[300], alignItems: "flex-start" },
  thumb: { width: THUMB, height: THUMB, borderRadius: THUMB / 2 },
  thumbOn: { backgroundColor: colors.background },
  thumbOff: { backgroundColor: colors.background },
});

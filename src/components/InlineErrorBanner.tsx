import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, type } from "../theme";

interface Props {
  message?: string;
  onRetry: () => void;
}

// A screen's initial data load failing (network drop, server error) used to
// be indistinguishable from that data genuinely being empty -- "No duty
// assigned yet" and "couldn't reach the server" rendered identically, with
// no way for the driver to tell which one they're looking at or do
// anything about it. Renders inline in a screen's own content flow (unlike
// NetworkBanner/LocationPermissionBanner, which overlay the whole screen),
// so it sits right above/instead of whatever content failed to load.
export function InlineErrorBanner({ message = "Couldn't load the latest data.", onRetry }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.message}>{message}</Text>
      <Pressable onPress={onRetry} hitSlop={8} accessibilityRole="button" accessibilityLabel="Retry">
        <Text style={styles.retry}>Retry</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    backgroundColor: colors.errorBg,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  message: { ...type.body2, color: colors.error, flex: 1 },
  retry: { ...type.label, color: colors.error, fontWeight: "700", textDecorationLine: "underline" },
});

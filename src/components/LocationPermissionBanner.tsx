import React from "react";
import { Linking, Pressable, SafeAreaView, StyleSheet, Text } from "react-native";
import type { LocationReportingStatus } from "../hooks/useDutyLocationReporter";
import type { GpsQuality } from "../util/gpsQuality";
import { colors, spacing, type } from "../theme";

interface Props {
  status: LocationReportingStatus;
  quality?: GpsQuality;
}

// Surfaces the failure modes useDutyLocationReporter/useGpsQuality would
// otherwise leave completely silent: permission denied/revoked (from OS
// Settings, or an OS auto-revoke of an unused permission), and GPS going
// stale/unavailable while tracking is still nominally running (deep
// indoors, GPS radio issue, airplane mode). Takes both as props rather
// than calling the hooks itself -- DutyNavigator already owns the single
// live useDutyLocationReporter()/useGpsQuality() calls; a second call here
// would start a second, redundant watch/background-task registration.
//
// Denied always wins (it's the more actionable, more severe state); a
// merely weak-but-fresh fix never shows a banner at all -- the backend is
// still receiving real pings, so there's nothing for the driver to act on,
// and flagging every accuracy dip would just be alert spam.
export function LocationPermissionBanner({ status, quality = "good" }: Props) {
  if (status === "denied") {
    return (
      <SafeAreaView style={[styles.wrap, styles.severe]}>
        <Pressable
          onPress={() => Linking.openSettings()}
          style={styles.row}
          accessibilityRole="button"
          accessibilityLabel="Location permission is required to continue this duty. Open Settings"
        >
          <Text style={styles.label}>Location permission is required to continue this duty.</Text>
          <Text style={styles.action}>Open Settings</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  if (status === "active" || status === "foreground-only") {
    if (quality === "stale" || quality === "unavailable") {
      return (
        <SafeAreaView style={[styles.wrap, styles.caution]}>
          <Pressable
            onPress={() => Linking.openSettings()}
            style={styles.row}
            accessibilityRole="button"
            accessibilityLabel="Location unavailable. Move to an open area or check that Location is turned on. Open Settings"
          >
            <Text style={[styles.label, styles.labelCaution]}>Location unavailable — move to an open area or check Location settings.</Text>
            <Text style={[styles.action, styles.labelCaution]}>Open Settings</Text>
          </Pressable>
        </SafeAreaView>
      );
    }
  }

  return null;
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
  severe: { backgroundColor: colors.error },
  caution: { backgroundColor: colors.warning },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  label: { ...type.caption, color: colors.background, fontWeight: "600", flex: 1 },
  labelCaution: { color: colors.textPrimary },
  action: { ...type.caption, color: colors.background, fontWeight: "700", textDecorationLine: "underline" },
});

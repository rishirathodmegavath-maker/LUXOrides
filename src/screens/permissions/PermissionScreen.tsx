import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { PermissionKind, PermissionsStackParamList } from "../../navigation/types";
import { Button, ScreenContainer } from "../../components";
import { useAuthStore } from "../../store/authStore";
import { colors, radius, spacing, type } from "../../theme";

type Props = NativeStackScreenProps<PermissionsStackParamList, "Permission">;

const ORDER: PermissionKind[] = ["location", "notifications", "phoneCalls", "camera"];

const COPY: Record<PermissionKind, { icon: keyof typeof Feather.glyphMap; title: string; body: string }> = {
  location: {
    icon: "map-pin",
    title: "Allow Location Access",
    body: "LuxoRides Chauffeur uses your location to navigate to pickups, track duties, and share live trip status.",
  },
  notifications: {
    icon: "bell",
    title: "Turn On Notifications",
    body: "Get notified instantly when a new duty is assigned, or when a client message arrives.",
  },
  phoneCalls: {
    icon: "phone",
    title: "Allow Phone Calls",
    body: "Call clients or LuxoRides support directly from the app during an active duty.",
  },
  camera: {
    icon: "camera",
    title: "Allow Camera Access",
    body: "Capture your uniform selfie, vehicle checklist photos, and identity documents for verification.",
  },
};

// Mirrors the Figma "Location / Notifications / Phone Calls / Camera Access
// Permission" frames (nodes 669:8409 / 669:8422 / 669:8435 / 669:8448) — one
// reusable primer screen driven by `kind`, matching the shared layout.
// Phase 1 has no location/notification backend to wire real OS permission
// results into, so "Allow" simply advances the primer sequence.
export function PermissionScreen({ route, navigation }: Props) {
  const { kind } = route.params;
  const copy = COPY[kind];
  const setPermissionsDone = useAuthStore((s) => s.setPermissionsDone);

  const advance = () => {
    const idx = ORDER.indexOf(kind);
    if (idx < ORDER.length - 1) {
      navigation.replace("Permission", { kind: ORDER[idx + 1] });
    } else {
      setPermissionsDone(true);
    }
  };

  return (
    <ScreenContainer
      footer={
        <View style={{ gap: spacing.sm }}>
          <Button label="Allow" onPress={advance} />
          <Button label="Not Now" variant="ghost" onPress={advance} />
        </View>
      }
    >
      <View style={styles.iconWrap}>
        <Feather name={copy.icon} size={40} color={colors.primary} />
      </View>
      <Text style={styles.title}>{copy.title}</Text>
      <Text style={styles.body}>{copy.body}</Text>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: radius.pill,
    backgroundColor: colors.teal[50],
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.xxxl,
    marginBottom: spacing.xl,
  },
  title: { ...type.h2, color: colors.textPrimary },
  body: { ...type.body1, color: colors.textSecondary, marginTop: spacing.sm },
});

import React, { useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import * as Location from "expo-location";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { PermissionKind, PermissionsStackParamList } from "../../navigation/types";
import { Button, ScreenContainer } from "../../components";
import { useAuthStore } from "../../store/authStore";
import { colors, spacing, type } from "../../theme";

type Props = NativeStackScreenProps<PermissionsStackParamList, "Permission">;

const ORDER: PermissionKind[] = ["location", "notifications", "phoneCalls", "camera"];

const COPY: Record<PermissionKind, { illustration: number; title: string; body: string }> = {
  location: {
    illustration: require("../../../assets/illustrations/permission_location.png"),
    title: "Allow “Luxorides Chauffeur” to access this device’s location?",
    body: "Operations uses your live location to assign trips, navigate you to pickups, and track duty distance. You can change this permission anytime in Settings.",
  },
  notifications: {
    illustration: require("../../../assets/illustrations/permission_notifications.png"),
    title: "This app wants to send you notifications",
    body: "To notify you instantly about new trip requests, duty updates, and important alerts. Without this permission, you may miss important operational updates.",
  },
  phoneCalls: {
    illustration: require("../../../assets/illustrations/permission_phone.png"),
    title: "Phone Permission Required",
    body: "For us to authenticate your device, and let you all operations and customers directly from the app. Phone access helps you make calls directly from the app without dialing numbers manually.",
  },
  camera: {
    illustration: require("../../../assets/illustrations/permission_camera.png"),
    title: "Camera Permission Required",
    body: "To capture your photo, vehicle standards, and required documents. Your camera is only used when you choose to take a photo within the app.",
  },
};

// Mirrors the Figma "Location / Notifications / Phone Calls / Camera Access
// Permission" frames (nodes 669:8409 / 669:8422 / 669:8435 / 669:8448) —
// exact copy transcribed from the file's own text nodes, illustrations
// exported directly from the frames' "Image Container" rectangles. One
// reusable primer screen driven by `kind`, matching the shared layout.
//
// For "location", "Allow Permission" now triggers the real OS foreground
// prompt (requestForegroundPermissionsAsync) -- previously this button did
// nothing but advance the wizard regardless of what the driver tapped.
// Deliberately foreground-only here: requesting background location during
// onboarding (before a duty exists to justify it) is against both Android
// and iOS review guidance and would just get auto-denied by the OS on
// modern versions -- backgroundLocationTask requests that separately, in
// context, the moment a duty actually starts.
export function PermissionScreen({ route, navigation }: Props) {
  const { kind } = route.params;
  const copy = COPY[kind];
  const setPermissionsDone = useAuthStore((s) => s.setPermissionsDone);
  const [requesting, setRequesting] = useState(false);

  const goNext = () => {
    const idx = ORDER.indexOf(kind);
    if (idx < ORDER.length - 1) {
      navigation.replace("Permission", { kind: ORDER[idx + 1] });
    } else {
      setPermissionsDone(true);
    }
  };

  const onAllow = async () => {
    if (kind !== "location") {
      goNext();
      return;
    }
    setRequesting(true);
    try {
      await Location.requestForegroundPermissionsAsync();
    } finally {
      setRequesting(false);
      goNext();
    }
  };

  return (
    <ScreenContainer
      footer={
        <View style={{ gap: spacing.sm }}>
          <Button label="Allow Permission" onPress={onAllow} loading={requesting} />
          <Button label="Skip for now" variant="secondary" onPress={goNext} disabled={requesting} />
        </View>
      }
    >
      <View style={styles.handle} />
      <Text style={styles.title}>{copy.title}</Text>
      <Text style={styles.body}>{copy.body}</Text>
      <View style={styles.illustrationWrap}>
        <Image source={copy.illustration} style={styles.illustration} resizeMode="contain" />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderMuted,
    alignSelf: "center",
    marginBottom: spacing.xl,
  },
  title: { ...type.h2, color: colors.textPrimary, textAlign: "center" },
  body: { ...type.body1, color: colors.textSecondary, textAlign: "center", marginTop: spacing.sm },
  illustrationWrap: { alignItems: "center", marginTop: spacing.xxl },
  illustration: { width: 220, height: 220 },
});

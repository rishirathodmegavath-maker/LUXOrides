import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { colors, radius, spacing, type } from "../theme";

export type CaptureStatus = "idle" | "uploading" | "verifying" | "verified" | "failed";

export interface PhotoCaptureProps {
  uri?: string;
  status: CaptureStatus;
  onCapture: (uri: string) => void;
  label?: string;
  errorText?: string;
  aspect?: [number, number];
  compact?: boolean;
}

const STATUS_COPY: Record<CaptureStatus, { text: string; color: string } | null> = {
  idle: null,
  uploading: { text: "Uploading…", color: colors.info },
  verifying: { text: "Verifying…", color: colors.warning },
  verified: { text: "Verified", color: colors.success },
  failed: { text: "Verification failed", color: colors.error },
};

// Shared capture surface used across every document / vehicle / uniform /
// profile photo step, mirroring the repeated Figma "Photo Upload" pattern
// (nodes 671:9059, 675:11934, 675:12064, 671:8894, …) — one component
// instead of near-duplicate screens per state.
export function PhotoCapture({ uri, status, onCapture, label = "Tap to take a photo", errorText, aspect = [4, 3], compact }: PhotoCaptureProps) {
  const copy = STATUS_COPY[status];

  // Upload is in flight for the duration of "uploading" (onCapture's own
  // await, set by every screen before calling it) -- disabling the trigger
  // for exactly that window, and no longer, is what prevents a double-tap/
  // fast-retry from firing a second concurrent upload of the same photo
  // while still letting a driver freely retake after "failed", or retake a
  // "verifying"/"verified" photo (neither is an in-flight request).
  const uploadInFlight = status === "uploading";

  const pick = async () => {
    if (uploadInFlight) {
      return;
    }
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    const result = permission.granted
      ? await ImagePicker.launchCameraAsync({ quality: 0.7, aspect, allowsEditing: true })
      : await ImagePicker.launchImageLibraryAsync({ quality: 0.7, aspect, allowsEditing: true });
    if (!result.canceled && result.assets[0]) {
      onCapture(result.assets[0].uri);
    }
  };

  return (
    <View>
      <Pressable
        disabled={uploadInFlight}
        style={[styles.frame, compact && styles.frameCompact, status === "failed" && styles.frameError]}
        onPress={pick}
      >
        {uri ? (
          <Image source={{ uri }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={styles.placeholder}>
            <Feather name="camera" size={32} color={colors.textMuted} />
            <Text style={styles.placeholderText}>{label}</Text>
          </View>
        )}
        {uri ? (
          <View style={styles.retakeBadge}>
            <Feather name="refresh-ccw" size={14} color={colors.textInverse} />
          </View>
        ) : null}
      </Pressable>
      {copy ? <Text style={[styles.status, { color: copy.color }]}>{copy.text}</Text> : null}
      {status === "failed" && errorText ? <Text style={styles.error}>{errorText}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    width: "100%",
    height: 220,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    backgroundColor: colors.surfaceSunken,
  },
  frameCompact: { height: 130 },
  frameError: { borderColor: colors.errorBorder },
  image: { width: "100%", height: "100%" },
  placeholder: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.xs },
  placeholderText: { ...type.body2, color: colors.textMuted },
  retakeBadge: {
    position: "absolute",
    right: spacing.sm,
    bottom: spacing.sm,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.overlay,
    alignItems: "center",
    justifyContent: "center",
  },
  status: { ...type.label, marginTop: spacing.sm },
  error: { ...type.body3, color: colors.error, marginTop: spacing.xxs },
});

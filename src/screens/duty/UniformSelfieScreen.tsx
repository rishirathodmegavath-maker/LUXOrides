import React, { useState } from "react";
import { StyleSheet, Text } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { DutyStackParamList } from "../../navigation/types";
import { Button, CaptureStatus, PhotoCapture, ScreenContainer, ScreenHeader } from "../../components";
import { useDutyStore } from "../../store/dutyStore";
import { colors, spacing, type } from "../../theme";

type Props = NativeStackScreenProps<DutyStackParamList, "UniformSelfie">;

// Mirrors the Figma "Duty Readiness- Uniform Selfie Page" frame (node
// 675:12180, also seen standalone as "Uniform Selfie Page" 675:11007).
export function UniformSelfieScreen({ navigation }: Props) {
  const [status, setStatus] = useState<CaptureStatus>("idle");
  const [uri, setUri] = useState<string>();
  const updateChecklist = useDutyStore((s) => s.updateChecklist);

  const onCapture = (pickedUri: string) => {
    setUri(pickedUri);
    setStatus("verified");
    updateChecklist({ uniformSelfieUri: pickedUri });
  };

  return (
    <ScreenContainer footer={<Button label="Continue" onPress={() => navigation.navigate("VehicleExterior")} disabled={status !== "verified"} />}>
      <ScreenHeader onBack={() => navigation.goBack()} title="Pre-Duty Check" />
      <Text style={styles.title}>Uniform Selfie</Text>
      <Text style={styles.subtitle}>Take a full-length selfie in your chauffeur uniform to confirm you&apos;re duty-ready.</Text>
      <PhotoCapture uri={uri} status={status} onCapture={onCapture} aspect={[3, 4]} label="Tap to take a selfie" />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { ...type.h1, color: colors.textPrimary },
  subtitle: { ...type.body1, color: colors.textSecondary, marginTop: spacing.sm, marginBottom: spacing.xl },
});

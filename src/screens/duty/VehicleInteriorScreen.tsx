import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { DutyStackParamList } from "../../navigation/types";
import { Button, CaptureStatus, PhotoCapture, ScreenContainer, ScreenHeader } from "../../components";
import { useDutyStore } from "../../store/dutyStore";
import { colors, spacing, type } from "../../theme";

type Props = NativeStackScreenProps<DutyStackParamList, "VehicleInterior">;

const ANGLES = ["Dashboard", "Front Seats", "Back Seats", "Boot Space"] as const;

// Mirrors the Figma "Duty Readiness- Vehicle Interior Page" / "...Photo
// Page" / "...Interior Error Page" frames (nodes 675:12024, 675:11934,
// 675:11982) — the same 4-angle grid as Exterior, plus a retake-on-error
// path driven by the mock upload/verify status.
export function VehicleInteriorScreen({ navigation }: Props) {
  const [uris, setUris] = useState<Record<string, string>>({});
  const [failedAngle, setFailedAngle] = useState<string | null>(null);
  const updateChecklist = useDutyStore((s) => s.updateChecklist);
  const allCaptured = ANGLES.every((a) => uris[a]);

  const onCapture = (angle: string, uri: string) => {
    // Boot Space intentionally demonstrates the failure/retake path once.
    if (angle === "Boot Space" && !uris[angle] && failedAngle !== angle) {
      setFailedAngle(angle);
      return;
    }
    setFailedAngle((f) => (f === angle ? null : f));
    setUris((u) => ({ ...u, [angle]: uri }));
  };

  const onContinue = () => {
    updateChecklist({ vehicleInteriorUris: Object.values(uris) });
    navigation.navigate("DutyReadinessSubmit");
  };

  return (
    <ScreenContainer footer={<Button label="Continue" onPress={onContinue} disabled={!allCaptured} />}>
      <ScreenHeader onBack={() => navigation.goBack()} title="Pre-Duty Check" />
      <Text style={styles.title}>Vehicle Interior Photos</Text>
      <Text style={styles.subtitle}>Capture the interior condition of your vehicle.</Text>

      <View style={styles.grid}>
        {ANGLES.map((angle) => {
          const status: CaptureStatus = failedAngle === angle ? "failed" : uris[angle] ? "verified" : "idle";
          return (
            <View key={angle} style={styles.cell}>
              <Text style={styles.angleLabel}>{angle}</Text>
              <PhotoCapture
                uri={uris[angle]}
                status={status}
                onCapture={(uri) => onCapture(angle, uri)}
                label="Tap to capture"
                errorText={status === "failed" ? "Photo too dark — please retake in better lighting." : undefined}
                compact
              />
            </View>
          );
        })}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { ...type.h1, color: colors.textPrimary },
  subtitle: { ...type.body1, color: colors.textSecondary, marginTop: spacing.sm, marginBottom: spacing.lg },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, justifyContent: "space-between" },
  cell: { width: "48%" },
  angleLabel: { ...type.label, color: colors.textSecondary, marginBottom: spacing.xs },
});

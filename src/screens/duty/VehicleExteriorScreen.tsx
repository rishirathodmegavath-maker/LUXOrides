import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { DutyStackParamList } from "../../navigation/types";
import { Button, PhotoCapture, ScreenContainer, ScreenHeader } from "../../components";
import { useDutyStore } from "../../store/dutyStore";
import { colors, spacing, type } from "../../theme";

type Props = NativeStackScreenProps<DutyStackParamList, "VehicleExterior">;

const ANGLES = ["Front", "Back", "Left Side", "Right Side"] as const;

// Mirrors the Figma "Duty Readiness- Vehicle Exterior Page" + "...Photo
// Page" frames (nodes 675:12115, 675:12064) — a 4-angle capture grid.
export function VehicleExteriorScreen({ navigation }: Props) {
  const [uris, setUris] = useState<Record<string, string>>({});
  const updateChecklist = useDutyStore((s) => s.updateChecklist);
  const allCaptured = ANGLES.every((a) => uris[a]);

  const onContinue = () => {
    updateChecklist({ vehicleExteriorUris: uris });
    navigation.navigate("VehicleInterior");
  };

  return (
    <ScreenContainer footer={<Button label="Continue" onPress={onContinue} disabled={!allCaptured} />}>
      <ScreenHeader onBack={() => navigation.goBack()} title="Pre-Duty Check" />
      <Text style={styles.title}>Vehicle Exterior Photos</Text>
      <Text style={styles.subtitle}>Capture all four angles of your vehicle&apos;s exterior.</Text>

      <View style={styles.grid}>
        {ANGLES.map((angle) => (
          <View key={angle} style={styles.cell}>
            <Text style={styles.angleLabel}>{angle}</Text>
            <PhotoCapture
              uri={uris[angle]}
              status={uris[angle] ? "verified" : "idle"}
              onCapture={(uri) => setUris((u) => ({ ...u, [angle]: uri }))}
              label="Tap to capture"
              compact
            />
          </View>
        ))}
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

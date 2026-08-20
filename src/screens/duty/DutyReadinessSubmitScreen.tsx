import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { DutyStackParamList } from "../../navigation/types";
import { Button, IconCircle, ProgressBar, ScreenContainer, ScreenHeader } from "../../components";
import { dutyService } from "../../services";
import { useDutyStore } from "../../store/dutyStore";
import { colors, spacing, type } from "../../theme";

type Props = NativeStackScreenProps<DutyStackParamList, "DutyReadinessSubmit">;

const STEPS = [
  { key: "uniformSelfieUri", icon: "user" as const, title: "Uniform Selfie", subtitle: "Uniform photo uploaded" },
  { key: "vehicleExteriorUris", icon: "truck" as const, title: "Vehicle Exterior Photos", subtitle: "Exterior photos of vehicle uploaded" },
  { key: "vehicleInteriorUris", icon: "disc" as const, title: "Vehicle Interior Photos", subtitle: "Interior photos of vehicle uploaded" },
];

// Mirrors the Figma "Duty Readiness Submit Page" frame (node 675:11871).
export function DutyReadinessSubmitScreen({ navigation }: Props) {
  const checklist = useDutyStore((s) => s.checklist);
  const setReadinessStatus = useDutyStore((s) => s.setReadinessStatus);
  const [submitting, setSubmitting] = useState(false);

  const isDone = (key: string) => {
    const value = checklist[key as keyof typeof checklist];
    return Array.isArray(value) ? value.length > 0 : !!value;
  };
  const completed = STEPS.filter((s) => isDone(s.key)).length;

  const onSubmit = async () => {
    setSubmitting(true);
    try {
      await dutyService.submitReadiness(checklist);
      setReadinessStatus("approved");
      navigation.navigate("DutyStartMap");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenContainer footer={<Button label="Submit to Operations" onPress={onSubmit} disabled={completed < STEPS.length} loading={submitting} />}>
      <ScreenHeader onBack={() => navigation.goBack()} />
      <Text style={styles.title}>Pre-Duty Check</Text>
      <Text style={styles.subtitle}>
        <Text style={styles.bold}>{completed}</Text> of <Text style={styles.bold}>{STEPS.length}</Text> steps completed
      </Text>
      <View style={{ marginTop: spacing.sm, marginBottom: spacing.xl }}>
        <ProgressBar steps={STEPS.length} completedSteps={completed} />
      </View>

      {STEPS.map((step) => (
        <View key={step.key} style={styles.row}>
          <IconCircle>
            <Feather name={step.icon} size={20} color={colors.textPrimary} />
          </IconCircle>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>{step.title}</Text>
            <Text style={styles.rowSubtitle}>{step.subtitle}</Text>
          </View>
          {isDone(step.key) ? <Feather name="check" size={22} color={colors.success} /> : null}
        </View>
      ))}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { ...type.h1, color: colors.textPrimary },
  subtitle: { ...type.body1, color: colors.textPrimary, marginTop: spacing.sm },
  bold: { fontFamily: type.h4.fontFamily },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderMuted,
  },
  rowTitle: { ...type.h4, fontSize: 16, color: colors.textPrimary },
  rowSubtitle: { ...type.body2, color: colors.textSecondary },
});

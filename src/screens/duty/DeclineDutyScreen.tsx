import React, { useState } from "react";
import { StyleSheet, Text } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { DutyStackParamList } from "../../navigation/types";
import { Button, ScreenContainer, ScreenHeader, TextField } from "../../components";
import { dutyService } from "../../services";
import { useDutyStore } from "../../store/dutyStore";
import { colors, spacing, type } from "../../theme";

type Props = NativeStackScreenProps<DutyStackParamList, "DeclineDuty">;

const REASONS = ["Vehicle unavailable", "Personal emergency", "Health issue", "Other"];

// No Figma frame exists for this step either — the sitemap's "Chauffeur to
// ask his ops team...to cancel duty" note describes the intent, not a
// screen. Original content matching the app's design system, mock-only
// (the real backend has no decline/cancel endpoint for drivers).
export function DeclineDutyScreen({ navigation }: Props) {
  const todayDuty = useDutyStore((s) => s.todayDuty);
  const resetDuty = useDutyStore((s) => s.resetDuty);
  const setTodayDuty = useDutyStore((s) => s.setTodayDuty);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    if (!todayDuty || !reason.trim()) return;
    setSubmitting(true);
    try {
      await dutyService.declineDuty(todayDuty.id, reason.trim());
      resetDuty();
      setTodayDuty(null);
      navigation.getParent()?.navigate("Main", { screen: "Home" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenContainer footer={<Button label="Submit" onPress={onSubmit} disabled={!reason.trim()} loading={submitting} />}>
      <ScreenHeader onBack={() => navigation.goBack()} title="Decline Duty" />
      <Text style={styles.title}>Why are you declining this duty?</Text>
      <Text style={styles.subtitle}>Your ops team will be notified so this duty can be reassigned.</Text>

      <TextField
        containerStyle={{ marginTop: spacing.xl }}
        placeholder="Tell us what happened"
        value={reason}
        onChangeText={setReason}
        multiline
        numberOfLines={4}
      />

      <Text style={styles.suggestLabel}>Common reasons</Text>
      {REASONS.map((r) => (
        <Text key={r} style={styles.suggestChip} onPress={() => setReason(r)}>
          {r}
        </Text>
      ))}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { ...type.h1, color: colors.textPrimary },
  subtitle: { ...type.body1, color: colors.textSecondary, marginTop: spacing.sm },
  suggestLabel: { ...type.label, color: colors.textSecondary, marginTop: spacing.xl, marginBottom: spacing.sm },
  suggestChip: {
    ...type.body2,
    color: colors.primary,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderMuted,
  },
});

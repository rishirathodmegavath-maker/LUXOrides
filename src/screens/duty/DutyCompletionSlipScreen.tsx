import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { DutyStackParamList } from "../../navigation/types";
import { Button, Card, ScreenContainer, ScreenHeader } from "../../components";
import { colors, radius, spacing, type } from "../../theme";

type Props = NativeStackScreenProps<DutyStackParamList, "DutyCompletionSlip">;

// Mirrors the Figma "Duty Completion Slip" frame (node 675:11171) — the
// client's digital signature confirming the trip is complete, per the
// sitemap's "Client signs digital slip confirming trip complete".
export function DutyCompletionSlipScreen({ navigation }: Props) {
  const [signed, setSigned] = useState(false);

  return (
    <ScreenContainer footer={<Button label="Confirm & Close Trip" onPress={() => navigation.navigate("BackToGarage")} disabled={!signed} />}>
      <ScreenHeader onBack={() => navigation.goBack()} title="Duty Completion Slip" />
      <Text style={styles.subtitle}>Hand your device to the client to confirm the trip is complete.</Text>

      <Card style={{ marginTop: spacing.xl }}>
        <Text style={styles.rowLabel}>Client Name</Text>
        <Text style={styles.rowValue}>Aditya Sharma</Text>
        <View style={styles.divider} />
        <Text style={styles.rowLabel}>Trip Status</Text>
        <Text style={styles.rowValue}>Completed</Text>
      </Card>

      <Pressable style={[styles.signatureBox, signed && styles.signatureBoxSigned]} onPress={() => setSigned(true)}>
        {signed ? (
          <>
            <Feather name="check-circle" size={28} color={colors.success} />
            <Text style={styles.signedText}>Signed by client</Text>
          </>
        ) : (
          <Text style={styles.signaturePrompt}>Tap here for client to sign</Text>
        )}
      </Pressable>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  subtitle: { ...type.body1, color: colors.textSecondary, marginTop: spacing.sm },
  rowLabel: { ...type.body3, color: colors.textSecondary },
  rowValue: { ...type.h4, fontSize: 16, color: colors.textPrimary, marginBottom: spacing.sm },
  divider: { height: 1, backgroundColor: colors.borderMuted, marginBottom: spacing.sm },
  signatureBox: {
    height: 160,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.border,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.xl,
  },
  signatureBoxSigned: { borderStyle: "solid", borderColor: colors.success, backgroundColor: colors.successBg },
  signaturePrompt: { ...type.body1, color: colors.textMuted },
  signedText: { ...type.h4, fontSize: 16, color: colors.success, marginTop: spacing.xs },
});

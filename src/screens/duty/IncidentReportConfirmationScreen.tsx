import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { DutyStackParamList } from "../../navigation/types";
import { Button, ScreenContainer } from "../../components";
import { colors, radius, spacing, type } from "../../theme";

type Props = NativeStackScreenProps<DutyStackParamList, "IncidentReportConfirmation">;

export function IncidentReportConfirmationScreen({ navigation }: Props) {
  return (
    <ScreenContainer style={styles.wrap}>
      <View style={styles.iconWrap}>
        <Feather name="check-circle" size={44} color={colors.success} />
      </View>
      <Text style={styles.title}>Report submitted</Text>
      <Text style={styles.subtitle}>Fleetovo has received your incident report.</Text>
      <Button label="Back to Duty" style={{ marginTop: spacing.xl }} onPress={() => navigation.pop(2)} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", justifyContent: "center" },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: radius.pill,
    backgroundColor: colors.teal[50],
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  title: { ...type.h1, color: colors.textPrimary, textAlign: "center" },
  subtitle: { ...type.body1, color: colors.textSecondary, textAlign: "center", marginTop: spacing.sm },
});

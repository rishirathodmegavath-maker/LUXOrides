import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { DutyStackParamList } from "../../navigation/types";
import { Button, ScreenContainer } from "../../components";
import { useDutyStore } from "../../store/dutyStore";
import { colors, radius, spacing, type } from "../../theme";

type Props = NativeStackScreenProps<DutyStackParamList, "DutyClosed">;

// Mirrors the Figma "Duty Closed" frame (node 675:11022) — "Trip Ends" per
// the sitemap, back to the Home dashboard.
export function DutyClosedScreen({ navigation }: Props) {
  const resetDuty = useDutyStore((s) => s.resetDuty);
  const setOnline = useDutyStore((s) => s.setOnline);

  const onDone = () => {
    resetDuty();
    setOnline(false);
    navigation.getParent()?.navigate("Main", { screen: "Home" });
  };

  return (
    <ScreenContainer style={styles.wrap} footer={<Button label="Back to Home" onPress={onDone} />}>
      <View style={styles.iconWrap}>
        <Feather name="check" size={48} color={colors.textInverse} />
      </View>
      <Text style={styles.title}>Duty Closed</Text>
      <Text style={styles.subtitle}>Great work! This duty has been completed and closed successfully.</Text>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", justifyContent: "center" },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: radius.pill,
    backgroundColor: colors.success,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  title: { ...type.h1, color: colors.textPrimary, textAlign: "center" },
  subtitle: { ...type.body1, color: colors.textSecondary, textAlign: "center", marginTop: spacing.sm },
});

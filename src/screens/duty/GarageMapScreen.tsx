import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { DutyStackParamList } from "../../navigation/types";
import { Button, MapPreview } from "../../components";
import { dutyService } from "../../services";
import { colors, radius, spacing, type } from "../../theme";

type Props = NativeStackScreenProps<DutyStackParamList, "GarageMap">;

// Mirrors the Figma "Garage Map" + "Garage Map Duty Complete" frames
// (nodes 675:11092, 675:11049) — one dynamic screen for arriving vs.
// duty-complete state instead of two routes.
export function GarageMapScreen({ navigation }: Props) {
  const [arrived, setArrived] = useState(false);

  const onConfirm = async () => {
    if (!arrived) {
      setArrived(true);
      return;
    }
    await dutyService.closeDuty();
    navigation.navigate("DutyClosed");
  };

  return (
    <View style={styles.root}>
      <MapPreview style={{ flex: 1 }} />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <View style={styles.iconRow}>
          <Feather name="home" size={22} color={colors.primary} />
          <Text style={styles.title}>{arrived ? "Duty Complete" : "Approaching Garage"}</Text>
        </View>
        <Text style={styles.subtitle}>
          {arrived
            ? "You've returned to the garage. This duty is now complete."
            : "You're nearly back at Garage Inc., New Delhi."}
        </Text>
        <Button label={arrived ? "Close Duty" : "Mark Arrived"} style={{ marginTop: spacing.lg }} onPress={onConfirm} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    marginTop: -radius.xl,
  },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.borderMuted, alignSelf: "center", marginBottom: spacing.md },
  iconRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  title: { ...type.h3, color: colors.textPrimary },
  subtitle: { ...type.body1, color: colors.textSecondary, marginTop: spacing.xs },
});

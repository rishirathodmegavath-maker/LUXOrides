import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { DutyStackParamList } from "../../navigation/types";
import { Button, Card, ScreenContainer, ScreenHeader } from "../../components";
import { useDutyStore } from "../../store/dutyStore";
import { colors, spacing, type } from "../../theme";

type Props = NativeStackScreenProps<DutyStackParamList, "TripSummary">;

// Mirrors the Figma "Trip Summary" frame (node 675:11397). distanceKm/
// durationLabel come from endDuty's real result (DropOffScreen), stored in
// dutyStore rather than a separate fetch.
export function TripSummaryScreen({ navigation }: Props) {
  const summary = useDutyStore((s) => s.dutyEndResult);

  return (
    <ScreenContainer footer={<Button label="Proceed to Payment" onPress={() => navigation.navigate("PaymentBilling")} />}>
      <ScreenHeader onBack={() => navigation.goBack()} title="Trip Summary" />

      <Card style={styles.card}>
        <Feather name="map" size={32} color={colors.primary} />
        <Text style={styles.distance}>{summary?.distanceKm ?? "—"} Km</Text>
        <Text style={styles.duration}>{summary?.durationLabel ?? ""}</Text>
      </Card>

      <View style={styles.statRow}>
        <View style={styles.stat}>
          <Feather name="map-pin" size={18} color={colors.success} />
          <Text style={styles.statLabel}>Pickup</Text>
          <Text style={styles.statValue}>On time</Text>
        </View>
        <View style={styles.stat}>
          <Feather name="flag" size={18} color={colors.gold[500]} />
          <Text style={styles.statLabel}>Drop-off</Text>
          <Text style={styles.statValue}>Completed</Text>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: { alignItems: "center", paddingVertical: spacing.xl },
  distance: { ...type.display, color: colors.textPrimary, marginTop: spacing.sm },
  duration: { ...type.body1, color: colors.textSecondary },
  statRow: { flexDirection: "row", gap: spacing.md, marginTop: spacing.lg },
  stat: { flex: 1, alignItems: "center", gap: spacing.xxs, backgroundColor: colors.surfaceSunken, borderRadius: 16, paddingVertical: spacing.lg },
  statLabel: { ...type.body3, color: colors.textSecondary },
  statValue: { ...type.h4, fontSize: 16, color: colors.textPrimary },
});

import React, { useCallback, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { MainTabParamList } from "../../navigation/types";
import { Card, EmptyState } from "../../components";
import { dutyService, TripListItem } from "../../services";
import { colors, spacing, type } from "../../theme";

type Props = BottomTabScreenProps<MainTabParamList, "Activity">;

// NOTE: The Figma file defines an "Activity Nav Bar" component state
// (node 436:2891) for this bottom-tab icon, but no full "Activity" screen
// frame exists anywhere in the file (draft or reorganized cluster). This
// screen is original content built to match the design system — a duty
// earnings/history summary — not reproduced from a Figma frame. Flagged in
// the fidelity report.
export function ActivityScreen(_props: Props) {
  const [trips, setTrips] = useState<TripListItem[]>([]);

  useFocusEffect(
    useCallback(() => {
      dutyService.getTrips().then((t) => setTrips(t.filter((x) => x.status === "completed")));
    }, [])
  );

  const totalEarnings = trips.reduce((sum, t) => sum + (t.fare ?? 0), 0);

  return (
    <View style={styles.root}>
      <Text style={styles.title}>Activity</Text>
      <FlatList
        data={trips}
        keyExtractor={(t) => t.id}
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.sm }}
        ListHeaderComponent={
          <Card style={{ marginBottom: spacing.lg }}>
            <Text style={styles.summaryLabel}>Total Earnings (Completed Trips)</Text>
            <Text style={styles.summaryValue}>₹{totalEarnings.toLocaleString("en-IN")}</Text>
            <Text style={styles.summaryMeta}>{trips.length} completed trips</Text>
          </Card>
        }
        ListEmptyComponent={<EmptyState title="No activity yet" description="Completed duties will show up here." />}
        renderItem={({ item }) => (
          <Card>
            <View style={styles.row}>
              <Feather name="check-circle" size={18} color={colors.success} />
              <View style={{ flex: 1 }}>
                <Text style={styles.tripType}>{item.type}</Text>
                <Text style={styles.tripDate}>{item.date}</Text>
              </View>
              {item.fare ? <Text style={styles.fare}>₹{item.fare.toLocaleString("en-IN")}</Text> : null}
            </View>
          </Card>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background, paddingTop: 56 },
  title: { ...type.h1, color: colors.textPrimary, paddingHorizontal: spacing.lg },
  summaryLabel: { ...type.body2, color: colors.textSecondary },
  summaryValue: { ...type.display, color: colors.textPrimary, marginTop: spacing.xxs },
  summaryMeta: { ...type.body3, color: colors.textMuted },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  tripType: { ...type.h4, fontSize: 16, color: colors.textPrimary },
  tripDate: { ...type.body3, color: colors.textSecondary },
  fare: { ...type.h4, fontSize: 16, color: colors.textPrimary },
});

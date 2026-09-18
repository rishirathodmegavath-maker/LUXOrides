import React, { useCallback, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { MainTabParamList } from "../../navigation/types";
import { driverApi } from "../../api/driver.api";
import type { DriverRatingSummary } from "../../api/driver.types";
import { Card, EmptyState, InlineErrorBanner } from "../../components";
import { dutyService, TripListItem } from "../../services";
import { colors, spacing, type } from "../../theme";

type Props = BottomTabScreenProps<MainTabParamList, "Activity">;

// NOTE: The Figma file defines an "Activity Nav Bar" component state
// (node 436:2891) for this bottom-tab icon, but no full "Activity" screen
// frame exists anywhere in the file (draft or reorganized cluster). This
// screen is original content built to match the design system — not
// reproduced from a Figma frame. Flagged in the fidelity report.
//
// Deliberately shows completed-trip count and average rating, never fare/
// earnings figures -- a driver should not see the money collected per trip
// or in total, only their own real performance (completed duties + the
// combined client+ops rating, see DriverRatingService on the backend).
export function ActivityScreen(_props: Props) {
  const [trips, setTrips] = useState<TripListItem[]>([]);
  const [rating, setRating] = useState<DriverRatingSummary | null>(null);
  // A fetch failure used to leave `trips` at [] forever -- rendering the
  // exact same "No activity yet" empty state as a driver who genuinely has
  // none, with no way to tell the difference or retry.
  const [loadError, setLoadError] = useState(false);
  const insets = useSafeAreaInsets();

  const load = useCallback(() => {
    setLoadError(false);
    Promise.all([dutyService.getTrips(), driverApi.getRating()])
      .then(([allTrips, ratingSummary]) => {
        setTrips(allTrips.filter((x) => x.status === "completed"));
        setRating(ratingSummary);
      })
      .catch(() => setLoadError(true));
  }, []);

  useFocusEffect(load);

  return (
    <View style={[styles.root, { paddingTop: insets.top + spacing.md }]}>
      <Text style={styles.title}>Activity</Text>
      {loadError ? (
        <View style={{ paddingHorizontal: spacing.lg }}>
          <InlineErrorBanner message="Couldn't load your activity." onRetry={load} />
        </View>
      ) : null}
      <FlatList
        data={trips}
        keyExtractor={(t) => t.id}
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.sm }}
        ListHeaderComponent={
          <View style={styles.summaryRow}>
            <Card style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Completed Trips</Text>
              <Text style={styles.summaryValue}>{trips.length}</Text>
            </Card>
            <Card style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Average Rating</Text>
              {rating?.combinedAverageRating != null ? (
                <View style={styles.ratingRow}>
                  <Text style={styles.summaryValue}>{rating.combinedAverageRating.toFixed(1)}</Text>
                  <Feather name="star" size={20} color={colors.accentStrong} style={{ marginLeft: spacing.xxs }} />
                </View>
              ) : (
                <Text style={styles.summaryMeta}>Not yet rated</Text>
              )}
            </Card>
          </View>
        }
        ListEmptyComponent={
          loadError ? null : <EmptyState title="No activity yet" description="Completed duties will show up here." />
        }
        renderItem={({ item }) => (
          <Card>
            <View style={styles.row}>
              <Feather name="check-circle" size={18} color={colors.success} />
              <View style={{ flex: 1 }}>
                <Text style={styles.tripType}>{item.type}</Text>
                <Text style={styles.tripDate}>{item.date}</Text>
              </View>
            </View>
          </Card>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  title: { ...type.h1, color: colors.textPrimary, paddingHorizontal: spacing.lg },
  summaryRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.lg },
  summaryCard: { flex: 1 },
  summaryLabel: { ...type.body2, color: colors.textSecondary },
  summaryValue: { ...type.display, color: colors.textPrimary, marginTop: spacing.xxs },
  summaryMeta: { ...type.body3, color: colors.textMuted, marginTop: spacing.xxs },
  ratingRow: { flexDirection: "row", alignItems: "center" },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  tripType: { ...type.h4, fontSize: 16, color: colors.textPrimary },
  tripDate: { ...type.body3, color: colors.textSecondary },
});

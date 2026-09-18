import React, { useCallback, useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import type { CompositeScreenProps } from "@react-navigation/native";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { MainTabParamList, RootStackParamList } from "../../navigation/types";
import { Card, EmptyState, InlineErrorBanner, ScreenContainer } from "../../components";
import { dutyService, TripListItem } from "../../services";
import { colors, radius, spacing, type } from "../../theme";

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, "Trips">,
  NativeStackScreenProps<RootStackParamList>
>;

const STATUS_COLOR: Record<TripListItem["status"], string> = {
  upcoming: colors.info,
  completed: colors.success,
  cancelled: colors.error,
};

type TripsTab = "upcoming" | "past";

// Mirrors the Figma "Trips Page" frame (node 675:10504). Upcoming/Past is a
// client-side split of the one real getTrips() list (TripListItem.status is
// already backend-authoritative -- see FleetovoDutyService's tripStatus) --
// not a second fetch, just two views onto the same real data. Cancelled
// trips count as "past" too: nothing about them is still upcoming.
export function TripsScreen({ navigation }: Props) {
  const [trips, setTrips] = useState<TripListItem[]>([]);
  // A fetch failure used to leave `trips` at [] forever -- rendering the
  // exact same "No trips yet" empty state as a driver who genuinely has no
  // trips, with no way to tell the difference or retry.
  const [loadError, setLoadError] = useState(false);
  const [tab, setTab] = useState<TripsTab>("upcoming");

  const load = useCallback(() => {
    setLoadError(false);
    dutyService
      .getTrips()
      .then(setTrips)
      .catch(() => setLoadError(true));
  }, []);

  useFocusEffect(load);

  const upcomingTrips = useMemo(() => trips.filter((t) => t.status === "upcoming"), [trips]);
  const pastTrips = useMemo(() => trips.filter((t) => t.status !== "upcoming"), [trips]);
  const visibleTrips = tab === "upcoming" ? upcomingTrips : pastTrips;

  return (
    <ScreenContainer scroll={false} edges={["top", "bottom"]}>
      <Text style={styles.title}>Trips</Text>
      <View style={styles.tabBar}>
        <Pressable
          style={[styles.tabPill, tab === "upcoming" && styles.tabPillActive]}
          onPress={() => setTab("upcoming")}
          accessibilityRole="button"
          accessibilityState={{ selected: tab === "upcoming" }}
        >
          <Text style={[styles.tabLabel, tab === "upcoming" && styles.tabLabelActive]}>
            Upcoming ({upcomingTrips.length})
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tabPill, tab === "past" && styles.tabPillActive]}
          onPress={() => setTab("past")}
          accessibilityRole="button"
          accessibilityState={{ selected: tab === "past" }}
        >
          <Text style={[styles.tabLabel, tab === "past" && styles.tabLabelActive]}>
            Past Journeys ({pastTrips.length})
          </Text>
        </Pressable>
      </View>
      {loadError ? <InlineErrorBanner message="Couldn't load your trips." onRetry={load} /> : null}
      <FlatList
        data={visibleTrips}
        keyExtractor={(t) => t.id}
        contentContainerStyle={{ paddingTop: spacing.md, paddingBottom: spacing.xl }}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        ListEmptyComponent={
          loadError ? null : (
            <EmptyState
              title={tab === "upcoming" ? "No upcoming trips" : "No past journeys yet"}
              description={
                tab === "upcoming"
                  ? "Trips you've accepted will show up here."
                  : "Completed and cancelled trips will show up here."
              }
            />
          )
        }
        renderItem={({ item }) => (
          <Card style={{ padding: spacing.md }}>
            <View style={styles.row}>
              <View style={styles.headerLeft}>
                <Text style={styles.type} numberOfLines={2}>{item.type}</Text>
                <Text style={styles.client} numberOfLines={1}>{item.clientName}</Text>
              </View>
              <View style={[styles.statusPill, { backgroundColor: STATUS_COLOR[item.status] + "22" }]}>
                <Text style={[styles.statusText, { color: STATUS_COLOR[item.status] }]}>{item.status}</Text>
              </View>
            </View>
            <Text style={styles.date}>{item.date}</Text>
            <View style={styles.addressRow}>
              <Feather name="map-pin" size={14} color={colors.textMuted} />
              <Text style={styles.address} numberOfLines={1}>{item.pickupAddress}</Text>
            </View>
            <View style={styles.addressRow}>
              <Feather name="flag" size={14} color={colors.textMuted} />
              <Text style={styles.address} numberOfLines={1}>{item.dropoffAddress}</Text>
            </View>
            <Text
              style={styles.link}
              onPress={() => navigation.navigate("TripDetails", { dutyId: item.id })}
            >
              View Details
            </Text>
          </Card>
        )}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { ...type.h1, color: colors.textPrimary, marginTop: spacing.sm },
  tabBar: {
    flexDirection: "row",
    backgroundColor: colors.surfaceSunken,
    borderRadius: radius.pill,
    padding: 4,
    marginTop: spacing.md,
  },
  tabPill: {
    flex: 1,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    alignItems: "center",
  },
  tabPillActive: { backgroundColor: colors.primary },
  tabLabel: { ...type.label, color: colors.textSecondary },
  tabLabelActive: { color: colors.textInverse },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  headerLeft: { flex: 1, marginRight: spacing.sm },
  type: { ...type.h4, fontSize: 16, color: colors.textPrimary },
  client: { ...type.body2, color: colors.textSecondary },
  statusPill: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.pill, flexShrink: 0 },
  statusText: { ...type.caption, textTransform: "capitalize" },
  date: { ...type.body3, color: colors.textMuted, marginTop: spacing.xs },
  addressRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs, marginTop: spacing.xs },
  address: { ...type.body2, color: colors.textSecondary, flex: 1 },
  link: { ...type.label, color: colors.primary, marginTop: spacing.sm },
});

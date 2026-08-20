import React, { useCallback, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import type { CompositeScreenProps } from "@react-navigation/native";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { MainTabParamList, RootStackParamList } from "../../navigation/types";
import { Card, EmptyState, ScreenContainer } from "../../components";
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

// Mirrors the Figma "Trips Page" frame (node 675:10504).
export function TripsScreen({ navigation }: Props) {
  const [trips, setTrips] = useState<TripListItem[]>([]);

  useFocusEffect(
    useCallback(() => {
      dutyService.getTrips().then(setTrips);
    }, [])
  );

  return (
    <ScreenContainer scroll={false} edges={["top", "bottom"]}>
      <Text style={styles.title}>Trips</Text>
      <FlatList
        data={trips}
        keyExtractor={(t) => t.id}
        contentContainerStyle={{ paddingTop: spacing.md, paddingBottom: spacing.xl }}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        ListEmptyComponent={<EmptyState title="No trips yet" description="Your upcoming and past trips will show up here." />}
        renderItem={({ item }) => (
          <Card style={{ padding: spacing.md }}>
            <View style={styles.row}>
              <View>
                <Text style={styles.type}>{item.type}</Text>
                <Text style={styles.client}>{item.clientName}</Text>
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
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  type: { ...type.h4, fontSize: 16, color: colors.textPrimary },
  client: { ...type.body2, color: colors.textSecondary },
  statusPill: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.pill },
  statusText: { ...type.caption, textTransform: "capitalize" },
  date: { ...type.body3, color: colors.textMuted, marginTop: spacing.xs },
  addressRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs, marginTop: spacing.xs },
  address: { ...type.body2, color: colors.textSecondary, flex: 1 },
  link: { ...type.label, color: colors.primary, marginTop: spacing.sm },
});

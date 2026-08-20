import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/types";
import { Card, ScreenContainer, ScreenHeader } from "../../components";
import { dutyService, TripListItem } from "../../services";
import { colors, spacing, type } from "../../theme";

type Props = NativeStackScreenProps<RootStackParamList, "TripDetails">;

// Mirrors the Figma "Trip Details Page" frame (node 675:10575).
export function TripDetailsScreen({ route, navigation }: Props) {
  const [trip, setTrip] = useState<TripListItem | null>(null);

  useEffect(() => {
    dutyService.getTripById(route.params.dutyId).then(setTrip);
  }, [route.params.dutyId]);

  if (!trip) return <ScreenContainer><ScreenHeader onBack={() => navigation.goBack()} /></ScreenContainer>;

  return (
    <ScreenContainer>
      <ScreenHeader onBack={() => navigation.goBack()} title="Trip Details" />

      <Card>
        <Text style={styles.type}>{trip.type}</Text>
        <Text style={styles.date}>{trip.date}</Text>

        <View style={styles.divider} />

        <View style={styles.row}>
          <Feather name="user" size={18} color={colors.textSecondary} />
          <Text style={styles.rowText}>{trip.clientName}</Text>
        </View>
        <View style={styles.row}>
          <Feather name="map-pin" size={18} color={colors.success} />
          <Text style={styles.rowText}>{trip.pickupAddress}</Text>
        </View>
        <View style={styles.row}>
          <Feather name="flag" size={18} color={colors.gold[500]} />
          <Text style={styles.rowText}>{trip.dropoffAddress}</Text>
        </View>

        {trip.fare ? (
          <>
            <View style={styles.divider} />
            <View style={styles.row}>
              <Text style={styles.fareLabel}>Fare</Text>
              <Text style={styles.fareValue}>₹{trip.fare.toLocaleString("en-IN")}</Text>
            </View>
          </>
        ) : null}
      </Card>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  type: { ...type.h2, color: colors.textPrimary },
  date: { ...type.body2, color: colors.textSecondary, marginTop: spacing.xxs },
  divider: { height: 1, backgroundColor: colors.borderMuted, marginVertical: spacing.md },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.sm, justifyContent: "space-between" },
  rowText: { ...type.body1, color: colors.textPrimary, flex: 1 },
  fareLabel: { ...type.body1, color: colors.textSecondary },
  fareValue: { ...type.h3, color: colors.textPrimary },
});

import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/types";
import { Card, InlineErrorBanner, ScreenContainer, ScreenHeader } from "../../components";
import { dutyService, TripListItem } from "../../services";
import { colors, spacing, type } from "../../theme";

type Props = NativeStackScreenProps<RootStackParamList, "TripDetails">;

// Mirrors the Figma "Trip Details Page" frame (node 675:10575).
export function TripDetailsScreen({ route, navigation }: Props) {
  const [trip, setTrip] = useState<TripListItem | null>(null);
  // getTripById now only resolves to null for a real 404 -- everything else
  // (network/server failure) rejects, so it can be told apart here from a
  // trip that genuinely doesn't exist, and actually offered a retry.
  const [loadError, setLoadError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    dutyService
      .getTripById(route.params.dutyId)
      .then((t) => {
        if (!active) return;
        setTrip(t);
        setLoadError(false);
      })
      .catch(() => active && setLoadError(true));
    return () => {
      active = false;
    };
  }, [route.params.dutyId, reloadKey]);

  if (loadError) {
    return (
      <ScreenContainer>
        <ScreenHeader onBack={() => navigation.goBack()} title="Trip Details" />
        <InlineErrorBanner message="Couldn't load this trip." onRetry={() => setReloadKey((k) => k + 1)} />
      </ScreenContainer>
    );
  }

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
});

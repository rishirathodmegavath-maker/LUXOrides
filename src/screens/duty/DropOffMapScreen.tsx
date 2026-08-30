import React, { useEffect, useState } from "react";
import { Linking, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { DutyStackParamList } from "../../navigation/types";
import { Button, Chip, DutyMap, StatusToggle } from "../../components";
import { useDutyStore } from "../../store/dutyStore";
import { useLiveDriverPosition } from "../../hooks/useLiveDriverPosition";
import { useDutyRoute } from "../../hooks/useDutyRoute";
import { remainingDistanceKm } from "../../util/routeDistance";
import { colors, radius, spacing, type } from "../../theme";

type Props = NativeStackScreenProps<DutyStackParamList, "DropOffMap">;

function formatDuration(seconds: number): string {
  const minutes = Math.round(seconds / 60);
  return minutes < 60 ? `${minutes} mins` : `${Math.floor(minutes / 60)} hr ${minutes % 60} min`;
}

// Mirrors the Figma "Drop Off Map" frame (node 675:11623) — live tracking
// during "Ride in Progress" per the sitemap. Distance/duration come from the
// real backend route (ExternalDriverDutyController's /route/DROP) --
// remaining distance is measured live against that route's actual geometry.
export function DropOffMapScreen({ navigation }: Props) {
  const duty = useDutyStore((s) => s.todayDuty);
  const online = useDutyStore((s) => s.online);
  const driverPosition = useLiveDriverPosition();
  const { route } = useDutyRoute("DROP");
  const [seconds, setSeconds] = useState(0);

  const remainingKm = route.routeAvailable ? remainingDistanceKm(route.geometry, driverPosition) : null;

  useEffect(() => {
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate("Sos")}>
          <Feather name="alert-triangle" size={24} color={colors.error} />
        </TouchableOpacity>
        <StatusToggle online={online} onToggle={() => {}} />
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
          {duty?.clientPhone ? (
            <TouchableOpacity onPress={() => Linking.openURL(`tel:${duty.clientPhone}`)}>
              <Feather name="phone-call" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          ) : null}
          <Feather name="bell" size={24} color={colors.textPrimary} />
        </View>
      </View>
      <DutyMap
        driverPosition={driverPosition}
        route={route.routeAvailable ? { geometry: route.geometry, from: route.fromLocation, to: route.toLocation } : null}
        style={{ flex: 1 }}
      />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <Chip
          label={`Ride in progress · ${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`}
          tone="success"
        />
        {route.available && route.distanceKm != null && route.durationSeconds != null ? (
          <Text style={styles.eta}>
            {formatDuration(route.durationSeconds)} ({(remainingKm ?? route.distanceKm).toFixed(1)}Km) to drop-off
          </Text>
        ) : (
          <Text style={styles.eta}>Distance/ETA not available</Text>
        )}
        <Text style={styles.address} numberOfLines={2}>{duty?.dropoff.address}</Text>
        <Button label="Arrived at Drop-off" style={{ marginTop: spacing.lg }} onPress={() => navigation.navigate("ArrivedAtDropOff")} />
        <TouchableOpacity style={styles.incidentLink} onPress={() => navigation.navigate("IncidentReport")}>
          <Text style={styles.incidentLinkText}>Report an issue</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: {
    position: "absolute",
    top: 56,
    left: 0,
    right: 0,
    zIndex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    marginTop: -radius.xl,
    gap: spacing.xxs,
  },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.borderMuted, alignSelf: "center", marginBottom: spacing.md },
  eta: { ...type.h4, color: colors.textPrimary, marginTop: spacing.sm },
  address: { ...type.body1, color: colors.textSecondary },
  incidentLink: { alignItems: "center", marginTop: spacing.md },
  incidentLinkText: { ...type.body2, color: colors.textSecondary, textDecorationLine: "underline" },
});

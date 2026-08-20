import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { DutyStackParamList } from "../../navigation/types";
import { Button, Chip, MapPreview, StatusToggle } from "../../components";
import { useDutyStore } from "../../store/dutyStore";
import { colors, radius, spacing, type } from "../../theme";

type Props = NativeStackScreenProps<DutyStackParamList, "DropOffMap">;

// Mirrors the Figma "Drop Off Map" frame (node 675:11623) — live tracking
// during "Ride in Progress" per the sitemap.
export function DropOffMapScreen({ navigation }: Props) {
  const duty = useDutyStore((s) => s.todayDuty);
  const online = useDutyStore((s) => s.online);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Feather name="menu" size={24} color={colors.textPrimary} />
        <StatusToggle online={online} onToggle={() => {}} />
        <Feather name="bell" size={24} color={colors.textPrimary} />
      </View>
      <MapPreview style={{ flex: 1 }} />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <Chip
          label={`Ride in progress · ${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`}
          tone="success"
        />
        <Text style={styles.eta}>{duty?.dropoff.etaMinutes ?? 96} mins ({duty?.dropoff.distanceKm ?? 26}Km) to drop-off</Text>
        <Text style={styles.address} numberOfLines={2}>{duty?.dropoff.address}</Text>
        <Button label="Arrived at Drop-off" style={{ marginTop: spacing.lg }} onPress={() => navigation.navigate("ArrivedAtDropOff")} />
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
});

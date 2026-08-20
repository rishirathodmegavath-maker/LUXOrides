import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { DutyStackParamList } from "../../navigation/types";
import { MapPreview, SlideToConfirm, StatusToggle } from "../../components";
import { dutyService } from "../../services";
import { useDutyStore } from "../../store/dutyStore";
import { colors, radius, spacing, type } from "../../theme";

type Props = NativeStackScreenProps<DutyStackParamList, "DutyStartMap">;

// Mirrors the Figma "Duty Start Map Page" frame (node 675:11826).
export function DutyStartMapScreen({ navigation }: Props) {
  const duty = useDutyStore((s) => s.todayDuty);
  const online = useDutyStore((s) => s.online);
  const [starting, setStarting] = useState(false);

  const onStart = async () => {
    setStarting(true);
    await dutyService.startDuty();
    navigation.navigate("PickupMap");
  };

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
        <Text style={styles.eta}>
          {duty?.pickup.etaMinutes ?? 30} mins ({duty?.pickup.distanceKm ?? 15}Km) away
        </Text>
        <View style={styles.stopRow}>
          <View style={styles.dotGreen} />
          <Text style={styles.address} numberOfLines={2}>{duty?.pickup.address}</Text>
        </View>
        <View style={styles.stopRow}>
          <Feather name="map-pin" size={14} color={colors.gold[500]} />
          <Text style={styles.address} numberOfLines={2}>{duty?.dropoff.address}</Text>
        </View>

        <View style={{ marginTop: spacing.lg }}>
          <SlideToConfirm label={starting ? "Starting duty…" : "Slide to start the duty"} onConfirm={onStart} disabled={starting} />
        </View>
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
  },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.borderMuted, alignSelf: "center", marginBottom: spacing.md },
  eta: { ...type.h4, color: colors.textPrimary, marginBottom: spacing.sm },
  stopRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm, marginBottom: spacing.sm },
  dotGreen: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.success, marginTop: 4 },
  address: { ...type.body1, color: colors.textPrimary, flex: 1 },
});

import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { DutyStackParamList } from "../../navigation/types";
import { Button, MapPreview, StatusToggle } from "../../components";
import { useDutyStore } from "../../store/dutyStore";
import { colors, radius, spacing, type } from "../../theme";

type Props = NativeStackScreenProps<DutyStackParamList, "PickupMap">;

// Mirrors the Figma "Pickup Location Map" frame (node 675:11747) — live
// navigation toward the client pickup point.
export function PickupMapScreen({ navigation }: Props) {
  const duty = useDutyStore((s) => s.todayDuty);
  const online = useDutyStore((s) => s.online);

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
        <Text style={styles.eta}>{duty?.pickup.etaMinutes ?? 30} mins ({duty?.pickup.distanceKm ?? 15}Km) away</Text>
        <Text style={styles.address} numberOfLines={2}>{duty?.pickup.address}</Text>
        <Button label="Arrived at Pickup" style={{ marginTop: spacing.lg }} onPress={() => navigation.navigate("WaitingForClient")} />
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
  eta: { ...type.h4, color: colors.textPrimary },
  address: { ...type.body1, color: colors.textSecondary, marginTop: spacing.xxs },
});

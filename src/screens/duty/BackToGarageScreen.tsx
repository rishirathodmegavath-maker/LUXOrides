import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { DutyStackParamList } from "../../navigation/types";
import { Button, MapPreview, StatusToggle } from "../../components";
import { dutyService } from "../../services";
import { useDutyStore } from "../../store/dutyStore";
import { colors, radius, spacing, type } from "../../theme";

type Props = NativeStackScreenProps<DutyStackParamList, "BackToGarage">;

// Mirrors the Figma "Back to Garage" frame (node 675:11124) — GPS
// continues so the garage distance can be finalised, per the sitemap.
export function BackToGarageScreen({ navigation }: Props) {
  const online = useDutyStore((s) => s.online);

  const onArrive = async () => {
    await dutyService.returnToGarage();
    navigation.navigate("GarageMap");
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
        <Text style={styles.title}>Returning to Garage</Text>
        <Text style={styles.subtitle}>GPS tracking continues so your garage distance is finalised.</Text>
        <Button label="Arrived at Garage" style={{ marginTop: spacing.lg }} onPress={onArrive} />
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
  title: { ...type.h4, color: colors.textPrimary },
  subtitle: { ...type.body2, color: colors.textSecondary, marginTop: spacing.xxs },
});

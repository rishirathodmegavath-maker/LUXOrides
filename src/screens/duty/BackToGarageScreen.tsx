import React, { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import type { CompositeScreenProps } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { DutyStackParamList, RootStackParamList } from "../../navigation/types";
import { Button, DutyMap, StatusToggle } from "../../components";
import { dutyService } from "../../services";
import { useDutyStore } from "../../store/dutyStore";
import { useLiveDriverPosition } from "../../hooks/useLiveDriverPosition";
import { captureCurrentLocation } from "../../util/location";
import { colors, radius, spacing, type } from "../../theme";

type Props = CompositeScreenProps<
  NativeStackScreenProps<DutyStackParamList, "BackToGarage">,
  NativeStackScreenProps<RootStackParamList>
>;

// Mirrors the Figma "Back to Garage" frame (node 675:11124). The fare
// (including the drop->garage leg) is already computed and paid by this
// point (ExternalDriverDutyService#submitEnd finalizes it using a real
// routed estimate before the driver physically drives back) -- this screen
// is an operational arrival checkpoint only, never a re-billing step.
// "Arrived at Garage" is a real, backend-persisted confirmation
// (ExternalDriverDutyController /return-garage), not a local-only step.
export function BackToGarageScreen({ navigation }: Props) {
  const online = useDutyStore((s) => s.online);
  const driverPosition = useLiveDriverPosition();
  const [confirming, setConfirming] = useState(false);
  const insets = useSafeAreaInsets();

  const onArrive = async () => {
    setConfirming(true);
    let location = null;
    try {
      location = await captureCurrentLocation();
    } catch {
      // Best-effort -- proceed without a coordinate rather than blocking on GPS.
    }
    try {
      await dutyService.returnToGarage(location);
      navigation.navigate("GarageMap");
    } catch (e) {
      Alert.alert("Couldn't confirm garage return", e instanceof Error ? e.message : "Please try again.");
    } finally {
      setConfirming(false);
    }
  };

  return (
    <View style={styles.root}>
      <View style={[styles.header, { top: insets.top + spacing.md }]}>
        <Feather name="menu" size={24} color={colors.textPrimary} />
        <StatusToggle online={online} onToggle={() => {}} />
        <Pressable onPress={() => navigation.navigate("Notifications")} hitSlop={8} accessibilityRole="button" accessibilityLabel="Notifications">
          <Feather name="bell" size={24} color={colors.textPrimary} />
        </Pressable>
      </View>
      <DutyMap driverPosition={driverPosition} style={{ flex: 1 }} />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <Text style={styles.title}>Returning to Garage</Text>
        <Text style={styles.subtitle}>
          The fare is already final — this just confirms you&apos;re back so the duty can be closed.
        </Text>
        <Button label="Arrived at Garage" style={{ marginTop: spacing.lg }} onPress={onArrive} loading={confirming} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: {
    position: "absolute",
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

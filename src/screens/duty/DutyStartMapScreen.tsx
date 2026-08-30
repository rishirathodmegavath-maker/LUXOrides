import React, { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { DutyStackParamList } from "../../navigation/types";
import { DutyMap, PhotoCapture, SlideToConfirm, StatusToggle, TextField } from "../../components";
import { dutyService } from "../../services";
import { useDutyStore } from "../../store/dutyStore";
import { useLiveDriverPosition } from "../../hooks/useLiveDriverPosition";
import { captureCurrentLocation } from "../../util/location";
import { colors, radius, spacing, type } from "../../theme";

type Props = NativeStackScreenProps<DutyStackParamList, "DutyStartMap">;

// Mirrors the Figma "Duty Start Map Page" frame (node 675:11826). The
// odometer-km field and photo capture are an original addition — the real
// backend requires both to start a duty (ExternalDriverDutyController),
// and Figma's version of this screen predates that requirement.
export function DutyStartMapScreen({ navigation }: Props) {
  const duty = useDutyStore((s) => s.todayDuty);
  const online = useDutyStore((s) => s.online);
  const driverPosition = useLiveDriverPosition();
  const [starting, setStarting] = useState(false);
  const [odometerKm, setOdometerKm] = useState("");
  const [photoUri, setPhotoUri] = useState<string | undefined>();
  const canStart = !!odometerKm && !!photoUri;

  const onStart = async () => {
    if (!canStart || !photoUri) return;
    setStarting(true);
    try {
      const location = await captureCurrentLocation();
      await dutyService.startDuty({ odometerKm: Number(odometerKm), photoUri, location });
      navigation.navigate("PickupMap");
    } catch (e) {
      Alert.alert("Couldn't start duty", e instanceof Error ? e.message : "Please try again.");
    } finally {
      setStarting(false);
    }
  };

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Feather name="menu" size={24} color={colors.textPrimary} />
        <StatusToggle online={online} onToggle={() => {}} />
        <Feather name="bell" size={24} color={colors.textPrimary} />
      </View>
      <DutyMap driverPosition={driverPosition} style={{ flex: 1 }} />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        {duty?.pickup.etaMinutes != null && duty.pickup.distanceKm != null ? (
          <Text style={styles.eta}>
            {duty.pickup.etaMinutes} mins ({duty.pickup.distanceKm}Km) away
          </Text>
        ) : (
          <Text style={styles.eta}>Distance/ETA not available</Text>
        )}
        <View style={styles.stopRow}>
          <View style={styles.dotGreen} />
          <Text style={styles.address} numberOfLines={2}>{duty?.pickup.address}</Text>
        </View>
        <View style={styles.stopRow}>
          <Feather name="map-pin" size={14} color={colors.gold[500]} />
          <Text style={styles.address} numberOfLines={2}>{duty?.dropoff.address}</Text>
        </View>

        <TextField
          label="Odometer Reading (Km)"
          value={odometerKm}
          onChangeText={(t) => setOdometerKm(t.replace(/[^0-9]/g, ""))}
          keyboardType="number-pad"
          placeholder="e.g. 12450"
          containerStyle={{ marginTop: spacing.md }}
        />
        <View style={{ marginTop: spacing.sm }}>
          <PhotoCapture uri={photoUri} status="idle" onCapture={setPhotoUri} label="Photo of odometer" compact />
        </View>

        <View style={{ marginTop: spacing.lg }}>
          <SlideToConfirm
            label={starting ? "Starting duty…" : "Slide to start the duty"}
            onConfirm={onStart}
            disabled={starting || !canStart}
          />
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

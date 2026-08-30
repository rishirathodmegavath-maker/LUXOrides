import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { DutyStackParamList } from "../../navigation/types";
import { Button, ScreenContainer } from "../../components";
import { dutyService } from "../../services";
import { captureCurrentLocation } from "../../util/location";
import { colors, radius, spacing, type } from "../../theme";

type Props = NativeStackScreenProps<DutyStackParamList, "Sos">;

// A safety action reachable from within an active duty -- persists a real
// SOS alert to the backend (DriverDutySosService) for a future ops screen to
// act on. Best-effort GPS: still sends the alert without a coordinate if a
// fix isn't available, since the alert itself matters more than the
// coordinate attached to it.
export function SosScreen({ navigation }: Props) {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSend = async () => {
    setSending(true);
    setError(null);

    let location: { latitude: number; longitude: number } | null = null;
    try {
      const fix = await captureCurrentLocation();
      location = { latitude: fix.latitude, longitude: fix.longitude };
    } catch {
      // Best-effort -- proceed without a coordinate rather than blocking on GPS.
    }

    try {
      await dutyService.triggerSos(location);
      setSent(true);
    } catch {
      setError("Couldn't send SOS. Please try again or call for help directly.");
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <ScreenContainer style={styles.wrap}>
        <View style={[styles.iconWrap, { backgroundColor: colors.teal[50] }]}>
          <Feather name="check-circle" size={44} color={colors.success} />
        </View>
        <Text style={styles.title}>Help is on the way</Text>
        <Text style={styles.subtitle}>Your SOS alert has been sent. Stay safe.</Text>
        <Button label="Back" style={{ marginTop: spacing.xl }} onPress={() => navigation.goBack()} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer
      style={styles.wrap}
      footer={<Button label="Send SOS" style={{ backgroundColor: colors.error }} onPress={onSend} loading={sending} />}
    >
      <View style={[styles.iconWrap, { backgroundColor: colors.errorBg }]}>
        <Feather name="alert-triangle" size={44} color={colors.error} />
      </View>
      <Text style={styles.title}>Emergency SOS</Text>
      <Text style={styles.subtitle}>
        This sends your current location to Fleetovo immediately. Only use this in a genuine emergency.
      </Text>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", justifyContent: "center" },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  title: { ...type.h1, color: colors.textPrimary, textAlign: "center" },
  subtitle: { ...type.body1, color: colors.textSecondary, textAlign: "center", marginTop: spacing.sm },
  errorText: { ...type.body3, color: colors.error, textAlign: "center", marginTop: spacing.md },
});

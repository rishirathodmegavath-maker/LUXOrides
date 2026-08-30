import React, { useEffect, useState } from "react";
import { Linking, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { DutyStackParamList } from "../../navigation/types";
import { Button, ScreenContainer } from "../../components";
import { useDutyStore } from "../../store/dutyStore";
import { colors, radius, spacing, type } from "../../theme";

type Props = NativeStackScreenProps<DutyStackParamList, "WaitingForClient">;

// Mirrors the Figma "Waiting for Client" frame (node 675:11702).
export function WaitingForClientScreen({ navigation }: Props) {
  const clientPhone = useDutyStore((s) => s.todayDuty?.clientPhone);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  return (
    <ScreenContainer style={styles.wrap} footer={<Button label="Verify & Start Ride" onPress={() => navigation.navigate("PickupOtp")} />}>
      <View style={styles.iconWrap}>
        <Feather name="clock" size={44} color={colors.primary} />
      </View>
      <Text style={styles.title}>Waiting for Client</Text>
      <Text style={styles.subtitle}>You&apos;ve arrived at the pickup point. Let your client know you&apos;re here.</Text>
      <Text style={styles.timer}>{mm}:{ss}</Text>
      {clientPhone ? (
        <TouchableOpacity style={styles.callButton} onPress={() => Linking.openURL(`tel:${clientPhone}`)}>
          <Feather name="phone-call" size={18} color={colors.primary} />
          <Text style={styles.callLabel}>Call Client</Text>
        </TouchableOpacity>
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", justifyContent: "center" },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: radius.pill,
    backgroundColor: colors.teal[50],
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  title: { ...type.h1, color: colors.textPrimary, textAlign: "center" },
  subtitle: { ...type.body1, color: colors.textSecondary, textAlign: "center", marginTop: spacing.sm },
  timer: { ...type.display, color: colors.primary, marginTop: spacing.xl },
  callButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginTop: spacing.xl,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  callLabel: { ...type.body1, color: colors.primary },
});

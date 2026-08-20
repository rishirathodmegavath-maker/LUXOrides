import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { DutyStackParamList } from "../../navigation/types";
import { Button, Card, ScreenContainer, ScreenHeader } from "../../components";
import { dutyService } from "../../services";
import { useDutyStore } from "../../store/dutyStore";
import { colors, spacing, type } from "../../theme";

type Props = NativeStackScreenProps<DutyStackParamList, "AcceptDuty">;

// No Figma frame exists for this decision step — the sitemap names "Accept
// Duty" as a flow branch but never mocked up a screen for it (checked: no
// frame anywhere in the file matches). Original content in the app's
// existing style, filling a real gap in the app's logic rather than
// reproducing a design that was never drawn. Flagged in the fidelity report.
export function AcceptDutyScreen({ navigation }: Props) {
  const todayDuty = useDutyStore((s) => s.todayDuty);
  const setTodayDuty = useDutyStore((s) => s.setTodayDuty);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!todayDuty) {
      dutyService.getTodayDuty().then(setTodayDuty);
    }
  }, [todayDuty, setTodayDuty]);

  const onAccept = async () => {
    if (!todayDuty) return;
    setLoading(true);
    try {
      await dutyService.acceptDuty(todayDuty.id);
      navigation.replace("UniformSelfie");
    } finally {
      setLoading(false);
    }
  };

  if (!todayDuty) {
    return <ScreenContainer><ScreenHeader onBack={() => navigation.goBack()} /></ScreenContainer>;
  }

  return (
    <ScreenContainer
      footer={
        <View style={{ gap: spacing.sm }}>
          <Button label="Accept Duty" onPress={onAccept} loading={loading} />
          <Button label="Decline" variant="secondary" onPress={() => navigation.navigate("DeclineDuty")} />
        </View>
      }
    >
      <ScreenHeader onBack={() => navigation.goBack()} title="New Duty" />
      <Text style={styles.title}>You have a new duty</Text>
      <Text style={styles.subtitle}>Review the details below and accept to begin your pre-duty checks.</Text>

      <Card style={{ marginTop: spacing.xl }}>
        <Text style={styles.type}>{todayDuty.type}</Text>
        <Text style={styles.reportTime}>Report by {todayDuty.reportTime}</Text>

        <View style={styles.divider} />

        <View style={styles.row}>
          <Feather name="user" size={18} color={colors.textSecondary} />
          <Text style={styles.rowText}>{todayDuty.clientName}</Text>
        </View>
        <View style={styles.row}>
          <Feather name="map-pin" size={18} color={colors.success} />
          <Text style={styles.rowText}>{todayDuty.pickup.address}</Text>
        </View>
        <View style={styles.row}>
          <Feather name="flag" size={18} color={colors.gold[500]} />
          <Text style={styles.rowText}>{todayDuty.dropoff.address}</Text>
        </View>
      </Card>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { ...type.h1, color: colors.textPrimary },
  subtitle: { ...type.body1, color: colors.textSecondary, marginTop: spacing.sm },
  type: { ...type.h3, color: colors.textPrimary },
  reportTime: { ...type.body2, color: colors.textSecondary, marginTop: spacing.xxs },
  divider: { height: 1, backgroundColor: colors.borderMuted, marginVertical: spacing.md },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.sm },
  rowText: { ...type.body1, color: colors.textPrimary, flex: 1 },
});

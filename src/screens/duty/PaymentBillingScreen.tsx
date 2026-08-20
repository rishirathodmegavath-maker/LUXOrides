import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { DutyStackParamList } from "../../navigation/types";
import { Button, Card, ScreenContainer, ScreenHeader, StatusToggle } from "../../components";
import { useDutyStore } from "../../store/dutyStore";
import { colors, spacing, type } from "../../theme";

type Props = NativeStackScreenProps<DutyStackParamList, "PaymentBilling">;

function money(n: number) {
  return `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

// Mirrors the Figma "Payment & Billing" frame (node 675:11288), simplified
// from the original GST/subtotal/advance-paid breakdown to what the real
// backend actually returns from endDuty (a single amountToCollect) — that
// itemized split isn't data the backend exposes here, so showing it would
// mean fabricating numbers rather than displaying real ones.
export function PaymentBillingScreen({ navigation }: Props) {
  const result = useDutyStore((s) => s.dutyEndResult);
  const online = useDutyStore((s) => s.online);

  return (
    <ScreenContainer
      footer={
        <View style={{ flexDirection: "row", gap: spacing.sm }}>
          <Button label="Cash Received" variant="secondary" style={{ flex: 1 }} onPress={() => navigation.navigate("CashPaymentReceived")} />
          <Button label="Show QR" style={{ flex: 1 }} onPress={() => navigation.navigate("PaymentQr")} />
        </View>
      }
    >
      <View style={styles.header}>
        <Feather name="menu" size={24} color={colors.textPrimary} />
        <StatusToggle online={online} onToggle={() => {}} />
        <Feather name="bell" size={24} color={colors.textPrimary} />
      </View>
      <ScreenHeader onBack={() => navigation.goBack()} />
      <Text style={styles.title}>Payment & Billing</Text>
      <Text style={styles.subtitle}>Choose a payment option to collect or send the bill to client/operations.</Text>

      {result ? (
        <Card style={{ marginTop: spacing.xl }}>
          <View style={styles.amountWrap}>
            <Text style={styles.amountLabel}>Amount to Collect</Text>
            <Text style={styles.amountValue}>{money(result.amountToCollect)}</Text>
            {result.distanceKm ? (
              <Text style={styles.tripMeta}>{result.distanceKm} Km{result.durationLabel ? ` • ${result.durationLabel}` : ""}</Text>
            ) : null}
          </View>
        </Card>
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.lg },
  title: { ...type.h1, color: colors.textPrimary, textAlign: "center" },
  subtitle: { ...type.body1, color: colors.textSecondary, textAlign: "center", marginTop: spacing.xs },
  amountWrap: { alignItems: "center", paddingVertical: spacing.lg },
  amountLabel: { ...type.body2, color: colors.textSecondary },
  amountValue: { ...type.display, color: colors.success, marginVertical: spacing.xxs },
  tripMeta: { ...type.body2, color: colors.textSecondary, marginTop: spacing.xs },
});

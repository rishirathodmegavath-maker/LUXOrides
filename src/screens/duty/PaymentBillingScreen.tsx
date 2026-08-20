import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { DutyStackParamList } from "../../navigation/types";
import { Button, Card, Chip, ScreenContainer, ScreenHeader, StatusToggle } from "../../components";
import { BillBreakdown, paymentService } from "../../services";
import { useDutyStore } from "../../store/dutyStore";
import { colors, spacing, type } from "../../theme";

type Props = NativeStackScreenProps<DutyStackParamList, "PaymentBilling">;

function money(n: number) {
  return `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

// Mirrors the Figma "Payment & Billing" frame (node 675:11288).
export function PaymentBillingScreen({ navigation }: Props) {
  const [bill, setBill] = useState<BillBreakdown | null>(null);
  const online = useDutyStore((s) => s.online);

  useEffect(() => {
    paymentService.getBill("duty_1001").then(setBill);
  }, []);

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

      {bill ? (
        <Card style={{ marginTop: spacing.xl }}>
          <View style={styles.amountWrap}>
            <Text style={styles.amountLabel}>Amount Due</Text>
            <Text style={styles.amountValue}>{money(bill.balancePayable)}</Text>
            <Chip label={`${bill.distanceKm} Km • ${bill.durationLabel}`} tone="success" />
          </View>

          <View style={styles.tableHeader}>
            <Text style={styles.tableHeaderText}>Bill Details</Text>
            <Text style={styles.tableHeaderText}>Amount (₹)</Text>
          </View>

          <BillRow label="Booking Amount" sub="Base Fare" value={money(bill.bookingAmount)} />
          <BillRow label="Additional Charges" sub="Extra kms / time" value={money(bill.additionalCharges)} />
          <View style={styles.divider} />
          <BillRow label="Subtotal" value={money(bill.subtotal)} bold />
          <BillRow label={`GST @ ${bill.gstPercent}%`} value={money(bill.gstAmount)} />
          <View style={styles.divider} />
          <BillRow label="Total Bill" value={money(bill.totalBill)} bold />
          <BillRow label="Advance Paid" sub={bill.advancePaidDate} value={`-${money(bill.advancePaid)}`} valueColor={colors.success} />

          <View style={styles.balanceRow}>
            <Text style={styles.balanceLabel}>Balance Payable</Text>
            <Text style={styles.balanceValue}>{money(bill.balancePayable)}</Text>
          </View>
        </Card>
      ) : null}
    </ScreenContainer>
  );
}

function BillRow({ label, sub, value, bold, valueColor }: { label: string; sub?: string; value: string; bold?: boolean; valueColor?: string }) {
  return (
    <View style={styles.row}>
      <View>
        <Text style={[styles.rowLabel, bold && styles.bold]}>{label}</Text>
        {sub ? <Text style={styles.rowSub}>{sub}</Text> : null}
      </View>
      <Text style={[styles.rowValue, bold && styles.bold, valueColor ? { color: valueColor } : null]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.lg },
  title: { ...type.h1, color: colors.textPrimary, textAlign: "center" },
  subtitle: { ...type.body1, color: colors.textSecondary, textAlign: "center", marginTop: spacing.xs },
  amountWrap: { alignItems: "center", marginBottom: spacing.lg },
  amountLabel: { ...type.body2, color: colors.textSecondary },
  amountValue: { ...type.display, color: colors.success, marginVertical: spacing.xxs },
  tableHeader: { flexDirection: "row", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: colors.borderMuted, paddingBottom: spacing.xs, marginBottom: spacing.xs },
  tableHeaderText: { ...type.label, color: colors.textPrimary },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", paddingVertical: spacing.xs },
  rowLabel: { ...type.body1, color: colors.textPrimary },
  rowSub: { ...type.body3, color: colors.textSecondary },
  rowValue: { ...type.body1, color: colors.textPrimary },
  bold: { fontFamily: type.h4.fontFamily },
  divider: { height: 1, backgroundColor: colors.borderMuted, marginVertical: spacing.xs },
  balanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: colors.successBg,
    borderRadius: 12,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  balanceLabel: { ...type.h4, fontSize: 16, color: colors.textPrimary },
  balanceValue: { ...type.h4, fontSize: 16, color: colors.textPrimary },
});

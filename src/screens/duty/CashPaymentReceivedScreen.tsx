import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { DutyStackParamList } from "../../navigation/types";
import { Button, ScreenContainer } from "../../components";
import { paymentService } from "../../services";
import { useDutyStore } from "../../store/dutyStore";
import { colors, radius, spacing, type } from "../../theme";

type Props = NativeStackScreenProps<DutyStackParamList, "CashPaymentReceived">;

// Mirrors the Figma "Cash Payment Received" frame (node 675:11237).
export function CashPaymentReceivedScreen({ navigation }: Props) {
  const amountToCollect = useDutyStore((s) => s.dutyEndResult?.amountToCollect);
  // amountToCollect can only be missing if this screen is somehow reached
  // without a real endDuty() result in the store, which the navigator graph
  // doesn't allow (PaymentBilling, the only route here, requires
  // dutyEndResult to render its own amount) -- but never silently confirm an
  // invented amount if it happens anyway, so start "not confirming" rather
  // than block the Continue button on a call that will never be made.
  const [confirming, setConfirming] = useState(amountToCollect != null);

  useEffect(() => {
    if (amountToCollect == null) return;
    paymentService.confirmCashPayment(amountToCollect).then(() => setConfirming(false));
  }, [amountToCollect]);

  return (
    <ScreenContainer style={styles.wrap} footer={<Button label="Continue" onPress={() => navigation.navigate("DutyCompletionSlip")} disabled={confirming} />}>
      <View style={styles.iconWrap}>
        <Feather name={confirming ? "loader" : "check"} size={44} color={colors.success} />
      </View>
      <Text style={styles.title}>{confirming ? "Confirming payment…" : "Cash Payment Received"}</Text>
      <Text style={styles.subtitle}>The trip payment has been recorded as cash, collected on behalf of LuxoRides.</Text>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", justifyContent: "center" },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: radius.pill,
    backgroundColor: colors.successBg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  title: { ...type.h1, color: colors.textPrimary, textAlign: "center" },
  subtitle: { ...type.body1, color: colors.textSecondary, textAlign: "center", marginTop: spacing.sm },
});

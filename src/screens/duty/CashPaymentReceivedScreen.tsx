import React, { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { DutyStackParamList } from "../../navigation/types";
import { Button, ScreenContainer } from "../../components";
import { dutyService } from "../../services";
import { track } from "../../services/analytics";
import { useDutyStore } from "../../store/dutyStore";
import { successHaptic } from "../../util/haptics";
import { colors, radius, spacing, type } from "../../theme";

type Props = NativeStackScreenProps<DutyStackParamList, "CashPaymentReceived">;

type Status = "confirming" | "confirmed" | "failed";

// Mirrors the Figma "Cash Payment Received" frame (node 675:11237).
//
// P0 revenue-integrity fix -- this used to call the mocked
// paymentService.confirmCashPayment, a local 600ms delay that never reached
// the backend at all. It now calls dutyService.confirmCashPayment(), the
// real /driver-api/duty/{token}/cash/confirm endpoint: the backend derives
// the amount itself, records a real CONFIRMED Payment row, and is safe to
// call more than once for the same duty (a retry after a timeout, a
// double-tap, or an app restart before this screen finished all return the
// same confirmed result, never a duplicate). This screen never trusts a
// local "it looked like it worked" state -- Continue only unlocks once the
// backend has actually confirmed.
export function CashPaymentReceivedScreen({ navigation }: Props) {
  const amountToCollect = useDutyStore((s) => s.dutyEndResult?.amountToCollect);
  // amountToCollect can only be missing if this screen is somehow reached
  // without a real endDuty() result in the store, which the navigator graph
  // doesn't allow (PaymentBilling, the only route here, requires
  // dutyEndResult to render its own amount) -- but never silently confirm an
  // invented amount if it happens anyway, so start "failed" (nothing to
  // confirm) rather than block the Continue button on a call that will
  // never be made.
  const [status, setStatus] = useState<Status>(amountToCollect != null ? "confirming" : "failed");
  const [confirmedAmount, setConfirmedAmount] = useState<number | null>(null);
  // Bumped by the Retry button to re-run the effect below -- same
  // subscribe-in-effect shape PaymentQrScreen already uses, rather than
  // invoking a state-setting async function directly from an event handler
  // outside an effect.
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (amountToCollect == null) return;

    let active = true;

    const confirm = async () => {
      try {
        const result = await dutyService.confirmCashPayment();
        if (!active) return;
        if (!result.confirmed) {
          // The backend responded but explicitly did not confirm -- treat
          // exactly like a thrown error, never like success.
          throw new Error(result.message ?? "Cash payment could not be confirmed.");
        }
        setConfirmedAmount(result.amount);
        setStatus("confirmed");
        track("cash_confirmed");
        successHaptic();
      } catch (e) {
        if (!active) return;
        setStatus("failed");
        Alert.alert(
          "Couldn't confirm cash payment",
          e instanceof Error ? e.message : "Please check your connection and try again."
        );
      }
    };

    confirm();

    return () => {
      active = false;
    };
  }, [amountToCollect, attempt]);

  const retry = () => {
    setStatus("confirming");
    setAttempt((n) => n + 1);
  };

  const confirming = status === "confirming";
  const failed = status === "failed";

  return (
    <ScreenContainer
      style={styles.wrap}
      footer={
        failed ? (
          <Button label="Retry" onPress={retry} disabled={confirming} />
        ) : (
          <Button
            label="Continue"
            onPress={() => navigation.navigate("DutyCompletionSlip")}
            disabled={confirming || status !== "confirmed"}
          />
        )
      }
    >
      <View style={styles.iconWrap}>
        <Feather
          name={confirming ? "loader" : failed ? "alert-circle" : "check"}
          size={44}
          color={failed ? colors.error : colors.success}
        />
      </View>
      <Text style={styles.title}>
        {confirming ? "Confirming payment…" : failed ? "Couldn't confirm cash payment" : "Cash Payment Received"}
      </Text>
      <Text style={styles.subtitle}>
        {failed
          ? "We couldn't record this with LuxoRides yet. Don't collect cash again — just retry once you're back online."
          : `The trip payment${confirmedAmount != null ? ` of ₹${confirmedAmount.toLocaleString("en-IN")}` : ""} has been recorded as cash, collected on behalf of LuxoRides.`}
      </Text>
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

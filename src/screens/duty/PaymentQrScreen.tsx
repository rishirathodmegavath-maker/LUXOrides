import React, { useEffect, useRef, useState } from "react";
import { Linking, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { DutyStackParamList } from "../../navigation/types";
import { Button, QrPaymentCard, ScreenContainer, ScreenHeader } from "../../components";
import { dutyService } from "../../services";
import { track } from "../../services/analytics";
import { subscribeToDutyPaymentUpdates } from "../../services/realtime/dutyPaymentSocket";
import { useDutyStore } from "../../store/dutyStore";
import { SUPPORT_PHONE_TEL } from "../../constants/support";
import { successHaptic } from "../../util/haptics";
import { colors, radius, spacing, type } from "../../theme";

const MANUAL_CHECK_COOLDOWN_MS = 5000;

// The backend's own real QrPaymentStatusResponse.status values (see
// com.core.gateway.razerpay.QrPaymentStatusResponse / RazorpayPaymentService.
// isPaidByQR) -- EXPIRED/FAILED are genuine terminal states this gateway
// returns, not invented client-side. There is no self-service "regenerate
// QR" capability anywhere in this backend today (the QR is created once, as
// part of endDuty), so the only honest recovery action for either is Call
// Support -- inventing a regenerate button here would be UI for a capability
// that doesn't exist.
const BLOCKED_STATUSES = new Set(["EXPIRED", "FAILED"]);
const BLOCKED_COPY: Record<string, string> = {
  EXPIRED: "This payment QR code has expired.",
  FAILED: "We couldn't generate a payment QR for this trip.",
};

type Props = NativeStackScreenProps<DutyStackParamList, "PaymentQr">;

// Mirrors the payment QR panel from the Figma side-drawer / payment flow —
// reused here as its own duty-flow screen once a bill is generated. A
// WebSocket push (see dutyPaymentSocket) replaces the old 4s poll; this
// still calls checkPaymentStatus() once up front, which is what makes the
// reconcileActiveDuty resume path work: after a restart, dutyEndResult is
// gone (only executionToken survives), so that first call is what actually
// populates the QR/amount before the socket ever connects.
//
// P1 financial-integrity fix: "Payment Received" is now hard-gated on
// paid===true, a value this screen only ever sets from a real backend
// response (initial GET, a WebSocket-triggered re-check, or a manual
// re-check) — never from the button press, QR display, elapsed time, or the
// socket connection itself. Once true it never reverts, since only the
// backend can downgrade a genuinely-confirmed payment, and a transient
// re-check failure must not un-confirm it client-side.
export function PaymentQrScreen({ navigation }: Props) {
  const result = useDutyStore((s) => s.dutyEndResult);
  const executionToken = useDutyStore((s) => s.executionToken);
  const [paid, setPaid] = useState(false);
  const [qrStatus, setQrStatus] = useState<string>("PENDING");
  const [amount, setAmount] = useState<number | null>(result?.amountToCollect ?? null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(result?.qrCodeUrl ?? null);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const lastCheckedAtRef = useRef(0);
  const confirmingRef = useRef(false);

  const isBlocked = !paid && BLOCKED_STATUSES.has(qrStatus);

  // Initial load (covers the reconcileActiveDuty resume path, where only
  // executionToken survives a restart) plus every WebSocket push. A fresh
  // closure per effect run, matching the pattern the previous
  // implementation used — the manual "Check payment status" button below
  // has its own separate handler rather than sharing this one, since it
  // also needs to drive the "checking" button state that this background
  // path deliberately doesn't touch.
  useEffect(() => {
    if (!executionToken || paid) return;

    let active = true;

    const apply = async () => {
      try {
        const status = await dutyService.checkPaymentStatus();
        if (!active) return;
        if (status.amount != null) setAmount(status.amount);
        if (status.qrImageUrl) setQrCodeUrl(status.qrImageUrl);
        setQrStatus(status.status);
        if (status.paid) {
          setPaid(true);
          track("payment_confirmed");
          successHaptic();
        }
        setError(null);
      } catch (e) {
        if (!active) return;
        setError(e instanceof Error ? e.message : "Couldn't check payment status. Please try again.");
      } finally {
        lastCheckedAtRef.current = Date.now();
      }
    };

    apply();

    const unsubscribe = subscribeToDutyPaymentUpdates(executionToken, () => {
      apply();
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [executionToken, paid]);

  // Covers "payment succeeded on backend, the WebSocket event was delayed or
  // lost, driver is still staring at the QR" — reuses the same status
  // fetch rather than adding a poll, and is itself rate-limited (disabled
  // while in flight, ignored within a cooldown window after the last check)
  // so repeated taps can't turn into a request storm. Left enabled even
  // while isBlocked -- a re-check is how the driver would ever discover
  // ops resolved it (e.g. confirmed the payment through another channel).
  const onManualCheck = async () => {
    if (checking) return;
    if (Date.now() - lastCheckedAtRef.current < MANUAL_CHECK_COOLDOWN_MS) return;

    setChecking(true);
    try {
      const status = await dutyService.checkPaymentStatus();
      if (status.amount != null) setAmount(status.amount);
      if (status.qrImageUrl) setQrCodeUrl(status.qrImageUrl);
      setQrStatus(status.status);
      if (status.paid) {
        setPaid(true);
        track("payment_confirmed");
        successHaptic();
      }
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't check payment status. Please try again.");
    } finally {
      setChecking(false);
      lastCheckedAtRef.current = Date.now();
    }
  };

  const onCallSupport = () => {
    Linking.openURL(SUPPORT_PHONE_TEL).catch(() => {});
  };

  // confirmingRef guards re-entrancy synchronously -- state alone isn't
  // enough here, since two presses landing before React re-renders would
  // both still read the same (stale) confirming===false from their own
  // closures and both pass the check.
  const onContinue = () => {
    if (!paid || confirmingRef.current) return;
    confirmingRef.current = true;
    setConfirming(true);
    navigation.navigate("DutyCompletionSlip");
  };

  return (
    <ScreenContainer
      footer={
        <Button
          label={paid ? "Payment Received" : isBlocked ? "Payment unavailable" : "Waiting for payment..."}
          onPress={onContinue}
          disabled={!paid || confirming}
        />
      }
    >
      <ScreenHeader onBack={() => navigation.goBack()} title="Scan to Pay" />
      <QrPaymentCard qrCodeUrl={qrCodeUrl} amount={amount} paid={paid} />

      {!paid ? (
        <>
          {isBlocked ? (
            <View style={styles.blockedBanner}>
              <Text style={styles.blockedText}>{BLOCKED_COPY[qrStatus] ?? "This payment QR code isn't available."}</Text>
              <Button label="Call Support" variant="secondary" onPress={onCallSupport} style={{ marginTop: spacing.sm }} />
            </View>
          ) : null}
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          <Button
            label={checking ? "Checking..." : "Check payment status"}
            variant="secondary"
            onPress={onManualCheck}
            disabled={checking}
            style={{ marginTop: spacing.md }}
          />
        </>
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  errorText: { ...type.body2, color: colors.error, marginTop: spacing.md, marginBottom: spacing.xs },
  blockedBanner: {
    backgroundColor: colors.errorBg,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  blockedText: { ...type.body2, color: colors.error },
});

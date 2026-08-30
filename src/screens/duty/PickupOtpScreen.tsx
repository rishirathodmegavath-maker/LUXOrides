import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { DutyStackParamList } from "../../navigation/types";
import { Button, OtpField, ScreenContainer } from "../../components";
import { dutyService } from "../../services";
import { colors, spacing, type } from "../../theme";

type Props = NativeStackScreenProps<DutyStackParamList, "PickupOtp">;

// Mirrors the Figma "Pickup Location" frame (node 675:11779) — the client
// OTP verification step that starts the ride, per the sitemap's
// "OTP Verification / Verify & Start Ride". Phase 1: the OTP is generated
// server-side and SMS'd to the customer on the booking the moment this
// screen mounts, and verified server-side only — there is no client-side
// success condition (no hardcoded code) anywhere in this screen.
export function PickupOtpScreen({ navigation }: Props) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [verifying, setVerifying] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(true);
  const [sendError, setSendError] = useState<string | undefined>();
  const [resendTick, setResendTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await dutyService.requestPickupOtp();
      } catch (e) {
        if (!cancelled) setSendError(e instanceof Error ? e.message : "Couldn't send the code. Tap resend to try again.");
      } finally {
        if (!cancelled) setSendingOtp(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [resendTick]);

  const onResend = () => {
    setSendingOtp(true);
    setSendError(undefined);
    setResendTick((n) => n + 1);
  };

  const onVerify = async () => {
    setVerifying(true);
    setError(undefined);
    try {
      await dutyService.verifyPickupOtp(code);
      navigation.navigate("DropOffMap");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't verify this code. Please try again.");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <ScreenContainer footer={<Button label="Verify & Start Ride" onPress={onVerify} disabled={code.length < 6 || verifying} loading={verifying} />}>
      <Text style={styles.title}>Verify & Start Ride</Text>
      <Text style={styles.subtitle}>
        {sendingOtp
          ? "Sending a 6-digit code to the client..."
          : "Ask your client for the 6-digit code sent to their phone and enter it below to start the trip."}
      </Text>
      {sendError ? <Text style={styles.sendErrorText}>{sendError}</Text> : null}
      <ScreenContainer padded={false} scroll={false} style={{ marginTop: spacing.xl }}>
        <OtpField length={6} value={code} onChange={setCode} errorText={error} autoFocus />
      </ScreenContainer>
      <TouchableOpacity onPress={onResend} disabled={sendingOtp} style={styles.resendLink}>
        <Text style={styles.resendText}>{sendingOtp ? "Sending..." : "Resend code"}</Text>
      </TouchableOpacity>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { ...type.h1, color: colors.textPrimary },
  subtitle: { ...type.body1, color: colors.textSecondary, marginTop: spacing.sm },
  sendErrorText: { ...type.body3, color: colors.error, marginTop: spacing.sm },
  resendLink: { marginTop: spacing.lg, alignItems: "center" },
  resendText: { ...type.body2, color: colors.primary, textDecorationLine: "underline" },
});

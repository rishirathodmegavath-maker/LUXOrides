import React, { useEffect, useState } from "react";
import { StyleSheet, Text } from "react-native";
import { Feather } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "../../navigation/types";
import { Button, OtpField, ScreenContainer, ScreenHeader } from "../../components";
import { authService } from "../../services";
import { useAuthStore } from "../../store/authStore";
import { colors, spacing, type } from "../../theme";

type Props = NativeStackScreenProps<AuthStackParamList, "Otp">;

// Mirrors the Figma "OTP Screen 01"-"04" (entry states) and "OTP Screen 05
// Successful" frames (nodes 669:7090..669:7383) plus the "States of OTP"
// component (263:1970) — consolidated into one dynamic screen driven by
// real focus/filled/error/verified state rather than 5 separate routes.
export function OtpScreen({ route, navigation }: Props) {
  const { phone } = route.params;
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [seconds, setSeconds] = useState(45);
  const setSession = useAuthStore((s) => s.setSession);

  useEffect(() => {
    if (seconds <= 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  const onVerify = async () => {
    setError(undefined);
    setVerifying(true);
    try {
      const session = await authService.verifyOtp(phone, code);
      setVerified(true);
      // RootNavigator switches stacks automatically once the session is set
      // (see App root navigator gating on useAuthStore).
      setTimeout(() => setSession(session), 700);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Verification failed");
    } finally {
      setVerifying(false);
    }
  };

  const onResend = async () => {
    await authService.resendOtp(phone);
    setSeconds(45);
  };

  if (verified) {
    return (
      <ScreenContainer style={styles.successWrap}>
        <Feather name="check-circle" size={72} color={colors.success} />
        <Text style={styles.successTitle}>Verified!</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer
      footer={
        <Button label="Verify" onPress={onVerify} disabled={code.length < 6} loading={verifying} />
      }
    >
      <ScreenHeader onBack={() => navigation.goBack()} />
      <Text style={styles.title}>Enter verification code</Text>
      <Text style={styles.subtitle}>Enter the 6-digit code we sent to</Text>
      <Text style={styles.phone}>+91 {phone}</Text>

      <ScreenContainer padded={false} scroll={false} style={{ marginTop: spacing.xl }}>
        <OtpField length={6} value={code} onChange={setCode} errorText={error} autoFocus />
      </ScreenContainer>

      <Text style={styles.resendRow}>
        {seconds > 0 ? (
          <>Didn&apos;t receive the code? <Text style={styles.bold}>Resend in {String(Math.floor(seconds / 60)).padStart(2, "0")}:{String(seconds % 60).padStart(2, "0")}.</Text></>
        ) : (
          <Text style={styles.link} onPress={onResend}>Resend code</Text>
        )}
      </Text>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { ...type.h1, color: colors.textPrimary },
  subtitle: { ...type.body1, color: colors.textSecondary, marginTop: spacing.sm },
  phone: { ...type.h4, color: colors.textPrimary },
  resendRow: { ...type.body2, color: colors.textSecondary, marginTop: spacing.lg },
  bold: { fontFamily: type.label.fontFamily, color: colors.textPrimary },
  link: { color: colors.info, fontFamily: type.label.fontFamily },
  successWrap: { alignItems: "center", justifyContent: "center", gap: spacing.md },
  successTitle: { ...type.h2, color: colors.textPrimary },
});

import React, { useState } from "react";
import { StyleSheet, Text } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { DutyStackParamList } from "../../navigation/types";
import { Button, OtpField, ScreenContainer } from "../../components";
import { dutyService } from "../../services";
import { colors, spacing, type } from "../../theme";

type Props = NativeStackScreenProps<DutyStackParamList, "PickupOtp">;

// Mirrors the Figma "Pickup Location" frame (node 675:11779) — the client
// OTP verification step that starts the ride, per the sitemap's
// "OTP Verification / Verify & Start Ride".
export function PickupOtpScreen({ navigation }: Props) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [verifying, setVerifying] = useState(false);

  const onVerify = async () => {
    setVerifying(true);
    setError(undefined);
    try {
      const ok = await dutyService.verifyPickupOtp(code);
      if (ok) navigation.navigate("DropOffMap");
      else setError("Incorrect code. Ask the client to confirm the OTP.");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <ScreenContainer footer={<Button label="Verify & Start Ride" onPress={onVerify} disabled={code.length < 6} loading={verifying} />}>
      <Text style={styles.title}>Verify & Start Ride</Text>
      <Text style={styles.subtitle}>Ask your client for the 6-digit code and enter it below to start the trip.</Text>
      <ScreenContainer padded={false} scroll={false} style={{ marginTop: spacing.xl }}>
        <OtpField length={6} value={code} onChange={setCode} errorText={error} autoFocus />
      </ScreenContainer>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { ...type.h1, color: colors.textPrimary },
  subtitle: { ...type.body1, color: colors.textSecondary, marginTop: spacing.sm },
});

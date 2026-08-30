import React, { useState } from "react";
import { StyleSheet, Text } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { OnboardingStackParamList } from "../../navigation/types";
import { Button, CaptureStatus, PhotoCapture, ScreenContainer, ScreenHeader, TextField } from "../../components";
import { onboardingService } from "../../services";
import { colors, spacing, type } from "../../theme";

type Props = NativeStackScreenProps<OnboardingStackParamList, "DocUpload">;

const COPY = {
  drivingLicence: {
    title: "Upload your Driving Licence",
    subtitle: "Take a clear photo of the front of your Driving Licence.",
  },
  aadhaarCard: {
    title: "Upload your Aadhaar Card",
    subtitle: "Take a clear photo of the front of your Aadhaar Card.",
  },
};

// Mirrors the Figma "Driving License Upload / Upload 3 / Success" (nodes
// 671:9013, 671:9033, 671:9131) and "Aadhar Card Photo Upload / Upload 3 /
// Error / Success" (671:9059, 671:9077, 671:9098, 671:9120) frames — one
// dynamic screen driven by the real upload/verify status instead of four.
// Driving licences are the one document type this app collects that
// genuinely expires; Aadhaar has no expiry to capture here.
const EXPIRY_APPLICABLE: Record<keyof typeof COPY, boolean> = {
  drivingLicence: true,
  aadhaarCard: false,
};

export function DocUploadScreen({ route, navigation }: Props) {
  const { doc } = route.params;
  const copy = COPY[doc];
  const [uri, setUri] = useState<string>();
  const [status, setStatus] = useState<CaptureStatus>("idle");
  const [expiryDate, setExpiryDate] = useState("");

  const onCapture = async (pickedUri: string) => {
    setUri(pickedUri);
    setStatus("uploading");
    const isoExpiry = expiryDate.trim() ? new Date(`${expiryDate.trim()}T00:00:00Z`).toISOString() : null;
    const result = await onboardingService.uploadDocument(doc, pickedUri, isoExpiry);
    setStatus(result.status === "idle" ? "idle" : result.status);
  };

  const onRetry = () => {
    setUri(undefined);
    setStatus("idle");
  };

  return (
    <ScreenContainer
      footer={
        status === "verified" || status === "verifying" ? (
          // Real submissions land as PENDING_REVIEW ("verifying") and stay
          // there until an operations reviewer acts -- onboarding must not
          // block the driver from continuing while that real review is
          // pending, only "failed" (a genuine rejection) requires action here.
          <Button label="Continue" onPress={() => navigation.navigate("OnboardingHub")} />
        ) : status === "failed" ? (
          <Button label="Redo & Resubmit" onPress={onRetry} />
        ) : (
          <Button label="Continue" disabled />
        )
      }
    >
      <ScreenHeader onBack={() => navigation.goBack()} />
      <Text style={styles.title}>{copy.title}</Text>
      <Text style={styles.subtitle}>{copy.subtitle}</Text>

      {EXPIRY_APPLICABLE[doc] ? (
        <TextField
          label="Expiry date (YYYY-MM-DD)"
          value={expiryDate}
          onChangeText={setExpiryDate}
          placeholder="e.g. 2029-06-30"
          keyboardType="numbers-and-punctuation"
          containerStyle={{ marginBottom: spacing.lg }}
        />
      ) : null}

      <PhotoCapture
        uri={uri}
        status={status}
        onCapture={onCapture}
        errorText={
          status === "failed"
            ? "We couldn't verify this document — the photo may be blurry or the wrong document. Please retake it."
            : undefined
        }
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { ...type.h1, color: colors.textPrimary },
  subtitle: { ...type.body1, color: colors.textSecondary, marginTop: spacing.sm, marginBottom: spacing.xl },
});

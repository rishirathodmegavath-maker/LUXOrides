import React, { useState } from "react";
import { StyleSheet, Text } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/types";
import { Button, CaptureStatus, PhotoCapture, ScreenContainer, ScreenHeader, TextField } from "../../components";
import { onboardingService } from "../../services";
import { colors, spacing, type } from "../../theme";

type Props = NativeStackScreenProps<RootStackParamList, "DocumentUpload">;

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

const EXPIRY_APPLICABLE: Record<keyof typeof COPY, boolean> = {
  drivingLicence: true,
  aadhaarCard: false,
};

// Same real upload/status flow as onboarding's DocUploadScreen, reached
// instead from DocumentsScreen (Profile) -- once a driver is past
// onboarding that stack is never mounted again, so a re-upload/re-check
// after approval needs its own root-level route to the same real endpoint.
export function DocumentUploadScreen({ route, navigation }: Props) {
  const { doc } = route.params;
  const copy = COPY[doc];
  const [uri, setUri] = useState<string>();
  const [status, setStatus] = useState<CaptureStatus>("idle");
  const [uploadError, setUploadError] = useState<string>();
  const [expiryDate, setExpiryDate] = useState("");

  const onCapture = async (pickedUri: string) => {
    setUri(pickedUri);
    setStatus("uploading");
    setUploadError(undefined);
    const isoExpiry = expiryDate.trim() ? new Date(`${expiryDate.trim()}T00:00:00Z`).toISOString() : null;
    try {
      const result = await onboardingService.uploadDocument(doc, pickedUri, isoExpiry);
      setStatus(result.status === "idle" ? "idle" : result.status);
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Upload failed. Check your connection and try again.");
      setStatus("failed");
    }
  };

  const onRetry = () => {
    setUri(undefined);
    setStatus("idle");
    setUploadError(undefined);
  };

  return (
    <ScreenContainer
      footer={
        status === "verified" || status === "verifying" ? (
          <Button label="Done" onPress={() => navigation.goBack()} />
        ) : status === "failed" ? (
          <Button label="Redo & Resubmit" onPress={onRetry} />
        ) : (
          <Button label="Done" disabled />
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
            ? (uploadError ?? "We couldn't verify this document — the photo may be blurry or the wrong document. Please retake it.")
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

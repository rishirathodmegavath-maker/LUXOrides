import React, { useState } from "react";
import { StyleSheet, Text } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { OnboardingStackParamList } from "../../navigation/types";
import { Button, CaptureStatus, PhotoCapture, ScreenContainer, ScreenHeader } from "../../components";
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
export function DocUploadScreen({ route, navigation }: Props) {
  const { doc } = route.params;
  const copy = COPY[doc];
  const [uri, setUri] = useState<string>();
  const [status, setStatus] = useState<CaptureStatus>("idle");

  const onCapture = async (pickedUri: string) => {
    setUri(pickedUri);
    setStatus("uploading");
    const result = await onboardingService.uploadDocument(doc, pickedUri);
    setStatus(result.status === "idle" ? "idle" : result.status);
  };

  const onRetry = () => {
    setUri(undefined);
    setStatus("idle");
  };

  return (
    <ScreenContainer
      footer={
        status === "verified" ? (
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

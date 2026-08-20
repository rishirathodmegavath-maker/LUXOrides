import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { OnboardingStackParamList } from "../../navigation/types";
import { Button, CaptureStatus, PhotoCapture, ScreenContainer, ScreenHeader } from "../../components";
import { onboardingService } from "../../services";
import { useOnboardingStore } from "../../store/onboardingStore";
import { colors, spacing, type } from "../../theme";

type Props = NativeStackScreenProps<OnboardingStackParamList, "ProfilePhoto">;

// Mirrors the Figma "Profile Photo" capture/review/verifying/verified/
// failed/submitted frames (nodes 671:8854, 671:8894, 671:8876, 671:8909,
// 671:8981, 671:8945, 671:9002) — one dynamic screen driven by real status.
export function ProfilePhotoScreen({ navigation }: Props) {
  const [uri, setUri] = useState<string>();
  const [status, setStatus] = useState<CaptureStatus>("idle");
  const [submitted, setSubmitted] = useState(false);
  const setPhotoDone = useOnboardingStore((s) => s.setPhotoDone);

  const onCapture = async (pickedUri: string) => {
    setUri(pickedUri);
    setStatus("uploading");
    const result = await onboardingService.uploadDocument("profilePhoto", pickedUri);
    setStatus(result.status);
  };

  const onSubmit = () => {
    setPhotoDone(true);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <ScreenContainer style={styles.successWrap} footer={<Button label="Back to Checklist" onPress={() => navigation.navigate("OnboardingHub")} />}>
        <View style={styles.successIcon}>
          <Feather name="check" size={40} color={colors.success} />
        </View>
        <Text style={styles.successTitle}>Profile Photo Submitted</Text>
        <Text style={styles.subtitle}>We&apos;ll verify your photo shortly.</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer
      footer={
        status === "verified" ? (
          <Button label="Submit" onPress={onSubmit} />
        ) : status === "failed" ? (
          <Button label="Redo & Resubmit" onPress={() => { setUri(undefined); setStatus("idle"); }} />
        ) : (
          <Button label="Submit" disabled />
        )
      }
    >
      <ScreenHeader onBack={() => navigation.goBack()} />
      <Text style={styles.title}>Profile Picture</Text>
      <Text style={styles.subtitle}>Upload a clear photo of your face to verify your identity.</Text>
      <PhotoCapture
        uri={uri}
        status={status}
        onCapture={onCapture}
        aspect={[3, 4]}
        label="Tap to take a selfie"
        errorText={status === "failed" ? "We couldn't verify this photo — make sure your face is clearly visible." : undefined}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { ...type.h1, color: colors.textPrimary },
  subtitle: { ...type.body1, color: colors.textSecondary, marginTop: spacing.sm, marginBottom: spacing.xl },
  successWrap: { alignItems: "center", justifyContent: "center" },
  successIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.successBg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  successTitle: { ...type.h2, color: colors.textPrimary },
});

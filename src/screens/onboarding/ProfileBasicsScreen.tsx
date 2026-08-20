import React, { useState } from "react";
import { StyleSheet, Text } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { OnboardingStackParamList } from "../../navigation/types";
import { Button, ScreenContainer, ScreenHeader, TextField } from "../../components";
import { onboardingService } from "../../services";
import { useAuthStore } from "../../store/authStore";
import { colors, spacing, type } from "../../theme";

type Props = NativeStackScreenProps<OnboardingStackParamList, "ProfileBasics">;

interface StepConfig {
  key: "name" | "phone" | "email" | "experience";
  title: string;
  subtitle: string;
  label: string;
  placeholder: string;
  keyboardType?: "default" | "email-address" | "number-pad" | "phone-pad";
  optional?: boolean;
}

const STEPS: StepConfig[] = [
  { key: "name", title: "Complete Your Profile", subtitle: "Complete your profile to help us verify your account and assign duties accurately.", label: "Full Name", placeholder: "Enter your full name" },
  { key: "phone", title: "Complete Your Profile", subtitle: "Complete your profile to help us verify your account and assign duties accurately.", label: "Mobile Number", placeholder: "Enter your Phone Number", keyboardType: "phone-pad" },
  { key: "email", title: "Complete Your Profile", subtitle: "Complete your profile to help us verify your account and assign duties accurately.", label: "Email Address", placeholder: "abc@gmail.com", keyboardType: "email-address" },
  { key: "experience", title: "Complete Your Profile", subtitle: "Complete your profile to help us verify your account and assign duties accurately.", label: "Years of Experience (optional)", placeholder: "e.g. 5", keyboardType: "number-pad", optional: true },
];

// Mirrors the Figma "Profile Setp 1"-"4" frames (nodes 182:633, 196:1333,
// 671:8578, 671:8639): the same single-field layout repeated per field —
// implemented as one screen stepping through STEPS rather than 4 files.
export function ProfileBasicsScreen({ navigation }: Props) {
  const phone = useAuthStore((s) => s.session?.phone) ?? "";
  const [stepIndex, setStepIndex] = useState(0);
  const [values, setValues] = useState({ name: "", phone, email: "", experience: "" });
  const [saving, setSaving] = useState(false);

  const step = STEPS[stepIndex];
  const value = values[step.key];
  const canContinue = step.optional || value.trim().length > 0;

  const onContinue = async () => {
    if (stepIndex < STEPS.length - 1) {
      setStepIndex((i) => i + 1);
      return;
    }
    setSaving(true);
    try {
      await onboardingService.saveProfileBasics({
        name: values.name,
        email: values.email || undefined,
        experienceYears: values.experience ? Number(values.experience) : undefined,
      });
      navigation.replace("OnboardingHub");
    } finally {
      setSaving(false);
    }
  };

  const onBack = () => {
    if (stepIndex > 0) setStepIndex((i) => i - 1);
    else navigation.goBack();
  };

  return (
    <ScreenContainer footer={<Button label="Continue" onPress={onContinue} disabled={!canContinue} loading={saving} />}>
      <ScreenHeader onBack={onBack} />
      <Text style={styles.title}>{step.title}</Text>
      <Text style={styles.subtitle}>{step.subtitle}</Text>
      <TextField
        label={step.label}
        value={value}
        onChangeText={(t) => setValues((v) => ({ ...v, [step.key]: t }))}
        placeholder={step.placeholder}
        keyboardType={step.keyboardType ?? "default"}
        containerStyle={{ marginTop: spacing.xl }}
        autoFocus
        editable={step.key !== "phone"}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { ...type.h1, color: colors.textPrimary },
  subtitle: { ...type.body1, color: colors.textSecondary, marginTop: spacing.sm },
});

import React, { useState } from "react";
import { StyleSheet, Text } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { OnboardingStackParamList } from "../../navigation/types";
import { Button, Dropdown, ScreenContainer, ScreenHeader } from "../../components";
import { onboardingService } from "../../services";
import { useOnboardingStore } from "../../store/onboardingStore";
import { colors, spacing, type } from "../../theme";

type Props = NativeStackScreenProps<OnboardingStackParamList, "GarageLocation">;

const GARAGES = [
  { label: "Garage Inc., New Delhi", value: "garage_delhi" },
  { label: "Garage Inc., Gurugram", value: "garage_gurugram" },
  { label: "Garage Inc., Noida", value: "garage_noida" },
];

// Mirrors the Figma "Select Your Garage Location" frame (node 671:8656).
export function GarageLocationScreen({ navigation }: Props) {
  const [value, setValue] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const setGarageDone = useOnboardingStore((s) => s.setGarageDone);

  const onContinue = async () => {
    if (!value) return;
    setSaving(true);
    const garage = GARAGES.find((g) => g.value === value)!;
    try {
      await onboardingService.saveGarageLocation({ garageName: garage.label, garageAddress: garage.label });
      setGarageDone(true, garage.label);
      navigation.navigate("OnboardingHub");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenContainer footer={<Button label="Continue" onPress={onContinue} disabled={!value} loading={saving} />}>
      <ScreenHeader onBack={() => navigation.goBack()} />
      <Text style={styles.title}>Select Your Garage Location</Text>
      <Text style={styles.subtitle}>Select the garage you&apos;ll be reporting to for your duties.</Text>
      <Dropdown
        label="Select Your Garage Location"
        value={value}
        options={GARAGES}
        onChange={setValue}
        placeholder="Select your Garage Location"
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { ...type.h1, color: colors.textPrimary },
  subtitle: { ...type.body1, color: colors.textSecondary, marginTop: spacing.sm, marginBottom: spacing.xl },
});

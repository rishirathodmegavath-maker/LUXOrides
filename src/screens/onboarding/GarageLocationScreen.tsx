import React, { useCallback, useEffect, useState } from "react";
import { Alert, StyleSheet, Text } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { OnboardingStackParamList } from "../../navigation/types";
import { Button, Dropdown, InlineErrorBanner, ScreenContainer, ScreenHeader } from "../../components";
import { onboardingService } from "../../services";
import type { GarageOption } from "../../services/types";
import { useOnboardingStore } from "../../store/onboardingStore";
import { colors, spacing, type } from "../../theme";

type Props = NativeStackScreenProps<OnboardingStackParamList, "GarageLocation">;

// Mirrors the Figma "Select Your Garage Location" frame (node 671:8656).
// Previously showed 3 hardcoded fake garage names and saved the selection
// nowhere real -- now loads the org's actual configured garages (the same
// CityGarage records ops manages) and persists the choice through the real
// profile-update endpoint (see FleetovoOnboardingService).
export function GarageLocationScreen({ navigation }: Props) {
  const [garages, setGarages] = useState<GarageOption[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [value, setValue] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const setGarageDone = useOnboardingStore((s) => s.setGarageDone);

  // No synchronous setState at the top of this -- only the .then/.catch
  // callbacks below set state, so calling it directly from the mount effect
  // doesn't trip react-hooks/set-state-in-effect (see useDutyRoute.ts for
  // the same shape). On mount, garages/loadError are already at their clean
  // defaults, so there's nothing to reset before the first fetch.
  const fetchGarages = useCallback(() => {
    onboardingService
      .getGarageOptions()
      .then(setGarages)
      .catch(() => setLoadError(true));
  }, []);

  useEffect(() => {
    fetchGarages();
  }, [fetchGarages]);

  // Retry is a plain event handler (Pressable onPress via InlineErrorBanner),
  // not an effect body -- resetting state here before re-fetching is the
  // normal, unflagged pattern.
  const retry = () => {
    setLoadError(false);
    setGarages(null);
    setValue(null);
    fetchGarages();
  };

  const onContinue = async () => {
    const garage = garages?.find((g) => g.id === value);
    if (!garage) return;
    setSaving(true);
    try {
      await onboardingService.saveGarageLocation({ garageName: garage.garageName, garageAddress: garage.garageAddress });
      setGarageDone(true, garage.garageName);
      navigation.navigate("OnboardingHub");
    } catch (e) {
      // Input (the selection) stays intact on failure -- `value` is untouched,
      // so a retry doesn't make the driver re-pick.
      Alert.alert("Couldn't save", e instanceof Error ? e.message : "Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const options = (garages ?? []).map((g) => ({ label: g.garageName, value: g.id }));

  return (
    <ScreenContainer footer={<Button label="Continue" onPress={onContinue} disabled={!value} loading={saving} />}>
      <ScreenHeader onBack={() => navigation.goBack()} />
      <Text style={styles.title}>Select Your Garage Location</Text>
      <Text style={styles.subtitle}>Select the garage you&apos;ll be reporting to for your duties.</Text>

      {loadError ? (
        <InlineErrorBanner message="Couldn't load garages." onRetry={retry} />
      ) : garages === null ? (
        <Text style={styles.status}>Loading garages…</Text>
      ) : garages.length === 0 ? (
        <Text style={styles.status}>
          No garages have been set up for your organisation yet. Contact your operations team to get one added.
        </Text>
      ) : (
        <Dropdown
          label="Select Your Garage Location"
          value={value}
          options={options}
          onChange={setValue}
          placeholder="Select your Garage Location"
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { ...type.h1, color: colors.textPrimary },
  subtitle: { ...type.body1, color: colors.textSecondary, marginTop: spacing.sm, marginBottom: spacing.xl },
  status: { ...type.body2, color: colors.textSecondary },
});

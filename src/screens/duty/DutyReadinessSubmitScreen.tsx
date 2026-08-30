import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { DutyStackParamList } from "../../navigation/types";
import { Button, ConsentCheckbox, Dropdown, IconCircle, ProgressBar, ScreenContainer, ScreenHeader, TextField } from "../../components";
import { dutyService } from "../../services";
import type { Cleanliness, FuelLevel, VehicleCondition } from "../../services/types";
import { useDutyStore } from "../../store/dutyStore";
import { colors, spacing, type } from "../../theme";

const CONDITION_OPTIONS: { label: string; value: VehicleCondition }[] = [
  { label: "Good", value: "GOOD" },
  { label: "Minor Damage", value: "MINOR_DAMAGE" },
  { label: "Major Damage", value: "MAJOR_DAMAGE" },
];

const CLEANLINESS_OPTIONS: { label: string; value: Cleanliness }[] = [
  { label: "Clean", value: "CLEAN" },
  { label: "Needs Cleaning", value: "NEEDS_CLEANING" },
];

const FUEL_OPTIONS: { label: string; value: FuelLevel }[] = [
  { label: "Empty", value: "EMPTY" },
  { label: "1/4", value: "QUARTER" },
  { label: "1/2", value: "HALF" },
  { label: "3/4", value: "THREE_QUARTERS" },
  { label: "Full", value: "FULL" },
];

type Props = NativeStackScreenProps<DutyStackParamList, "DutyReadinessSubmit">;

const STEPS = [
  { key: "uniformSelfieUri", icon: "user" as const, title: "Uniform Selfie", subtitle: "Uniform photo uploaded" },
  { key: "vehicleExteriorUris", icon: "truck" as const, title: "Vehicle Exterior Photos", subtitle: "Exterior photos of vehicle uploaded" },
  { key: "vehicleInteriorUris", icon: "disc" as const, title: "Vehicle Interior Photos", subtitle: "Interior photos of vehicle uploaded" },
];

// Mirrors the Figma "Duty Readiness Submit Page" frame (node 675:11871).
export function DutyReadinessSubmitScreen({ navigation }: Props) {
  const checklist = useDutyStore((s) => s.checklist);
  const updateChecklist = useDutyStore((s) => s.updateChecklist);
  const setReadinessStatus = useDutyStore((s) => s.setReadinessStatus);
  const [submitting, setSubmitting] = useState(false);

  const isDone = (key: string) => {
    const value = checklist[key as keyof typeof checklist];
    if (Array.isArray(value)) return value.length > 0;
    if (value && typeof value === "object") return Object.keys(value).length > 0;
    return !!value;
  };
  const completed = STEPS.filter((s) => isDone(s.key)).length;
  const conditionsSelected =
    !!checklist.exteriorCondition &&
    !!checklist.interiorCondition &&
    !!checklist.cleanliness &&
    !!checklist.tyreCondition &&
    !!checklist.lightsCondition;
  const canSubmit = completed >= STEPS.length && conditionsSelected && !!checklist.driverConfirmed;

  const onSubmit = async () => {
    setSubmitting(true);
    try {
      await dutyService.submitReadiness(checklist);
      setReadinessStatus("approved");
      navigation.navigate("DutyStartMap");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenContainer
      footer={
        <Button
          label="Submit to Operations"
          onPress={onSubmit}
          disabled={!canSubmit}
          loading={submitting}
        />
      }
    >
      <ScreenHeader onBack={() => navigation.goBack()} />
      <Text style={styles.title}>Pre-Duty Check</Text>
      <Text style={styles.subtitle}>
        <Text style={styles.bold}>{completed}</Text> of <Text style={styles.bold}>{STEPS.length}</Text> steps completed
      </Text>
      <View style={{ marginTop: spacing.sm, marginBottom: spacing.xl }}>
        <ProgressBar steps={STEPS.length} completedSteps={completed} />
      </View>

      {STEPS.map((step) => (
        <View key={step.key} style={styles.row}>
          <IconCircle>
            <Feather name={step.icon} size={20} color={colors.textPrimary} />
          </IconCircle>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>{step.title}</Text>
            <Text style={styles.rowSubtitle}>{step.subtitle}</Text>
          </View>
          {isDone(step.key) ? <Feather name="check" size={22} color={colors.success} /> : null}
        </View>
      ))}

      <Text style={[styles.title, { fontSize: 18, marginTop: spacing.xl }]}>Vehicle Condition</Text>
      <View style={{ marginTop: spacing.md, gap: spacing.md }}>
        <Dropdown
          label="Exterior condition"
          value={checklist.exteriorCondition ?? null}
          options={CONDITION_OPTIONS}
          onChange={(v) => updateChecklist({ exteriorCondition: v as VehicleCondition })}
        />
        <Dropdown
          label="Interior condition"
          value={checklist.interiorCondition ?? null}
          options={CONDITION_OPTIONS}
          onChange={(v) => updateChecklist({ interiorCondition: v as VehicleCondition })}
        />
        <Dropdown
          label="Tyre condition"
          value={checklist.tyreCondition ?? null}
          options={CONDITION_OPTIONS}
          onChange={(v) => updateChecklist({ tyreCondition: v as VehicleCondition })}
        />
        <Dropdown
          label="Lights condition"
          value={checklist.lightsCondition ?? null}
          options={CONDITION_OPTIONS}
          onChange={(v) => updateChecklist({ lightsCondition: v as VehicleCondition })}
        />
        <Dropdown
          label="Cleanliness"
          value={checklist.cleanliness ?? null}
          options={CLEANLINESS_OPTIONS}
          onChange={(v) => updateChecklist({ cleanliness: v as Cleanliness })}
        />
        <Dropdown
          label="Fuel / charge level"
          value={checklist.fuelLevel ?? null}
          options={FUEL_OPTIONS}
          onChange={(v) => updateChecklist({ fuelLevel: v as FuelLevel })}
        />
        {(checklist.exteriorCondition && checklist.exteriorCondition !== "GOOD") ||
        (checklist.interiorCondition && checklist.interiorCondition !== "GOOD") ||
        (checklist.tyreCondition && checklist.tyreCondition !== "GOOD") ||
        (checklist.lightsCondition && checklist.lightsCondition !== "GOOD") ? (
          <TextField
            label="Damage notes"
            value={checklist.damageNotes ?? ""}
            onChangeText={(v) => updateChecklist({ damageNotes: v })}
            placeholder="Describe the damage"
            multiline
            numberOfLines={3}
          />
        ) : null}
      </View>

      <View style={{ marginTop: spacing.xl }}>
        <ConsentCheckbox
          checked={!!checklist.driverConfirmed}
          onToggle={(next) => updateChecklist({ driverConfirmed: next })}
          label="I confirm I have personally inspected this vehicle and the information above is accurate."
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { ...type.h1, color: colors.textPrimary },
  subtitle: { ...type.body1, color: colors.textPrimary, marginTop: spacing.sm },
  bold: { fontFamily: type.h4.fontFamily },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderMuted,
  },
  rowTitle: { ...type.h4, fontSize: 16, color: colors.textPrimary },
  rowSubtitle: { ...type.body2, color: colors.textSecondary },
});

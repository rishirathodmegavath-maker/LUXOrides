import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { DutyStackParamList } from "../../navigation/types";
import { Button, Dropdown, PhotoCapture, ScreenContainer, ScreenHeader, TextField } from "../../components";
import { dutyService } from "../../services";
import type { IncidentCategory } from "../../services/types";
import { captureCurrentLocation } from "../../util/location";
import { colors, spacing, type } from "../../theme";

type Props = NativeStackScreenProps<DutyStackParamList, "IncidentReport">;

const CATEGORY_OPTIONS: { label: string; value: IncidentCategory }[] = [
  { label: "Accident", value: "ACCIDENT" },
  { label: "Vehicle Breakdown", value: "VEHICLE_BREAKDOWN" },
  { label: "Traffic Violation", value: "TRAFFIC_VIOLATION" },
  { label: "Customer Dispute", value: "CUSTOMER_DISPUTE" },
  { label: "Other", value: "OTHER" },
];

// Real persistence via DriverDutyIncidentService -- no mock/fake success
// state. Location is captured the same way start/end duty checkpoints
// capture theirs (real GPS + best-effort reverse geocode), required because
// the backend's AddressSnapshot.formattedAddress column is non-nullable.
export function IncidentReportScreen({ navigation }: Props) {
  const [category, setCategory] = useState<IncidentCategory | null>(null);
  const [description, setDescription] = useState("");
  const [photoUris, setPhotoUris] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = !!category && description.trim().length > 0;

  const onSubmit = async () => {
    if (!category) return;
    setSubmitting(true);
    setError(null);
    try {
      const fix = await captureCurrentLocation();
      await dutyService.submitIncident({
        category,
        description: description.trim(),
        location: {
          latitude: fix.latitude,
          longitude: fix.longitude,
          accuracyMeters: fix.accuracyMeters,
          formattedAddress: fix.formattedAddress,
        },
        photoUris: photoUris.filter(Boolean),
      });
      navigation.navigate("IncidentReportConfirmation");
    } catch {
      setError("Couldn't submit this report. Check your location permission and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenContainer
      footer={<Button label="Submit Report" onPress={onSubmit} disabled={!canSubmit} loading={submitting} />}
    >
      <ScreenHeader onBack={() => navigation.goBack()} title="Report an Incident" />
      <Text style={styles.subtitle}>Describe what happened. This is sent directly to Fleetovo.</Text>

      <Dropdown
        label="Category"
        value={category}
        options={CATEGORY_OPTIONS}
        onChange={(v) => setCategory(v as IncidentCategory)}
        placeholder="Select a category"
      />

      <TextField
        label="Description"
        value={description}
        onChangeText={setDescription}
        placeholder="What happened?"
        multiline
        numberOfLines={4}
        containerStyle={{ marginTop: spacing.lg }}
      />

      <Text style={[styles.subtitle, { marginTop: spacing.lg }]}>Photos (optional, up to 3)</Text>
      <View style={styles.grid}>
        {[0, 1, 2].map((index) => (
          <View key={index} style={styles.cell}>
            <PhotoCapture
              uri={photoUris[index]}
              status={photoUris[index] ? "verified" : "idle"}
              onCapture={(uri) =>
                setPhotoUris((prev) => {
                  const next = [...prev];
                  next[index] = uri;
                  return next;
                })
              }
              compact
            />
          </View>
        ))}
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  subtitle: { ...type.body1, color: colors.textSecondary, marginTop: spacing.sm },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, justifyContent: "space-between", marginTop: spacing.sm },
  cell: { width: "31%" },
  errorText: { ...type.body3, color: colors.error, marginTop: spacing.md },
});

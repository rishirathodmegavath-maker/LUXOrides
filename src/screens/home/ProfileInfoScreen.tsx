import React, { useCallback, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/types";
import { driverApi } from "../../api/driver.api";
import type { DriverDTO } from "../../api/driver.types";
import { Button, Card, InlineErrorBanner, ScreenContainer, ScreenHeader, TextField } from "../../components";
import { colors, spacing, type } from "../../theme";

type Props = NativeStackScreenProps<RootStackParamList, "ProfileInfo">;

interface FormState {
  firstName: string;
  lastName: string;
  gender: string;
  alternatePhone: string;
  email: string;
  address: string;
  garageLocation: string;
  experienceYears: string;
}

function toForm(dto: DriverDTO): FormState {
  return {
    firstName: dto.name?.firstName ?? "",
    lastName: dto.name?.lastName ?? "",
    gender: dto.gender ?? "",
    alternatePhone: dto.alternatePhone ?? "",
    email: dto.email ?? "",
    address: dto.address?.formattedAddress ?? "",
    garageLocation: dto.garageLocation?.formattedAddress ?? "",
    experienceYears: dto.experienceYears != null ? String(dto.experienceYears) : "",
  };
}

// Real GET/PUT /driver/app/profile (DriverAppController -> DriverAppService)
// -- the "Profile Info" row Figma's Profile Main Bar frame shows but the
// app never had a screen for. License/Aadhaar are shown read-only here:
// those come from real KYC document verification (see DocumentsScreen),
// not free-text edit.
export function ProfileInfoScreen({ navigation }: Props) {
  const [driver, setDriver] = useState<DriverDTO | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoadError(false);
    driverApi
      .getProfile()
      .then((dto) => {
        setDriver(dto);
        setForm(toForm(dto));
      })
      .catch(() => setLoadError(true));
  }, []);

  useFocusEffect(load);

  const onSave = async () => {
    if (!form) return;
    setSaving(true);
    try {
      const experienceYears = form.experienceYears.trim() ? Number(form.experienceYears) : null;
      if (experienceYears != null && (!Number.isFinite(experienceYears) || experienceYears < 0)) {
        Alert.alert("Invalid experience", "Enter a whole number of years.");
        setSaving(false);
        return;
      }

      const updated = await driverApi.updateProfile({
        name: { salutation: driver?.name?.salutation ?? null, firstName: form.firstName, lastName: form.lastName },
        gender: form.gender || null,
        alternatePhone: form.alternatePhone || null,
        email: form.email || null,
        address: { formattedAddress: form.address || null, city: null, state: null, pincode: null, countryCode: null },
        // Always sends the object (never null) so clearing the text field
        // actually clears the stored value, same convention `address` above
        // already uses -- the backend only skips a field when the request's
        // top-level field itself is null (see DriverAppService#updateOwnProfile).
        garageLocation: { formattedAddress: form.garageLocation || null, googlePlaceId: null, latitude: null, longitude: null },
        experienceYears,
      });
      setDriver(updated);
      setForm(toForm(updated));
      setEditing(false);
    } catch (e) {
      Alert.alert("Couldn't save", e instanceof Error ? e.message : "Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const onCancel = () => {
    if (driver) setForm(toForm(driver));
    setEditing(false);
  };

  return (
    <ScreenContainer
      footer={
        editing ? (
          <View style={{ flexDirection: "row", gap: spacing.sm }}>
            <Button label="Cancel" variant="secondary" style={{ flex: 1 }} onPress={onCancel} disabled={saving} />
            <Button label="Save" style={{ flex: 1 }} onPress={onSave} loading={saving} />
          </View>
        ) : undefined
      }
    >
      <ScreenHeader
        onBack={navigation.canGoBack() ? () => navigation.goBack() : undefined}
        title="Profile Info"
        right={
          !editing && driver ? (
            <Pressable onPress={() => setEditing(true)} hitSlop={8} accessibilityRole="button" accessibilityLabel="Edit profile">
              <Text style={styles.editLabel}>Edit</Text>
            </Pressable>
          ) : undefined
        }
      />

      {loadError ? <InlineErrorBanner message="Couldn't load your profile." onRetry={load} /> : null}

      {form ? (
        <>
          <Card>
            <Text style={styles.sectionLabel}>Personal details</Text>
            <TextField
              label="First name"
              value={form.firstName}
              onChangeText={(t) => setForm((f) => f && { ...f, firstName: t })}
              editable={editing}
              containerStyle={styles.field}
            />
            <TextField
              label="Last name"
              value={form.lastName}
              onChangeText={(t) => setForm((f) => f && { ...f, lastName: t })}
              editable={editing}
              containerStyle={styles.field}
            />
            <TextField
              label="Gender"
              value={form.gender}
              onChangeText={(t) => setForm((f) => f && { ...f, gender: t })}
              editable={editing}
              containerStyle={styles.field}
            />
            <TextField
              label="Alternate phone"
              value={form.alternatePhone}
              onChangeText={(t) => setForm((f) => f && { ...f, alternatePhone: t })}
              editable={editing}
              keyboardType="phone-pad"
              containerStyle={styles.field}
            />
            <TextField
              label="Email"
              value={form.email}
              onChangeText={(t) => setForm((f) => f && { ...f, email: t })}
              editable={editing}
              keyboardType="email-address"
              containerStyle={styles.field}
            />
            <TextField
              label="Address"
              value={form.address}
              onChangeText={(t) => setForm((f) => f && { ...f, address: t })}
              editable={editing}
              containerStyle={styles.field}
            />
          </Card>

          <View style={{ height: spacing.lg }} />

          <Card>
            <Text style={styles.sectionLabel}>Garage & experience</Text>
            <TextField
              label="Garage location"
              value={form.garageLocation}
              onChangeText={(t) => setForm((f) => f && { ...f, garageLocation: t })}
              editable={editing}
              placeholder="Where you usually start duties from"
              containerStyle={styles.field}
            />
            <TextField
              label="Years of experience"
              value={form.experienceYears}
              onChangeText={(t) => setForm((f) => f && { ...f, experienceYears: t.replace(/[^0-9]/g, "") })}
              editable={editing}
              keyboardType="number-pad"
              placeholder="e.g. 5"
              containerStyle={styles.field}
            />
          </Card>

          <View style={{ height: spacing.lg }} />

          <Card>
            <Text style={styles.sectionLabel}>Account & documents</Text>
            <TextField label="Mobile number" value={driver?.phone ?? ""} editable={false} containerStyle={styles.field} />
            <TextField label="Driving Licence" value={driver?.licenseNumber ?? "Not on file"} editable={false} containerStyle={styles.field} />
            <TextField label="Aadhaar" value={driver?.adharNumber ?? "Not on file"} editable={false} containerStyle={styles.field} />
            <Button
              label="Manage documents"
              variant="secondary"
              onPress={() => navigation.navigate("Documents")}
              style={{ marginTop: spacing.sm }}
            />
          </Card>
        </>
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  sectionLabel: { ...type.caption, color: colors.textMuted, marginBottom: spacing.sm, textTransform: "uppercase" },
  field: { marginBottom: spacing.sm },
  editLabel: { ...type.body1, color: colors.primary, fontWeight: "600" },
});
